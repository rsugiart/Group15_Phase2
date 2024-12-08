/** @type {import('ts-jest').JestConfigWithTsJest} **/
const path = require("path");

module.exports = {
  rootDir: path.resolve(__dirname, ".."), // Set root to the level above `frontend`
  transform: {
    "^.+\\.tsx?$": "babel-jest", // Use Babel for TypeScript
  },
  testMatch: ["<rootDir>/tests/frontend/page_test.tsx", "<rootDir>/tests/**/*.spec.ts"], // Target test files
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testTimeout: 60000, // Increase timeout for Selenium
};
