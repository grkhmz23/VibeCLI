import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      ".vibecli/**",
      ".pnpm-cache/**",
      ".pnpm-data/**"
    ]
  }
);
