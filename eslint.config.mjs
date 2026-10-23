import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import jest from 'eslint-plugin-jest';

export default tseslint.config(
  { ignores: ['node_modules/**', '**/dist/**', 'reports/**', '**/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    plugins: { jest },
    rules: {
      'jest/no-focused-tests': 'error',
      'jest/no-disabled-tests': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': 'off',
    },
  },
);
