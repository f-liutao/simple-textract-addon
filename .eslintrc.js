module.exports = {
  plugins: ["googleappsscript"],
  env: {
    "googleappsscript/googleappsscript": true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["tsconfig.json"],
  },
  rules: {
    "@typescript-eslint/prefer-string-starts-ends-with": "warn",
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "semi-spacing": [
      "error",
      {
        before: false,
        after: true,
      },
    ],
    "comma-dangle": ["error", "never"],
  },
};
