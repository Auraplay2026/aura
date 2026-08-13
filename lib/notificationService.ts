import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { findUserByEmail } from '@/lib/userDb';

export interface NotificationLog {
  id: string;
  timestamp: number;
  userEmail: string;
  amount: number;
  utr: string;
  type: 'deposit_pending' | 'deposit_approved' | 'deposit_rejected' | 'withdrawal_pending' | 'withdrawal_approved' | 'withdrawal_rejected';
  emailDispatch: { status: 'SUCCESS' | 'FAILED' | 'UNCONFIGURED'; error?: string };
  smsDispatch: { status: 'SUCCESS' | 'FAILED' | 'UNCONFIGURED'; error?: string };
  whatsappDispatch: { status: 'SUCCESS' | 'FAILED' | 'UNCONFIGURED'; error?: string };
}

const LOG_FILE = path.join(process.cwd(), 'data', 'notifications_sent.json');
const WA_CONFIG_FILE = path.join(process.cwd(), 'data', 'whatsapp_config.json');

function initLogFile() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Config Store  (persisted to data/whatsapp_config.json)
// ─────────────────────────────────────────────────────────────────────────────
export interface WhatsAppConfig {
  enabled: boolean;
  provider: 'meta' | 'twilio' | 'callmebot';

  // Meta WhatsApp Business Cloud API
  metaPhoneNumberId: string;  // From Meta Business → WhatsApp → Phone numbers
  metaAccessToken: string;    // Permanent access token from Meta Business
  metaTemplateName: string;   // e.g. "deposit_confirmation"
  metaTemplateLanguage: string; // e.g. "en_US"

  // Twilio WhatsApp Sandbox / Business
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsAppFrom: string; // "whatsapp:+14155238886"

  // CallMeBot (simplest — no verification needed, just activate once)
  callMeBotApiKey: string;
  callMeBotPhone: string; // Admin phone for admin alerts e.g. "+919876543210"

  // Admin WhatsApp number to receive deposit alerts
  adminWhatsAppNumber: string; // "+91XXXXXXXXXX"

  // Whether to also notify the user (they must have phone in profile)
  notifyUser: boolean;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  try {
    if (fs.existsSync(WA_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(WA_CONFIG_FILE, 'utf-8'));
    }
  } catch {}
  return {
    enabled: false,
    provider: 'callmebot',
    metaPhoneNumberId: '',
    metaAccessToken: '',
    metaTemplateName: 'deposit_notification',
    metaTemplateLanguage: 'en',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsAppFrom: 'whatsapp:+14155238886',
    callMeBotApiKey: '',
    callMeBotPhone: '',
    adminWhatsAppNumber: '',
    notifyUser: true,
  };
}

