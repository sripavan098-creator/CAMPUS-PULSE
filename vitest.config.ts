import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // The integration tests share one SQLite file and mutate live entries, so
    // running files in parallel races them against each other.
    fileParallelism: false,
  },
})
