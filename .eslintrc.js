module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'unused-imports'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'class-methods-use-this': 'off',
    'import/no-cycle': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'unused-imports/no-unused-imports': 'error',
    'no-return-assign': 'off',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'import/no-absolute-path': 'error',
    'import/no-extraneous-dependencies': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-unresolved': 'off',
    'import/first': 'warn',
    'import/newline-after-import': 'warn',
    'import/no-deprecated': 'warn',
    'import/no-unused-modules': 'off',
    '@typescript-eslint/return-await': 'off',
    'unused-imports/no-unused-imports': 'error',
  },
};
