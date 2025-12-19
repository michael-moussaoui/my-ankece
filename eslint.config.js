// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Configuration pour les fichiers de test Jest
  {
    files: [
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'jest.setup.js',
      '__tests__/**/*.js',
      '__tests__/**/*.jsx',
      '__tests__/**/*.ts',
      '__tests__/**/*.tsx',
    ],
    languageOptions: {
      globals: {
        // Globales Jest
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        // Globales supplémentaires utiles
        global: 'readonly',
      },
    },
  },
]);