export function saveWhatsAppConfig(config: WhatsAppConfig): void {
  const dir = path.dirname(WA_CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(WA_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Templates
// ─────────────────────────────────────────────────────────────────────────────
function buildMessage(
  type: NotificationLog['type'],
  data: { username: string; amount: number; utr?: string; balance?: number; reason?: string; txnId?: string }
): string {
  const amt = `₹${data.amount.toLocaleString('en-IN')}`;
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  switch (type) {
    case 'deposit_pending':
      return (
        `🟡 *AuraBet — Deposit Received*\n\n` +
        `Hi *${data.username}*, your deposit request has been received and is under review.\n\n` +
        `💰 Amount: *${amt}*\n` +
        `🔖 UTR / Ref: \`${data.utr || 'N/A'}\`\n` +
        `🕐 Time: ${time}\n\n` +
        `We will credit your wallet within *15–30 minutes* after verification.\n\n` +
        `_AuraBet — India's #1 Cloud Gaming & Betting Platform_`
      );

    case 'deposit_approved':
      return (
        `✅ *AuraBet — Deposit Approved!*\n\n` +
        `Hi *${data.username}*, your deposit has been verified and credited! 🎉\n\n` +
        `💰 Credited: *${amt}*\n` +
        `💼 New Wallet Balance: *₹${(data.balance || 0).toLocaleString('en-IN')}*\n` +
        `🔖 UTR / Ref: \`${data.utr || 'N/A'}\`\n` +
        `🕐 Time: ${time}\n\n` +
        `Your funds are ready. Start playing now! 🚀\n` +
        `👉 https://aurabet.io/casino\n\n` +
        `_AuraBet — Play Smart. Win Big._`
      );

    case 'deposit_rejected':
      return (
        `❌ *AuraBet — Deposit Declined*\n\n` +
        `Hi *${data.username}*, unfortunately your deposit could not be verified.\n\n` +
        `💰 Amount: *${amt}*\n` +
        `🔖 UTR / Ref: \`${data.utr || 'N/A'}\`\n` +
        `📋 Reason: ${data.reason || 'Reference not found'}\n` +
        `🕐 Time: ${time}\n\n` +
        `Please contact support or retry with a valid payment screenshot.\n` +
        `📞 Support: https://aurabet.io/support\n\n` +
        `_AuraBet Support Team_`
      );

    case 'withdrawal_pending':
      return (
        `🔄 *AuraBet — Withdrawal Initiated*\n\n` +
        `Hi *${data.username}*, your withdrawal request is being processed.\n\n` +
        `💸 Amount: *${amt}*\n` +
        `🕐 Time: ${time}\n\n` +
        `Expected processing time: *2–4 hours*.\n\n` +
        `_AuraBet — Your winnings, on the way._`
      );

    case 'withdrawal_approved':
      return (
        `✅ *AuraBet — Withdrawal Processed!*\n\n` +
        `Hi *${data.username}*, your withdrawal has been approved and sent! 💸\n\n` +
        `💸 Amount Sent: *${amt}*\n` +
        `🕐 Time: ${time}\n\n` +
        `The amount will reflect in your bank within 2–4 hours.\n\n` +
        `_AuraBet — India's #1 Cloud Gaming & Betting Platform_`
      );

    case 'withdrawal_rejected':
      return (
        `❌ *AuraBet — Withdrawal Declined*\n\n` +
        `Hi *${data.username}*, your withdrawal request was declined.\n\n` +
        `💰 Amount: *${amt}* (refunded to wallet)\n` +
        `📋 Reason: ${data.reason || 'Manual review required'}\n` +
        `🕐 Time: ${time}\n\n` +
        `Your balance has been restored. Contact support if you need help.\n` +
        `📞 https://aurabet.io/support\n\n` +
        `_AuraBet Support Team_`
      );

    default:
      return `AuraBet Notification for ${data.username}: ${amt}`;
  }
}

// Admin alert message (always goes to admin WhatsApp)
function buildAdminMessage(
  type: NotificationLog['type'],
  data: { userEmail: string; username: string; amount: number; utr?: string; phone?: string }
): string {
  const amt = `₹${data.amount.toLocaleString('en-IN')}`;
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  if (type === 'deposit_pending') {
    return (
      `🚨 *[ADMIN] New Deposit Request*\n\n` +
      `👤 User: ${data.username} (${data.userEmail})\n` +
      `📱 Phone: ${data.phone || 'N/A'}\n` +
      `💰 Amount: *${amt}*\n` +
      `🔖 UTR: \`${data.utr || 'N/A'}\`\n` +
      `🕐 Time: ${time}\n\n` +
      `👉 *Action Required* — Approve or reject in Admin Panel:\n` +
      `https://aurabet.io/admin/deposits`
    );
  }
  if (type === 'withdrawal_pending') {
    return (
      `🚨 *[ADMIN] New Withdrawal Request*\n\n` +
      `👤 User: ${data.username} (${data.userEmail})\n` +
      `💸 Amount: *${amt}*\n` +
      `🕐 Time: ${time}\n\n` +
      `👉 *Action Required*:\n` +
      `https://aurabet.io/admin/deposits`
    );
  }
  return `[ADMIN] AuraBet Event: ${type} for ${data.userEmail} — ${amt}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Send Implementations
// ─────────────────────────────────────────────────────────────────────────────

// 1. CallMeBot (free, no server required — just activate once from the target phone)
//    Activation: Send "I allow callmebot to send me messages" to +34 644 52 74 86 on WhatsApp
async function sendViaCallMeBot(phone: string, apiKey: string, message: string): Promise<void> {
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CallMeBot error ${res.status}: ${text}`);
  }
}

// 2. Meta WhatsApp Business Cloud API (official free tier — 1000 convos/month free)
//    Requires: Meta Business Account → WhatsApp → Create phone → get Phone Number ID + Access Token
async function sendViaMeta(
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  message: string
): Promise<void> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: toPhone.replace(/[^0-9]/g, ''),
    type: 'text',
    text: { body: message }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(`Meta WhatsApp API error: ${JSON.stringify(json)}`);
  }
}

