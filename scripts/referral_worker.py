#!/usr/bin/env python3
"""
AuraBet Referral Commission Worker
===================================
Polls the PostgreSQL database every 30 seconds for new bets placed
by referred users and credits commission to their referrers.

Architecture:
  - Reads "Transaction" table for bets (type='trade', walletType='real')
  - Looks up each bettor's referredBy → finds referrer's affiliateCode
  - Calculates commission based on referral tier (10/15/20/25%)
  - Credits referrer's affiliateEarnings AND realBalance
  - Tracks processed transactions in a local watermark file to avoid double-paying

Usage:
  python3 referral_worker.py

Environment variables (set in .env or as shell vars):
  DATABASE_URL   — PostgreSQL connection string (same as the Next.js app)

Deployment on Render:
  Add as a Background Worker service pointing to this file.
  Set DATABASE_URL as an environment variable matching the web service.
"""

import os
import sys
import time
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

# ── Dependency check ──────────────────────────────────────────────────────────
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()         # load .env from current dir
    load_dotenv(".env")   # also try explicit .env
except ImportError:
    pass  # dotenv optional — env vars may be set directly

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger("referral_worker")

# ── Configuration ─────────────────────────────────────────────────────────────
POLL_INTERVAL_SECONDS = 30          # how often to poll the DB
COMMISSION_TIERS = [
    {"min": 0,  "max": 5,   "rate": 0.10},   # Bronze — 10%
    {"min": 6,  "max": 20,  "rate": 0.15},   # Silver — 15%
    {"min": 21, "max": 50,  "rate": 0.20},   # Gold   — 20%
    {"min": 51, "max": 9999,"rate": 0.25},   # Plat   — 25%
]
HOUSE_EDGE_RATE = 0.045             # platform's average 4.5% margin on each wager
WATERMARK_FILE = Path(__file__).parent / ".referral_worker_watermark.json"
MIN_WAGER_FOR_COMMISSION = 10.0     # don't bother for tiny test wagers (₹ < 10)

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_commission_rate(referral_count: int) -> float:
    """Return commission rate (0.0–1.0) based on referrer's total referral count."""
    for tier in reversed(COMMISSION_TIERS):
        if referral_count >= tier["min"]:
            return tier["rate"]
    return COMMISSION_TIERS[0]["rate"]


def get_tier_name(referral_count: int) -> str:
    names = ["Bronze", "Silver", "Gold", "Platinum"]
    for i, tier in enumerate(reversed(COMMISSION_TIERS)):
        if referral_count >= tier["min"]:
            return names[len(COMMISSION_TIERS) - 1 - i]
    return "Bronze"


def load_watermark() -> dict:
    """Load processed state from local file (survives restarts)."""
    if WATERMARK_FILE.exists():
        try:
            with open(WATERMARK_FILE) as f:
                return json.load(f)
        except Exception:
            pass
    return {"processed_tx_ids": [], "last_run_ts": 0}


def save_watermark(state: dict):
    """Persist watermark state to disk."""
    try:
        with open(WATERMARK_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        log.warning(f"Could not save watermark: {e}")


def get_db_url() -> str:
    """Get the DATABASE_URL from environment, with fallback."""
    url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("database_url")
        or os.environ.get("POSTGRES_URL")
    )
    if not url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set.\n"
            "Export it before running: export DATABASE_URL='postgresql://...'"
        )
    return url


def connect_db(db_url: str):
    """Create and return a psycopg2 connection."""
    conn = psycopg2.connect(db_url, cursor_factory=psycopg2.extras.RealDictCursor)
    conn.autocommit = False
    return conn


# ── Core Worker Logic ─────────────────────────────────────────────────────────

