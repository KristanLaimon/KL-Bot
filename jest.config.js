/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {
      diagnostics: {
        ignoreCodes: [151001], // Suppress TS151001
      },
      // tsconfig: "test/tsconfig.jest.json",
    }],
  },
};