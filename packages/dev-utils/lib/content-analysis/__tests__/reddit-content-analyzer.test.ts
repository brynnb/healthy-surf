import { RedditContentAnalyzer } from '../reddit-content-analyzer';
import dotenv from 'dotenv';
import path from 'path';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

describe('RedditContentAnalyzer', () => {
  let analyzer: RedditContentAnalyzer;

  beforeAll(() => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not found in environment');

    analyzer = new RedditContentAnalyzer(apiKey, path.resolve(__dirname, '../../../../../blockedKeywords.db'));
  });

  afterAll(async () => {
    await analyzer.close();
  });

  it('should analyze r/all content', async () => {
    const results = await analyzer.analyzeRedditPage('https://old.reddit.com/r/all');

    expect(results.length).toBeGreaterThan(0);

    results.forEach(result => {
      expect(result).toHaveProperty('postUrl');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('tags');

      expect(Array.isArray(result.categories)).toBe(true);
      expect(Array.isArray(result.tags)).toBe(true);
    });
  }, 30000);
});
