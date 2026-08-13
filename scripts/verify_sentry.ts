import 'dotenv/config';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  enableLogs: true,
  debug: true,
});

async function verifySentry() {
  console.log("Sending verification event to Sentry DSN:", process.env.SENTRY_DSN);
  const testError = new Error("AURA Sentry Live Verification Error");
  const eventId = Sentry.captureException(testError);
  console.log("Captured Exception with Sentry Event ID:", eventId);
  
  const flushed = await Sentry.flush(5000);
  console.log("Flushed to Sentry server:", flushed ? "SUCCESS ✅" : "TIMEOUT ⚠️");
}

verifySentry().catch(console.error);
