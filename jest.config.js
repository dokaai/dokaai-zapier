module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: ['dist/**/*.js'],
};
