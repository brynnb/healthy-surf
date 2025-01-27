import { RedditContentAnalyzer } from '../reddit-content-analyzer';
import dotenv from 'dotenv';
import path from 'path';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

describe('RedditContentAnalyzer Live Tests', () => {
  let analyzer: RedditContentAnalyzer;

  beforeAll(() => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not found in environment');

    analyzer = new RedditContentAnalyzer(apiKey, path.resolve(__dirname, '../../../../../blockedKeywords.db'));
  });

  afterAll(async () => {
    await analyzer.close();
  });

  it.skip('should analyze real Reddit content', async () => {
    try {
      // Only analyze 5 posts to keep test duration reasonable
      const results = await analyzer.analyzeRedditPage('https://old.reddit.com/r/all', 5);

      // Log only the essential information to avoid circular references
      console.log('Real Reddit Results - Post URLs:');
      results.forEach(result => {
        console.log(`URL: ${result.postUrl}`);
        console.log('Categories:', result.categories);
        console.log('Tags:', result.tags);
        console.log('---');
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);

      results.forEach(result => {
        expect(result).toHaveProperty('postUrl');
        expect(result).toHaveProperty('categories');
        expect(result).toHaveProperty('tags');
        expect(Array.isArray(result.categories)).toBe(true);
        expect(Array.isArray(result.tags)).toBe(true);
        expect(result.postUrl).toMatch(/^https?:\/\//); // URL should start with http:// or https://
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('403')) {
        console.warn('Reddit is blocking our request. This is expected in CI/CD environments.');
        // Skip the test when Reddit blocks us
        return;
      }
      throw error;
    }
  }, 60000); // Increase timeout to 60 seconds
});
