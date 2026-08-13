import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  console.log("Triggering Sentry test error verification...");
  const testError = new Error("AURA Production Verification Test Error");
  Sentry.captureException(testError);
  
  // Flush event buffer to ensure it reaches Sentry ingest server before response finishes
  await Sentry.flush(3000);
  
  return NextResponse.json({
    success: true,
    message: "Sentry verification test error captured and flushed to Sentry server!"
  });
}
