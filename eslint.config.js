import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Existing data-loading effects and form resets use this pattern deliberately.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/features/{auth,site-settings}/**/*Context.tsx'],
    rules: {
      // These provider modules also export their associated context hook.
      'react-refresh/only-export-components': 'off',
    },
  },
])
