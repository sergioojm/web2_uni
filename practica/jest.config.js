export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',
  setupFiles: ['./tests/setup.js'],
  verbose: true
};
