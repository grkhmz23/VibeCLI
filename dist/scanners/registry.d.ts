import type { ScannerContext, ScannerResult } from "./types.js";
export type Scanner = (context: ScannerContext) => Promise<ScannerResult>;
export declare const builtinScanners: Scanner[];
export declare function runBuiltinScanners(context: ScannerContext): Promise<ScannerResult[]>;
