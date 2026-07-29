// lint-staged.config.js
// This configuration runs linters and formatters on staged files before commit.
// It ensures code quality and consistency without slowing down the commit process.

export default {
  // TypeScript and JavaScript files: run ESLint with auto-fix
  '*.{ts,tsx,js,jsx}': ['eslint --fix --max-warnings=0'],

  // All supported files: run Prettier formatting
  '*.{ts,tsx,js,jsx,json,css,md,mdx,yml,yaml}': ['prettier --write'],

  // TypeScript type checking on the entire project when TS files change
  // This runs tsc on the whole project because type errors can cascade
  '*.{ts,tsx}': () => 'tsc --noEmit',
};
