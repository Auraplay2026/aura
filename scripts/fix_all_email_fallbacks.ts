import fs from 'fs';
import path from 'path';

const replacements: { file: string; find: string | RegExp; replace: string }[] = [
  // Admin dashboard components — replace email fallback with username || email || "admin"
  {
    file: 'app/(admin)/admin/analytics/ClientUserAnalytics.tsx',
    find: /currentUser\?\.email \|\| "twintubrovquattro@gmail\.com"/g,
    replace: 'currentUser?.username || currentUser?.email || "admin"'
  },
  {
    file: 'app/(admin)/admin/deposits/ClientDepositsDashboard.tsx',
    find: /currentUser\?\.email \|\| "twintubrovquattro@gmail\.com"/g,
    replace: 'currentUser?.username || currentUser?.email || "admin"'
  },
  {
    file: 'app/(admin)/admin/payment-settings/ClientPaymentSettingsDashboard.tsx',
    find: /currentUser\?\.email \|\| "twintubrovquattro@gmail\.com"/g,
    replace: 'currentUser?.username || currentUser?.email || "admin"'
  },
  {
    file: 'app/(admin)/admin/rtp-monitor/ClientRtpMonitorDashboard.tsx',
    find: /currentUser\?\.email \|\| "twintubrovquattro@gmail\.com"/g,
    replace: 'currentUser?.username || currentUser?.email || "admin"'
  },
  {
    file: 'app/(admin)/admin/whatsapp-settings/ClientWhatsAppSettingsDashboard.tsx',
    find: /currentUser\?\.email \|\| "twintubrovquattro@gmail\.com"/g,
    replace: 'currentUser?.username || currentUser?.email || "admin"'
  },
  // Admin actions.ts — fix the admin email allowlist and default parameter
  {
    file: 'app/(admin)/admin/actions.ts',
    find: 'clientAdminEmail === "twintubrovquattro@gmail.com" ||',
    replace: '// Admin email allowlist uses verified session only'
  },
  {
    file: 'app/(admin)/admin/actions.ts',
    find: 'adminEmail: string = "twintubrovquattro@gmail.com"',
    replace: 'adminEmail: string = "admin"'
  },
  // Sportsbook page
  {
    file: 'app/(public)/sportsbook/[...sport]/page.tsx',
    find: /currentUser\?\.email \|\| "twintubrovquattro@gmail\.com"/g,
    replace: 'currentUser?.username || currentUser?.email || ""'
  },
  // Support chat route
  {
    file: 'app/api/support/chat/route.ts',
    find: '{ email: "twintubrovquattro@gmail.com" }',
    replace: '{ email: "admin" }'
  },
  // Notification service
  {
    file: 'lib/notificationService.ts',
    find: "const adminEmail = process.env.ADMIN_EMAIL || 'twintubrovquattro@gmail.com';",
    replace: "const adminEmail = process.env.ADMIN_EMAIL || 'admin';"
  }
];

const root = path.resolve(__dirname, '..');
let updated = 0;
let failed = 0;

for (const r of replacements) {
  const filePath = path.join(root, r.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`SKIP (not found): ${r.file}`);
    failed++;
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  if (r.find instanceof RegExp) {
    content = content.replace(r.find, r.replace);
  } else {
    // Replace all occurrences of the literal string
    while (content.includes(r.find as string)) {
      content = content.replace(r.find as string, r.replace);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`UPDATED: ${r.file}`);
    updated++;
  } else {
    console.warn(`NO CHANGE: ${r.file} (pattern not found)`);
  }
}

console.log(`\nDone: ${updated} files updated, ${failed} skipped.`);
