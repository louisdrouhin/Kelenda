// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

// Config flat partagée par les 5 services — chaque service l'étend depuis
// son propre eslint.config.js (même pattern que tsconfig.json extends
// tsconfig.base.json), avec `src` résolu relativement à son propre dossier
// puisque eslint cherche sa config depuis le cwd où `npm run lint --workspace=...`
// l'exécute (services/<name>), pas depuis la racine du monorepo.
module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
);
