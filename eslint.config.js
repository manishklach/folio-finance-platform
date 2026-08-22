import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["data/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  {
    files: ["server.js", "lib/**/*.js", "test/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
    },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
  },
];
