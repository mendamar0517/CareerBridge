// ESLint 9 тохиргоо (flat config) — Лаб 11
// ESLint 9-өөс эхлэн .eslintrc-ийн оронд eslint.config.js ашиглана.
const js = require('@eslint/js');
const globals = require('globals');
const jest = require('eslint-plugin-jest');
const security = require('eslint-plugin-security');
const sonarjs = require('eslint-plugin-sonarjs');
const n = require('eslint-plugin-n');

module.exports = [
  // Шалгахгүй хавтас: хамаарал, coverage тайлан
  { ignores: ['node_modules/', 'coverage/', 'web/'] }, // web/ — Vite/React (ESM, JSX), тусдаа build

  // Суурь дүрмийн багц:
  //  - ESLint recommended: түгээмэл алдаа (ашиглагдаагүй хувьсагч, тодорхойлогдоогүй нэр …)
  //  - security: аюулгүй байдлын эрсдэлтэй загвар (eval, regex, child_process …)
  //  - sonarjs: SonarQube-ийн JavaScript дүрэм (code smell, ReDoS, давхардал …)
  //  - n: Node.js-ийн дүрэм (process.exit, хуучирсан API, хамаарлын алдаа …)
  js.configs.recommended,
  security.configs.recommended,
  sonarjs.configs.recommended,
  n.configs['flat/recommended-script'],

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      eqeqeq: ['error', 'always'],          // == биш === ашиглах
      'prefer-const': 'error',              // дахин оноогдохгүй хувьсагч → const
      'no-var': 'error',
      curly: ['error', 'multi-line'],
      'no-shadow': 'error',                 // гадаад хувьсагчийг дотор нь ижил нэрээр далдлахгүй
      'consistent-return': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'all' }],
    },
  },

  // Тестийн файлууд: Jest-ийн глобал хувьсагч ба дүрэм
  {
    files: ['tests/**/*.js'],
    ...jest.configs['flat/recommended'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
];
