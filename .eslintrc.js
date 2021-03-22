module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint',
  ],

  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }], // slipper undefined not used when destructuring objects
    '@typescript-eslint/explicit-module-boundary-types': 'off', // fråga inte om return value types.  så slipper vi Promise<{blalba|undefined;blalba|undefined}|undefined>
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
