module.exports = {
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-jsdom',

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle module aliases (this will be important for Next.js projects)
    '^@/(.*)$': '<rootDir>/$1',
  },

  // The setup files to run before each test file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  transformIgnorePatterns: [
    // Allow Jest to transform these ESM-only modules
    '/node_modules/(?!(react-markdown|remark-gfm|vfile|unist-.*|unified|bail|is-plain-obj|trough|remark-.*|micromark-.*|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|pretty-bytes|ccount|mdast-util-.*|micromark|parse-entities|character-entities-legacy|markdown-table|longest-streak|estree-util-.*|devlop|@radix-ui|lucide-react)/)'
  ],
};
