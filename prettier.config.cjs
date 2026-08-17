module.exports = {
  printWidth: 105,
  semi: false,
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-css-order",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: ["^@(?!/)", "^@/", "^[./]"],
  // importOrderSeparation: false,
  // importOrderSortSpecifiers: true,
  importOrderTypeScriptVersion: "5.0.0",
}
