import { afterEach, expect } from 'vitest';

// Cleanup after each test
afterEach(() => {
  // Cleanup logic if needed
});

// Mock environment variables
process.env.YOUTUBE_API_KEY = 'test-api-key';
process.env.CONFIG_FILE = './config/children.example.yaml';
