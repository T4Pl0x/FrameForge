module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'frameforge/**',
    '**/*.d.ts'
  ],
  overrides: [
    {
      files: ['packages/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', project: false },
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      settings: { react: { version: 'detect' } },
      env: { browser: true, es2022: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      ],
      rules: {
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        '@typescript-eslint/no-explicit-any': 'off',
        'react/react-in-jsx-scope': 'off'
      }
    }
  ]
};

