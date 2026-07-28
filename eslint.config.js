import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "dist/**",
      "release/**",
      "node_modules/**",
      "coverage/**",
      "playtest/output/**",
    ],
  },
  {
    files: [
      "src/**/*.js",
      "tests/**/*.js",
      "scripts/**/*.js",
      "scripts/**/*.mjs",
      "playtest/**/*.mjs",
      "electron/**/*.mjs",
      "vite.config.js",
      "eslint.config.js",
    ],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-throw-literal": "error",
      "no-duplicate-imports": "error",
    },
  },
];
