/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/test/db/kldb.default.mock.ts"],
  transform: {
    "^.+.tsx?$": ["ts-jest", {
      diagnostics: {
        ignoreCodes: [151001], // Suppress TS151001
      },
      // tsconfig: "test/tsconfig.jest.json",
    }],
  },
};