// @ts-check
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: [
      'tests/**/*.spec.js',
      'playwright.config.js',
      'eslint.config.js',
      'stylelint.config.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**'],
  },
];
