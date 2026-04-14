module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  rules: {
    'prettier/prettier': ['warn', {
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      tabWidth: 2,
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/explicit-function-return-types': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
    }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'import/no-cycle': 'error',
    'import/order': ['warn', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      alphabeticalOrder: true,
      newlines-between: 'always',
    }],
  },
  overrides: [
    {
      files: ['**/*.spec.ts', '**/*.spec.tsx', '**/e2e/**/*.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
    {
      files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
      parserOptions: {
        project: 'apps/web/tsconfig.json',
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
      },
    },
    {
      files: ['apps/api/**/*.ts'],
      parserOptions: {
        project: 'apps/api/tsconfig.json',
      },
    },
  ],
};
