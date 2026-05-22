import type { ScannerContext, ScannerResult } from "./types.js";
export declare function protectedFileTouchScanner(context: ScannerContext): Promise<ScannerResult>;
export declare function secretPatternScanner(context: ScannerContext): Promise<ScannerResult>;
export declare function envExampleScanner(context: ScannerContext): Promise<ScannerResult>;
export declare function packageScriptScanner(context: ScannerContext): Promise<ScannerResult>;
export declare function testPresenceScanner(context: ScannerContext): Promise<ScannerResult>;
