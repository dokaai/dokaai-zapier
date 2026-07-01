module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': '<rootDir>/jest.ts-transformer.cjs',
  },
  collectCoverageFrom: ['src/**/*.ts'],
};
