// Test Database Guard — Prevents tests from running against production database
// This MUST be imported at the top of every test file

export function assertTestDatabase(): void {
  const dbUrl = process.env.DATABASE_URL || '';

  // Check for test database indicators
  const isTestDb =
    dbUrl.includes('test') ||
    dbUrl.includes('localhost:5432/system_website') || // Our test container
    dbUrl.includes('test_db') ||
    process.env.NODE_ENV === 'test';

  if (!isTestDb) {
    throw new Error(
      `REFUSING TO RUN TESTS: DATABASE_URL does not appear to be a test database.\n` +
      `Current: ${dbUrl.replace(/:[^:@]+@/, ':****@')}\n` +
      `Set DATABASE_URL to a test database (must contain "test" in name) or use the test container.`
    );
  }
}

// Auto-run when imported
assertTestDatabase();