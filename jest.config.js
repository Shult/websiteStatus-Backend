module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    coverageDirectory: 'coverage',
};
