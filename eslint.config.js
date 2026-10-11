import stylistic from '@stylistic/eslint-plugin'
import eslint from '@eslint/js'
import oaklint from 'eslint-plugin-oaklint'
import unicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  oaklint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-console': 'error',
      // NOTE: A number interpolated into a template literal is safe and idiomatic;
      //       keep flagging nullable and object types that stringify to junk.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // NOTE: OAK005 - self-alias and redundant rename.
      'no-useless-rename': 'error',
      // NOTE: OAK008 - single-character names, keeping the `e` and `_` idioms.
      'id-length': ['error', { min: 2, exceptions: ['e', '_'] }],
      // NOTE: enum-policy - TS enums are banned in favour of union types.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a union of string literals or an `as const` object instead of an enum.',
        },
      ],
      // NOTE: require-readonly - private fields and constructor parameters.
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/parameter-properties': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@stylistic': stylistic,
      unicorn,
    },
    rules: {
      // NOTE: OAK001 and OAK002 - blank line after a block and before a return.
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      // NOTE: OAK001 in class scope - blank line between members, keeping runs
      //       of single-line fields tight.
      '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      // NOTE: OAK003 companion - a space after `//`, keeping `///` TS directives.
      '@stylistic/spaced-comment': ['error', 'always', { markers: ['/'] }],
      // NOTE: One binding per declaration, so each name reads on its own line.
      '@stylistic/one-var-declaration-per-line': ['error', 'always'],
      // NOTE: One statement per line, so no compressed multi-statement lines.
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      // NOTE: Always brace a block body, so a second statement cannot fall
      //       outside the branch it looks like it belongs to.
      curly: ['error', 'all'],
      // NOTE: Flat early-return style - drop the else after a returning branch
      //       and collapse a lone nested if into an else-if.
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',
      // NOTE: One obvious form for the common idioms.
      'object-shorthand': ['error', 'always'],
      'no-unneeded-ternary': 'error',
      'prefer-template': 'error',
      'prefer-const': 'error',
      // NOTE: The typescript-eslint variant with allowIndexSignaturePropertyAccess
      //       keeps bracket access on an index-signature type, which
      //       noPropertyAccessFromIndexSignature mandates - the base rule would
      //       autofix that bracket access to dot access and break the build.
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': ['error', { allowIndexSignaturePropertyAccess: true }],
      // NOTE: Idiomatic type-aware TS - chain, membership, and prefix/suffix
      //       checks read plainer than their index-of and && equivalents.
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      // NOTE: Flat is better than nested - cap block nesting.
      'max-depth': ['error', { max: 3 }],
      // NOTE: Strict equality, so no hidden coercion in a comparison.
      eqeqeq: ['error', 'always'],
      // NOTE: A nested ternary is unreadable - use if/else or a lookup.
      'no-nested-ternary': 'error',
      // NOTE: Name the conversion in words rather than a coercion operator.
      'no-implicit-coercion': 'error',
      // NOTE: Drop a redundant annotation the compiler already infers.
      '@typescript-eslint/no-inferrable-types': 'error',
      // NOTE: A boolean is already a condition - drop the `=== true`.
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      // NOTE: Reject assigning or returning a void expression as a value.
      '@typescript-eslint/no-confusing-void-expression': 'error',
      // NOTE: Reject a `!` assertion placed where it reads as a comparison.
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      // NOTE: `await` in a loop serializes requests that could run in parallel.
      'no-await-in-loop': 'error',
      // NOTE: A literal regex compiles once - `new RegExp` recompiles at runtime.
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      // NOTE: An array only used for membership checks is O(n) per lookup - a
      //       Set is roughly constant-time, so a lookup in a loop stays linear.
      'unicorn/prefer-set-has': 'error',
      // NOTE: `RegExp#test` over `String#match` when only a boolean is needed.
      'unicorn/prefer-regexp-test': 'error',
    },
  },
  {
    // NOTE: OAK018 - non-test module line limit.
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts', 'src/**/__tests__/**'],
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    // NOTE: OAK019 - test module line limit.
    files: ['src/**/*.test.ts', 'src/**/__tests__/**'],
    rules: {
      'max-lines': ['error', { max: 2000, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    ignores: ['dist/', 'coverage/', 'eslint.config.js', 'vitest.config.ts', 'scripts/'],
  },
)
