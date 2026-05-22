function wrap(enabled, open, close = "\x1b[0m") {
    return (value) => (enabled ? `${open}${value}${close}` : value);
}
export function createTheme(options = {}) {
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
//# sourceMappingURL=theme.js.map