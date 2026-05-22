import {
  envExampleScanner,
  packageScriptScanner,
  protectedFileTouchScanner,
  secretPatternScanner,
  testPresenceScanner
} from "./builtin.js";
import type { ScannerContext, ScannerResult } from "./types.js";

export type Scanner = (context: ScannerContext) => Promise<ScannerResult>;

export const builtinScanners: Scanner[] = [
  protectedFileTouchScanner,
  secretPatternScanner,
  envExampleScanner,
  packageScriptScanner,
  testPresenceScanner
];

export async function runBuiltinScanners(context: ScannerContext): Promise<ScannerResult[]> {
  const results: ScannerResult[] = [];
  for (const scanner of builtinScanners) {
    results.push(await scanner(context));
  }
  return results;
}
