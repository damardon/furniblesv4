import coreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...coreWebVitals,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // React Compiler rules — project does not use the React Compiler
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
    },
  },
  {
    ignores: ['next.config.js', 'tailwind.config.js', 'postcss.config.js'],
  },
]

export default eslintConfig
