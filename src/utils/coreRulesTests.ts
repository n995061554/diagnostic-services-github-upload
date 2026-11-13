/**
 * Core Rules Verification & Audit Test Suite
 * Executes 24 Mandatory Automated Tests proving strict adherence to:
 * - CORE RULE 1: Server-Side Product Visibility Precedence
 * - CORE RULE 2: Backend is the Only Pricing Authority
 * - CORE RULE 3: Immutable Order Price Snapshots & Idempotency
 * - Maker-Checker Governance & Tamper Proofing
 */

import { CoreRuleTestResult, CoreRulesAuditSummary } from '../types';

export async function runCoreRulesTestSuite(authHeader?: string): Promise<{
  summary: CoreRulesAuditSummary;
  results: CoreRuleTestResult[];
}> {
  try {
    const res = await fetch('/api/v1/system/core-rules-tests/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });

    if (res.ok) {
      const data = await res.json();
      return {
        summary: data.summary,
        results: data.results
      };
    } else {
      throw new Error(`Server returned error status ${res.status}`);
    }
  } catch (err: any) {
    console.error('Failed to run core rules test suite:', err);
    throw err;
  }
}