// 3. Twilio WhatsApp Sandbox/Business
async function sendViaTwilioWA(
  accountSid: string,
  authToken: string,
  from: string, // "whatsapp:+14155238886"
  to: string,   // will be prefixed with "whatsapp:"
  message: string
): Promise<void> {
  const client = twilio(accountSid, authToken);
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await client.messages.create({ body: message, from, to: toFormatted });
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Dispatch: send WhatsApp to a number using configured provider
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchWhatsApp(config: WhatsAppConfig, toPhone: string, message: string): Promise<void> {
  if (!toPhone || toPhone.trim().length < 10) throw new Error('Invalid phone number');

  if (config.provider === 'callmebot') {
    if (!config.callMeBotApiKey) throw new Error('CallMeBot API key not configured');
    await sendViaCallMeBot(toPhone, config.callMeBotApiKey, message);
  } else if (config.provider === 'meta') {
    if (!config.metaPhoneNumberId || !config.metaAccessToken) throw new Error('Meta credentials not configured');
    await sendViaMeta(config.metaPhoneNumberId, config.metaAccessToken, toPhone, message);
  } else if (config.provider === 'twilio') {
    if (!config.twilioAccountSid || !config.twilioAuthToken) throw new Error('Twilio credentials not configured');
    await sendViaTwilioWA(config.twilioAccountSid, config.twilioAuthToken, config.twilioWhatsAppFrom, toPhone, message);
  }
}

export async function sendTestWhatsApp(toPhone: string, message: string): Promise<void> {
  const config = getWhatsAppConfig();
  await dispatchWhatsApp(config, toPhone, message);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export: sendDepositNotification (existing API — backward compatible)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendDepositNotification(
  userEmail: string,
  amount: number,
  utr: string
): Promise<NotificationLog> {
  return sendTransactionNotification({ userEmail, amount, utr, type: 'deposit_pending' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Transaction Notification (pending / approved / rejected)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendTransactionNotification(opts: {
  userEmail: string;
  amount: number;
  utr?: string;
  type: NotificationLog['type'];
  reason?: string;
  newBalance?: number;
}): Promise<NotificationLog> {
  initLogFile();

  const { userEmail, amount, utr, type, reason, newBalance } = opts;
  const timestamp = Date.now();
  const id = `notif_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  // Resolve user profile (phone number, username)
  const user = await findUserByEmail(userEmail);
  const username = user?.username || userEmail.split('@')[0];
  const userPhone = user?.phoneNumber || '';

  const logEntry: NotificationLog = {
    id, timestamp, userEmail, amount, utr: utr || '', type,
    emailDispatch: { status: 'UNCONFIGURED' },
    smsDispatch: { status: 'UNCONFIGURED' },
    whatsappDispatch: { status: 'UNCONFIGURED' },
  };

  // ── 1. SMTP Email ──────────────────────────────────────────
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpFrom = process.env.SMTP_FROM || 'alerts@aurabet.io';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost, port: smtpPort, secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });
      const subjectMap: Record<NotificationLog['type'], string> = {
        deposit_pending:     `🟡 Deposit Request Received — ₹${amount.toLocaleString('en-IN')}`,
        deposit_approved:    `✅ Deposit Approved — ₹${amount.toLocaleString('en-IN')} Credited`,
        deposit_rejected:    `❌ Deposit Declined — ₹${amount.toLocaleString('en-IN')}`,
        withdrawal_pending:  `🔄 Withdrawal Initiated — ₹${amount.toLocaleString('en-IN')}`,
        withdrawal_approved: `✅ Withdrawal Processed — ₹${amount.toLocaleString('en-IN')}`,
        withdrawal_rejected: `❌ Withdrawal Declined — ₹${amount.toLocaleString('en-IN')}`,
      };
      const msg = buildMessage(type, { username, amount, utr, balance: newBalance, reason });
      await transporter.sendMail({
        from: `"AuraBet Alerts" <${smtpFrom}>`,
        to: type === 'deposit_pending' ? adminEmail : userEmail,
        subject: subjectMap[type],
        text: msg,
        html: `<pre style="font-family:monospace;background:#0f172a;color:#f8fafc;padding:20px;border-radius:8px;white-space:pre-wrap;">${msg}</pre>`
      });
      logEntry.emailDispatch = { status: 'SUCCESS' };
    } catch (err: any) {
      logEntry.emailDispatch = { status: 'FAILED', error: err.message };
    }
  }

  // ── 2. Twilio SMS ──────────────────────────────────────────
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  const adminPhone = process.env.ADMIN_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom && adminPhone && type === 'deposit_pending') {
    try {
      const client = twilio(twilioSid, twilioAuth);
      await client.messages.create({
        body: `AuraBet: ${username} deposited ₹${amount} | UTR: ${utr} | Review: aurabet.io/admin/deposits`,
        from: twilioFrom, to: adminPhone
      });
      logEntry.smsDispatch = { status: 'SUCCESS' };
    } catch (err: any) {
      logEntry.smsDispatch = { status: 'FAILED', error: err.message };
    }
  }

  // ── 3. WhatsApp Business ───────────────────────────────────
  const waConfig = getWhatsAppConfig();

  if (waConfig.enabled) {
    const adminMsg = buildAdminMessage(type, { userEmail, username, amount, utr, phone: userPhone });
    const userMsg  = buildMessage(type, { username, amount, utr, balance: newBalance, reason });

    // Always notify admin
    if (waConfig.adminWhatsAppNumber) {
      try {
        await dispatchWhatsApp(waConfig, waConfig.adminWhatsAppNumber, adminMsg);
        logEntry.whatsappDispatch = { status: 'SUCCESS' };
        console.log(`[WhatsApp] Admin alert sent via ${waConfig.provider}`);
      } catch (err: any) {
        logEntry.whatsappDispatch = { status: 'FAILED', error: err.message };
        console.error(`[WhatsApp] Admin alert failed:`, err.message);
      }
    }

    // Notify user on status changes (not on pending — avoid confusion)
    if (waConfig.notifyUser && userPhone && type !== 'deposit_pending' && type !== 'withdrawal_pending') {
      try {
        await dispatchWhatsApp(waConfig, userPhone, userMsg);
        console.log(`[WhatsApp] User notification sent to ${userPhone}`);
      } catch (err: any) {
        console.error(`[WhatsApp] User notification failed:`, err.message);
      }
    }
  } else {
    logEntry.whatsappDispatch = { status: 'UNCONFIGURED' };
  }

  // ── 4. Persist log ─────────────────────────────────────────
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    const logs: NotificationLog[] = JSON.parse(raw);
    logs.unshift(logEntry); // newest first
    if (logs.length > 500) logs.splice(500); // cap at 500
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write notification log:', err);
  }

  return logEntry;
}

export function getNotificationLogs(): NotificationLog[] {
  initLogFile();
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } catch {
    return [];
  }
}