def process_commissions(conn, watermark: dict) -> int:
    """
    Main commission processing loop.
    Returns count of commissions paid in this cycle.
    """
    import re
    processed_ids: set = set(watermark.get("processed_tx_ids", []))
    commissions_paid = 0

    with conn.cursor() as cur:

        # ── 1. Fetch all real-wallet bets not yet processed ───────────────────
        cur.execute("""
            SELECT
                t.id          AS tx_id,
                t.type        AS tx_type,
                t."userId"    AS bettor_user_id,
                t.amount      AS tx_amount,
                t.timestamp   AS ts,
                t.details     AS details,
                u.email       AS bettor_email,
                u."referredBy" AS referred_by_code,
                u."accountType"
            FROM "Transaction" t
            JOIN "User" u ON t."userId" = u.id
            WHERE
                (
                  (t.type = 'trade' AND t.status = 'Pending')
                  OR
                  (t.type = 'casino' AND t.status = 'Completed')
                )
                AND t."walletType" = 'real'
                AND u."referredBy" IS NOT NULL
                AND u."referredBy" != ''
            ORDER BY t.timestamp ASC
        """)

        bets = cur.fetchall()

        if not bets:
            return 0

        log.info(f"Found {len(bets)} real bets from referred users to evaluate...")

        # ── 2. For each bet, credit the referrer ─────────────────────────────
        for bet in bets:
            tx_id = bet["tx_id"]

            # Skip already-processed
            if tx_id in processed_ids:
                continue

            tx_type = bet["tx_type"]
            tx_amount = float(bet["tx_amount"])
            referral_code = bet["referred_by_code"]
            bettor_email = bet["bettor_email"]
            details = bet["details"] or ""

            # Calculate actual wager amount
            if tx_type == "casino":
                # Parse wager from details: e.g. "Played Hilo (Wager: ₹100, Payout: ₹0)"
                match = re.search(r"Wager:\s*₹?\s*([\d.]+)", details)
                if match:
                    wager = float(match.group(1))
                else:
                    wager = tx_amount
            else:
                wager = tx_amount

            # Check minimum wager requirement
            if wager < MIN_WAGER_FOR_COMMISSION:
                processed_ids.add(tx_id)
                continue

            # Find the referrer by their affiliateCode
            cur.execute("""
                SELECT
                    id, email, "affiliateEarnings", "realBalance",
                    "referralCount", username
                FROM "User"
                WHERE "affiliateCode" = %s
            """, (referral_code,))

            referrer = cur.fetchone()
            if not referrer:
                # Orphaned referral code — mark as processed to skip next time
                log.warning(
                    f"  Bet {tx_id}: referral code '{referral_code}' not found in DB. Skipping."
                )
                processed_ids.add(tx_id)
                continue

            referrer_email = referrer["email"]
            referral_count = int(referrer["referralCount"] or 0)
            current_earnings = float(referrer["affiliateEarnings"] or 0)
            current_balance = float(referrer["realBalance"] or 0)

            # ── 3. Calculate commission ───────────────────────────────────────
            commission_rate = get_commission_rate(referral_count)
            # Commission = wager × house edge × commission rate
            commission_amount = round(wager * HOUSE_EDGE_RATE * commission_rate, 2)

            if commission_amount <= 0:
                processed_ids.add(tx_id)
                continue

            tier = get_tier_name(referral_count)

            new_earnings = round(current_earnings + commission_amount, 2)
            new_balance  = round(current_balance + commission_amount, 2)

            # ── 4. Write commission to referrer ───────────────────────────────
            try:
                cur.execute("""
                    UPDATE "User"
                    SET
                        "affiliateEarnings" = %s,
                        "realBalance"       = %s,
                        "updatedAt"         = NOW()
                    WHERE id = %s
                """, (new_earnings, new_balance, referrer["id"]))

                # Insert a commission transaction record for the referrer
                commission_tx_id = f"COMM-{uuid.uuid4().hex[:12].upper()}"
                cur.execute("""
                    INSERT INTO "Transaction"
                        (id, "userId", type, amount, "balanceAfter", timestamp,
                         details, status, "walletType")
                    VALUES (%s, %s, 'deposit', %s, %s, %s, %s, 'Completed', 'real')
                """, (
                    commission_tx_id,
                    referrer["id"],
                    commission_amount,
                    new_balance,
                    int(time.time() * 1000),
                    f"Referral commission ({tier} {commission_rate*100:.0f}%) "
                    f"from {bettor_email} wager ₹{wager:.2f} → ₹{commission_amount:.2f}"
                ))

                conn.commit()
                processed_ids.add(tx_id)
                commissions_paid += 1

                log.info(
                    f"  ✅ Commission paid: ₹{commission_amount:.2f} "
                    f"to {referrer_email} ({tier} {commission_rate*100:.0f}%) "
                    f"← bettor {bettor_email}, wager ₹{wager:.2f}, bet {tx_id}"
                )

            except Exception as e:
                conn.rollback()
                log.error(f"  ❌ Failed to credit commission for bet {tx_id}: {e}")

    # ── 5. Trim processed IDs list (keep last 50k to bound file size) ─────────
    processed_list = list(processed_ids)
    if len(processed_list) > 50000:
        processed_list = processed_list[-50000:]

    watermark["processed_tx_ids"] = processed_list
    watermark["last_run_ts"] = int(time.time())
    save_watermark(watermark)

    return commissions_paid


