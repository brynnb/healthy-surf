import { RedditContentAnalyzer } from '../reddit-content-analyzer';
import dotenv from 'dotenv';
import path from 'path';
import { describe, expect, it, beforeAll, afterAll, jest } from '@jest/globals';
import axios from 'axios';
import fs from 'fs';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  it('should analyze mock Reddit content', async () => {
    try {
      // Read the local HTML file
      const mockRedditHtml = fs.readFileSync(
        path.resolve(__dirname, '../../../../../redditexamplepage/all subreddits.html'),
        'utf-8',
      );

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'set-cookie': ['over18=1; path=/'],
        },
        data: mockRedditHtml,
      });

      const results = await analyzer.analyzeRedditPage('https://old.reddit.com/r/all', 5); // Limit to 5 posts

      if (!results || results.length === 0) {
        throw new Error('No results were returned from Reddit analysis');
      }

      console.log('Raw Results Length:', results.length);
      console.log('First Result Sample:', results[0]);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5); // Verify we're not processing too many posts

      results.forEach(result => {
        expect(result).toHaveProperty('postUrl');
        expect(result).toHaveProperty('categories');
        expect(result).toHaveProperty('tags');
        expect(result.postUrl).toMatch(/^https?:\/\//);
        expect(Array.isArray(result.categories)).toBe(true);
        expect(Array.isArray(result.tags)).toBe(true);
      });

      // Verify the mock was called with the correct URL
      expect(mockedAxios.get).toHaveBeenCalledWith('https://old.reddit.com/r/all', expect.any(Object));
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  }, 60000); // Increase timeout to 60 seconds
});
