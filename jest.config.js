export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      transform: {},
      testMatch: ['<rootDir>/tests/backend/**/*.test.js'],
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/tests/frontend/**/*.test.js'],
      transform: { '^.+\\.js$': 'babel-jest' },
      moduleNameMapper: { '\\.(css)$': '<rootDir>/tests/__mocks__/styleMock.js' },
      setupFilesAfterEnv: ['@testing-library/jest-dom'],
    },
  ],
};