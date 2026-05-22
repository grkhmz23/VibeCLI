export type Theme = {
  color: boolean;
  cyan(value: string): string;
  gray(value: string): string;
  yellow(value: string): string;
  red(value: string): string;
  green(value: string): string;
  bold(value: string): string;
};

function wrap(enabled: boolean, open: string, close = "\x1b[0m"): (value: string) => string {
  return (value) => (enabled ? `${open}${value}${close}` : value);
}

export function createTheme(options: { color?: boolean } = {}): Theme {
  const color = options.color ?? (!process.env.NO_COLOR && process.stdout.isTTY);
  return {
    color,
    cyan: wrap(color, "\x1b[36m"),
    gray: wrap(color, "\x1b[90m"),
    yellow: wrap(color, "\x1b[33m"),
    red: wrap(color, "\x1b[31m"),
    green: wrap(color, "\x1b[32m"),
    bold: wrap(color, "\x1b[1m")
  };
}
