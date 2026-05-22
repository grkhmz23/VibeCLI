export type Theme = {
    color: boolean;
    cyan(value: string): string;
    gray(value: string): string;
    yellow(value: string): string;
    red(value: string): string;
    green(value: string): string;
    bold(value: string): string;
};
export declare function createTheme(options?: {
    color?: boolean;
}): Theme;
