// Requirements
import js from '@eslint/js';
import globals from 'globals';
import eslintPluginImport from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';


// Exported
export default defineConfig([
    globalIgnores(['dist', 'out']),
    {
        files: ['src/**/*.js', 'src/**/*.jsx'],
        extends: [
            js.configs.recommended,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                process: 'readonly',
                __dirname: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            import: eslintPluginImport,
            react: eslintPluginReact,
            'react-hooks': eslintPluginReactHooks,
        },
        rules: {
            "arrow-body-style": ["error", "as-needed"],
            "arrow-parens": ["error", "as-needed",
                {
                    requireForBlockBody: true,
                },
            ],
            "comma-dangle": ["error",
                {
                    arrays: "always-multiline",
                    objects: "always-multiline",
                    imports: "always-multiline",
                    exports: "always-multiline",
                    functions: "never",
                },
            ],
            "consistent-return": ["error"],
            "func-names": ["error", "as-needed"],
            "function-paren-newline": ["error", 
                { 
                    minItems: 5,
                },
            ],
            "func-style": ["warn", "declaration",
                {
                    allowArrowFunctions: true,
                },
            ],
            indent: ['error', 4],
            'import/no-unresolved': 'error',
            'import/named': 'error',
            "linebreak-style": ["error", "unix"],
            "no-nested-ternary": ["warn"],
            "no-param-reassign": ["error",
                {
                    props: false,
                },
            ],
            "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
            "no-multi-spaces": ["error"],
            "no-restricted-properties": ["warn"],
            "no-underscore-dangle": ["off"],
            "no-undef": ["warn"],
            "no-use-before-define": ["error", { functions: true, classes: true, variables: true }],
            'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
            "no-await-in-loop": ["error"],
            "object-shorthand": ["off", "methods"],
            "prefer-regex-literals": ["off"],
            "quote-props": ["error", "as-needed",
                {
                    keywords: false,
                    unnecessary: true,
                    numbers: true,
                },
            ],
            quotes: ["error", "single", { avoidEscape: true, allowTemplateLiterals: true }],
            "no-trailing-spaces": ["error"],
            "space-in-parens": ["error", "never"],
            "import/exports-last": ["error"],
            "import/newline-after-import": ["error",
                {
                    count: 2,
                },
            ],
            "import/no-extraneous-dependencies": ["error",
                {
                    packageDir: "./",
                },
            ],
            "import/no-named-as-default": ["warn"],
            "import/order": ["error",
                {
                    "newlines-between": "never",
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                },
            ],
            "import/prefer-default-export": ["off"],
            "import/extensions": ["off"],
            'react/jsx-uses-vars': 'error',
            'react/jsx-no-undef': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.jsx'],
                },
            },
            react: { version: 'detect' },
        },
    },
])
