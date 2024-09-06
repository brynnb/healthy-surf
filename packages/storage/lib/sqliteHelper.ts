import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./blockedKeywords.db');

export async function loadFromSQLite(tableName: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT name FROM ${tableName}`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve((rows as { name: string }[]).map(row => row.name));
      }
    });
  });
}

export async function saveToSQLite(tableName: string, items: string[]): Promise<void> {
  const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (name) VALUES (?)`);
  items.forEach(item => stmt.run(item));
  stmt.finalize();
}
