const path = require("path");

const buildEslintCommand = (filenames) =>
    `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(" --file ")}`;
const prettierCommand = (filenames) =>
    `'prettier --write ${filenames.map((f) => path.relative(process.cwd(), f)).join(" ")}`;

module.exports = {
    "*.{js,jsx,ts,tsx}": [buildEslintCommand, prettierCommand],
};
