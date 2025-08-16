import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { 
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_"
        }
      ],
      "no-unreachable": "warn",
      "no-empty": "warn",
      "no-empty-function": "warn",
      "no-unused-expressions": "warn",
      "no-warning-comments": ["warn", { terms: ["TODO", "FIXME", "WIP", "EXPERIMENTAL"], location: "anywhere" }],
    },
  },
  // Disable react-refresh warnings for UI components and context files
  {
    files: ["src/components/ui/**/*.tsx", "src/context/**/*.tsx", "src/contexts/**/*.tsx", "src/providers/**/*.tsx", "src/components/CanvasGrid/GridDragHandler.tsx"],
    rules: {
      "react-refresh/only-export-components": "off"
    }
  }
);
