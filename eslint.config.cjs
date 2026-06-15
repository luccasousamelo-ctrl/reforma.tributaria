// Flat config do ESLint. As dependências ficam em server/node_modules (não há
// package.json na raiz, de propósito, para não mudar a detecção de build da Vercel).
// Rode pela raiz com:  cd server && npm run lint
const js = require('./server/node_modules/@eslint/js');
const globals = require('./server/node_modules/globals');

module.exports = [
  // Lint cobre só o código do produto (front + back). Diretórios de ferramentas/framework
  // (AIOX, configs de IDEs/agentes) têm suas próprias configs e ficam de fora.
  {
    ignores: [
      '**/node_modules/**', 'simplifica-video/**',
      '.aiox-core/**', '.claude/**', '.codex/**', '.cursor/**',
      '.gemini/**', '.kimi/**', '.antigravity/**', '.github/**', 'docs/**',
    ],
  },

  js.configs.recommended,

  {
    // Backend — Node / CommonJS
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },

  {
    // Testes Playwright — rodam em Node, mas os callbacks de page.evaluate
    // usam globais de browser (localStorage, getComputedStyle, document...).
    files: ['server/tests/**/*.js', 'server/playwright.config.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },

  {
    // Frontend — JS vanilla no browser. Os scripts compartilham escopo global
    // entre arquivos (data.js -> app.js -> handlers inline no index.html),
    // então no-undef geraria ruído; mantemos as regras úteis.
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: {
      // Desligados por causa do padrão vanilla: funções chamadas por onclick inline
      // no HTML e dados compartilhados entre arquivos viram "unused"/"undef" falsos.
      // As demais regras recommended (no-dupe-keys, no-redeclare, no-unreachable,
      // no-constant-condition, etc.) continuam pegando bugs reais.
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
];