def run_stats(conn):
    """Print a summary of the referral program stats."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                COUNT(*)              AS total_referred_users,
                SUM("affiliateEarnings") AS total_commissions_paid,
                COUNT(DISTINCT "affiliateCode") FILTER (WHERE "affiliateCode" IS NOT NULL)
                                      AS total_affiliates
            FROM "User"
            WHERE "referredBy" IS NOT NULL AND "referredBy" != ''
        """)
        row = cur.fetchone()
        if row:
            log.info(
                f"📊 Referral Stats → "
                f"Total referred users: {row['total_referred_users']} | "
                f"Total commissions paid: ₹{row['total_commissions_paid'] or 0:.2f} | "
                f"Active affiliates: {row['total_affiliates']}"
            )


# ── Main Loop ─────────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("AuraBet Referral Commission Worker starting...")
    log.info(f"Poll interval: {POLL_INTERVAL_SECONDS}s")
    log.info(f"House edge rate: {HOUSE_EDGE_RATE*100:.1f}%")
    log.info(f"Tier rates: Bronze 10% | Silver 15% | Gold 20% | Platinum 25%")
    log.info(f"Watermark file: {WATERMARK_FILE}")
    log.info("=" * 60)

    db_url = get_db_url()
    log.info(f"Connecting to database...")

    # Test connection
    try:
        conn = connect_db(db_url)
        log.info("✅ Database connection established.")
    except Exception as e:
        log.error(f"❌ Could not connect to database: {e}")
        sys.exit(1)

    watermark = load_watermark()
    log.info(
        f"Loaded watermark: {len(watermark.get('processed_tx_ids', []))} "
        f"previously processed transactions."
    )

    cycle = 0
    while True:
        cycle += 1
        try:
            # Reconnect if connection dropped
            if conn.closed:
                log.info("Reconnecting to database...")
                conn = connect_db(db_url)

            log.info(f"─── Cycle #{cycle} ─── {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ───")

            paid = process_commissions(conn, watermark)
            if paid > 0:
                log.info(f"✅ Cycle #{cycle} complete: {paid} commission(s) paid.")
            else:
                log.info(f"✓  Cycle #{cycle}: No new commissions to process.")

            # Print stats every 10 cycles (~5 minutes)
            if cycle % 10 == 0:
                run_stats(conn)

        except psycopg2.OperationalError as e:
            log.error(f"Database error (will retry): {e}")
            try:
                conn.close()
            except Exception:
                pass
            conn = None
            time.sleep(5)
            try:
                conn = connect_db(db_url)
            except Exception as e2:
                log.error(f"Reconnection failed: {e2}")

        except KeyboardInterrupt:
            log.info("Shutting down gracefully...")
            if conn and not conn.closed:
                conn.close()
            break

        except Exception as e:
            log.error(f"Unexpected error in cycle #{cycle}: {e}", exc_info=True)

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
