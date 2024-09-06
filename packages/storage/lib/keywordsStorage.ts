import { createStorage, StorageType } from './base';
import { saveToSQLite } from './sqliteHelper';

// Set an empty array as the initial value; loading will be handled in setupDatabase
export const keywordsStorage = createStorage<string[]>('keywords', [], {
  storageType: StorageType.Local,
  onSet: async (keywords: string[]) => {
    await saveToSQLite('keywords', keywords);
  },
});

export const subredditsStorage = createStorage<string[]>('subreddits', initialSubreddits, {
  storageType: StorageType.Local,
  onSet: async subreddits => {
    await saveToSQLite('subreddits', subreddits);
  },
});
