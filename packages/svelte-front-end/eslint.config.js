import { fileURLToPath } from "node:url"
import prettier from "eslint-config-prettier"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import ts from "typescript-eslint"
import { includeIgnoreFile } from "@eslint/compat"
import js from "@eslint/js"

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url))

export const namingConvention = [
  {
    selector: "default",
    format: ["camelCase", "UPPER_CASE"],
    leadingUnderscore: "allow",
    trailingUnderscore: "allow",
  },
  {
    selector: "import",
    format: null,
  },
  {
    selector: "variable",
    format: ["camelCase", "PascalCase", "UPPER_CASE"],
    leadingUnderscore: "allow",
    trailingUnderscore: "allow",
  },
  {
    selector: "function",
    format: ["camelCase", "PascalCase"],
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  },
  {
    selector: "objectLiteralProperty",
    format: null,
  },
]

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  prettier,
  ...svelte.configs["flat/prettier"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/naming-convention": ["error", ...namingConvention],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "svelte/no-navigation-without-resolve": [
        "error",
        {
          ignoreLinks: true,
        },
      ],
    },
  },
  {
    ignores: ["build/", ".svelte-kit/", "dist/"],
  },
)
