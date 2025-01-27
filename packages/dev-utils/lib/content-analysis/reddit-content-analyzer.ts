import OpenAI from 'openai';
import { Database } from 'sqlite3';
import { JSDOM } from 'jsdom';
import axios from 'axios';

interface RedditPost {
  url: string;
  title: string;
  imageUrl?: string;
  body?: string;
}

interface AnalysisResult {
  postUrl: string;
  categories: string[];
  tags: string[];
}

interface ContentAnalysisRow {
  post_url: string;
  categories: string;
  tags: string;
}

export class RedditContentAnalyzer {
  private openai: OpenAI;
  private db: Database;

  constructor(apiKey: string, dbPath: string = './blockedKeywords.db') {
    this.openai = new OpenAI({ apiKey });
    this.db = new Database(dbPath);
  }

  private async getExistingAnalysis(postUrl: string): Promise<AnalysisResult | null> {
    return new Promise((resolve, reject) => {
      this.db.get<ContentAnalysisRow>(
        'SELECT post_url, categories, tags FROM content_analysis WHERE post_url = ?',
        [postUrl],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              postUrl: row.post_url,
              categories: JSON.parse(row.categories),
              tags: JSON.parse(row.tags),
            });
          }
        },
      );
    });
  }

  async analyzeRedditPage(url: string, limit?: number): Promise<AnalysisResult[]> {
    console.log('Fetching Reddit page:', url);
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          DNT: '1',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          Cookie: 'over18=1', // This is needed for some subreddits
        },
        maxRedirects: 5,
        validateStatus: status => status < 400,
      });

      console.log('Response status:', response.status);
      console.log('Content type:', response.headers['content-type']);

      const html = response.data;
      console.log('Received HTML length:', html.length);
      console.log('First 500 chars of HTML:', html.substring(0, 500));

      const posts = this.extractPosts(html);
      console.log('Extracted posts count:', posts.length);

      // Apply limit if specified
      const postsToAnalyze = limit ? posts.slice(0, limit) : posts;

      const results: AnalysisResult[] = [];

      for (const post of postsToAnalyze) {
        const analysis = await this.analyzePost(post);
        results.push(analysis);
      }

      return results;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching Reddit:', error.message);
      } else {
        console.error('Error fetching Reddit:', error);
      }
      throw error;
    }
  }

  private extractPosts(html: string): RedditPost[] {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const posts: RedditPost[] = [];

    const postElements = document.querySelectorAll('.thing.link');
    console.log('Found post elements:', postElements.length);

    postElements.forEach(postElement => {
      const titleElement = postElement.querySelector('a.title.may-blank');
      const bodyElement = postElement.querySelector('.usertext-body .md');
      const thumbnailElement = postElement.querySelector('img.thumbnail');

      if (titleElement) {
        const thumbnailSrc = thumbnailElement?.getAttribute('src');
        const post = {
          url: titleElement.getAttribute('href') || '',
          title: titleElement.textContent?.trim() || '',
          imageUrl: thumbnailSrc || undefined,
          body: bodyElement?.textContent?.trim(),
        };
        console.log('Extracted post:', post);
        posts.push(post);
      }
    });

    return posts;
  }

  private async analyzePost(post: RedditPost): Promise<AnalysisResult> {
    // Check if we already have analysis for this post
    const existingAnalysis = await this.getExistingAnalysis(post.url);
    if (existingAnalysis) {
      console.log('Found existing analysis for:', post.url);
      return existingAnalysis;
    }

    console.log('Analyzing new post:', post.url);
    const prompt = this.buildPrompt(post);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are analyzing Reddit content to categorize it. Available categories are: Politics, Violence, Social Issues, Mean Stuff, Unpleasant. 
                 You should also generate relevant tags. Respond in JSON format with fields: categories (array), tags (array)`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = JSON.parse(completion.choices[0].message?.content || '{}');

    const analysis = {
      postUrl: post.url,
      categories: response.categories || [],
      tags: response.tags || [],
    };

    await this.saveAnalysis(analysis);
    return analysis;
  }

  private buildPrompt(post: RedditPost): string {
    let content = `Title: ${post.title}\n`;
    if (post.body) content += `Body: ${post.body}\n`;
    if (post.imageUrl) content += `Image URL: ${post.imageUrl}\n`;
    return content;
  }

  private async saveAnalysis(analysis: AnalysisResult): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO content_analysis (post_url, categories, tags) 
         VALUES (?, ?, ?)`,
        [analysis.postUrl, JSON.stringify(analysis.categories), JSON.stringify(analysis.tags)],
        err => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
