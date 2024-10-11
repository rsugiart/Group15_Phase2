export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/jest.setup.ts'], 
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
    testTimeout: 40000,
    collectCoverageFrom: [
        '<rootDir>/src/**/*.{ts,tsx}',
    ],
    silent: true,
};