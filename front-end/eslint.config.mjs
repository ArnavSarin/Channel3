import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginPrettier from "eslint-plugin-prettier";


/** @type {import('eslint').Linter.Config[]} */
export default [
    {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
    {files: ["**/*.js"], languageOptions: {sourceType: "script"}},
    {languageOptions: {globals: globals.browser, parser: tseslint.parser}},
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        plugins: {
            prettier: eslintPluginPrettier
        },
        rules: {
            "prettier/prettier": "error",
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
        },
    },
];