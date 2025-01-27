import OpenAI from 'openai';
import { Database } from 'sqlite3';
import { JSDOM } from 'jsdom';

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

export class RedditContentAnalyzer {
  private openai: OpenAI;
  private db: Database;

  constructor(apiKey: string, dbPath: string = './blockedKeywords.db') {
    this.openai = new OpenAI({ apiKey });
    this.db = new Database(dbPath);
  }

  async analyzeRedditPage(url: string): Promise<AnalysisResult[]> {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const posts = this.extractPosts(html);
    const results: AnalysisResult[] = [];

    for (const post of posts) {
      const analysis = await this.analyzePost(post);
      await this.saveAnalysis(analysis);
      results.push(analysis);
    }

    return results;
  }

  private extractPosts(html: string): RedditPost[] {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const posts: RedditPost[] = [];

    document.querySelectorAll('.thing.link').forEach(postElement => {
      const titleElement = postElement.querySelector('a.title');
      const imgElement = postElement.querySelector('img');
      const bodyElement = postElement.querySelector('.usertext-body');

      if (titleElement) {
        posts.push({
          url: titleElement.getAttribute('href') || '',
          title: titleElement.textContent || '',
          imageUrl: imgElement?.getAttribute('src') || undefined,
          body: bodyElement?.textContent?.trim(),
        });
      }
    });

    return posts;
  }

  private async analyzePost(post: RedditPost): Promise<AnalysisResult> {
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

    return {
      postUrl: post.url,
      categories: response.categories || [],
      tags: response.tags || [],
    };
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
