#!/usr/bin/env node

/**
 * TEST RUNNER: Fair Games Verification
 * 
 * Runs all game simulations and generates reports
 * 
 * Usage: npx tsx scripts/test-fair-games.ts
 */

import { runAllGameSimulations, formatSimulationReport } from '../lib/game-simulation';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('\n🎰 AURA FAIR GAMES TESTING SUITE\n');
  console.log('Starting fairness verification...\n');

  try {
    const results = await runAllGameSimulations();

    // Generate report
    const report = formatSimulationReport(results);

    // Save report
    const reportPath = path.join(process.cwd(), 'FAIRNESS_VERIFICATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // JSON results for programmatic use
    const jsonPath = path.join(process.cwd(), 'fairness-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`📊 JSON results saved to: ${jsonPath}`);

    // Check if all passed
    const allPassed = results.every((r) => r.status !== 'FAIL');
    if (allPassed) {
      console.log('\n✅ ALL FAIRNESS CHECKS PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ SOME GAMES FAILED FAIRNESS CHECK');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
