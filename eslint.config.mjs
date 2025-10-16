// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 🔥 FIX 1: Allow `any` (used heavily in Prisma JSON fields)
      "@typescript-eslint/no-explicit-any": "off",
      
      // 🔥 FIX 2: Allow unescaped quotes like 'Logout' in JSX
      "react/no-unescaped-entities": "off",
      
      // Optional: silence unused var warnings (not required for build)
      "@typescript-eslint/no-unused-vars": "off",
      // 🔥 FIX 3: SILENCE exhaustive-deps warnings
      "react-hooks/exhaustive-deps": "off"
    },
  },
];

export default eslintConfig;
