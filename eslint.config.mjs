import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // TypeScript strict rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "error",
      
      // React/Next.js best practices
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",
      
      // General code quality
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
      "no-debugger": "error",
      
      // Container-Presenter pattern enforcement
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["**/use*", "**/hooks/*"],
              "importNames": ["default"],
              "message": "Container hooks should be imported with named imports for clarity"
            }
          ]
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
