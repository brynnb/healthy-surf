import sqlite3 from 'sqlite3';
import fs from 'fs';

// Function to delete the existing database file
function deleteDatabase(dbPath: string) {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database deleted.');
  }
}

function setupDatabase() {
  const dbPath = './blockedKeywords.db';

  // Check for the --delete flag
  const args = process.argv.slice(2);
  if (args.includes('--delete')) {
    deleteDatabase(dbPath);
  }

  const db = new sqlite3.Database(dbPath, err => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Connected to the blockedKeywords database.');
  });

  db.serialize(() => {
    // Create keywords table
    db.run(`
      CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        is_case_sensitive BOOLEAN NOT NULL DEFAULT 0,
        date_created TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create category table
    db.run(`
      CREATE TABLE IF NOT EXISTS category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    // Create keyword_category table
    db.run(`
      CREATE TABLE IF NOT EXISTS keyword_category (
        keyword_id INTEGER,
        category_id INTEGER,
        FOREIGN KEY (keyword_id) REFERENCES keywords(id),
        FOREIGN KEY (category_id) REFERENCES category(id)
      )
    `);

    // Create blocked_subreddits table
    db.run(`
      CREATE TABLE IF NOT EXISTS blocked_subreddits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date_created TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create subreddit_category table
    db.run(`
      CREATE TABLE IF NOT EXISTS subreddit_category (
        subreddit_id INTEGER,
        category_id INTEGER,
        FOREIGN KEY (subreddit_id) REFERENCES blocked_subreddits(id),
        FOREIGN KEY (category_id) REFERENCES category(id)
      )
    `);

    // Read initial keywords from JSON file
    const data = JSON.parse(fs.readFileSync('./default_blocked_items.json', 'utf8'));
    const initialKeywords = data.blocked_keywords;
    const insertKeywordStmt = db.prepare(
      'INSERT INTO keywords (keyword, is_case_sensitive, is_default) VALUES (?, ?, true)',
    );
    const insertKeywordCategoryStmt = db.prepare(
      'INSERT INTO keyword_category (keyword_id, category_id) VALUES (?, ?)',
    );

    //was having issues with async and db connections finalizing too early so this a janky solution to quickly fix. if this was more than a dev tool that i alone would ever use i'd probably properly fix it.
    let pendingOperations = 0;
    for (const item of initialKeywords) {
      pendingOperations++;
      const isCaseSensitive = item.is_case_sensitive !== undefined ? item.is_case_sensitive : false;
      insertKeywordStmt.run(item.keyword, isCaseSensitive, function (this: { lastID: number }, err: Error | null) {
        if (err) {
          console.error(err.message);
          return;
        }
        const keywordId = this.lastID;
        for (const categoryId of item.category_ids) {
          pendingOperations++;
          insertKeywordCategoryStmt.run(keywordId, categoryId, (err: Error | null) => {
            if (err) {
              console.error(err.message);
            }
            pendingOperations--;
            if (pendingOperations === 0) {
              finalizeStatements();
            }
          });
        }
        pendingOperations--;
        if (pendingOperations === 0) {
          finalizeStatements();
        }
      });
    }

    // Insert initial categories
    const initialCategories = ['Politics', 'Violence', 'Social Issues', 'Mean Stuff', 'Unpleasant'];
    const insertCategoryStmt = db.prepare('INSERT INTO category (name) VALUES (?)');

    for (const category of initialCategories) {
      pendingOperations++;
      insertCategoryStmt.run(category, (err: Error | null) => {
        if (err) {
          console.error(err.message);
        }
        pendingOperations--;
        if (pendingOperations === 0) {
          finalizeStatements();
        }
      });
    }

    // Insert initial blocked subreddits
    const initialSubreddits = ['r/politics', 'r/news', 'r/worldnews'];
    const insertSubredditStmt = db.prepare('INSERT INTO blocked_subreddits (name) VALUES (?)');

    for (const subreddit of initialSubreddits) {
      pendingOperations++;
      insertSubredditStmt.run(subreddit, (err: Error | null) => {
        if (err) {
          console.error(err.message);
        }
        pendingOperations--;
        if (pendingOperations === 0) {
          finalizeStatements();
        }
      });
    }

    function finalizeStatements() {
      insertKeywordStmt.finalize((err: Error | null) => {
        if (err) {
          console.error(err.message);
        }
      });

      insertKeywordCategoryStmt.finalize((err: Error | null) => {
        if (err) {
          console.error(err.message);
        }
      });

      insertCategoryStmt.finalize((err: Error | null) => {
        if (err) {
          console.error(err.message);
        }
      });

      insertSubredditStmt.finalize((err: Error | null) => {
        if (err) {
          console.error(err.message);
        }
      });

      db.close((err: Error | null) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Closed the database connection. Database setup is complete.');
      });
    }

    if (pendingOperations === 0) {
      finalizeStatements();
    }
  });
}

setupDatabase();
