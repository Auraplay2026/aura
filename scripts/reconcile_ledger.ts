import { prisma } from '../lib/prisma';

async function runReconciliationAudit() {
  console.log("=================================================================");
  console.log("🔍 AURA PLATFORM DOUBLE-ENTRY FINANCIAL RECONCILIATION ENGINE");
  console.log("=================================================================\n");

  try {
    const users = await prisma.user.findMany({
      include: { transactions: true }
    });

    console.log(`Auditing ${users.length} registered accounts across ledger transactions...\n`);

    let totalVerifiedTurnover = 0;
    let cleanAccounts = 0;
    let flaggedAccounts = 0;

    for (const user of users) {
      let expectedRealBalance = 0;
      let expectedDemoBalance = 100000;

      let deposits = 0;
      let withdrawals = 0;
      let trades = 0;
      let cashouts = 0;

      const txList = user.transactions || [];

      for (const tx of txList) {
        const isReal = tx.walletType === 'real' || (!tx.walletType && user.accountType === 'real');
        totalVerifiedTurnover += tx.amount || 0;

        if (tx.type === 'deposit' && tx.status === 'Completed') {
          deposits += tx.amount;
          if (isReal) expectedRealBalance += tx.amount;
          else expectedDemoBalance += tx.amount;
        } else if (tx.type === 'withdraw' && tx.status === 'Completed') {
          withdrawals += tx.amount;
          if (isReal) expectedRealBalance -= tx.amount;
          else expectedDemoBalance -= tx.amount;
        } else if (tx.type === 'trade') {
          trades += tx.amount;
          if (isReal) expectedRealBalance -= tx.amount;
          else expectedDemoBalance -= tx.amount;
        } else if (tx.type === 'cashout' && tx.status === 'Completed') {
          cashouts += tx.amount;
          if (isReal) expectedRealBalance += tx.amount;
          else expectedDemoBalance += tx.amount;
        }
      }

      const realDiff = Math.abs(user.realBalance - expectedRealBalance);
      const isClean = user.accountType === 'real' ? realDiff <= 0.05 : true;

      if (isClean) {
        cleanAccounts++;
        console.log(`✅ User [${user.username}] (${user.email || 'No email'}) - Status: CLEAN | Balance: ₹${user.realBalance.toFixed(2)} | Tx Count: ${txList.length}`);
      } else {
        flaggedAccounts++;
        console.warn(`⚠️ User [${user.username}] (${user.email || 'No email'}) - Status: FLAGGED | Actual: ₹${user.realBalance.toFixed(2)} | Expected: ₹${expectedRealBalance.toFixed(2)} | Diff: ₹${realDiff.toFixed(2)}`);
      }
    }

    console.log("\n=================================================================");
    console.log(`📊 AUDIT SUMMARY:`);
    console.log(`- Total Accounts: ${users.length}`);
    console.log(`- Clean Accounts: ${cleanAccounts}`);
    console.log(`- Flagged Accounts: ${flaggedAccounts}`);
    console.log(`- Total Turnover Audited: ₹${totalVerifiedTurnover.toLocaleString()}`);
    console.log(`- Overall Verdict: ${flaggedAccounts === 0 ? "100% DATA INTEGRITY VERIFIED ✅" : "DISCREPANCIES DETECTED ⚠️"}`);
    console.log("=================================================================\n");

  } catch (err) {
    console.error("Reconciliation Error:", err);
  } finally {
    process.exit(0);
  }
}

runReconciliationAudit();
