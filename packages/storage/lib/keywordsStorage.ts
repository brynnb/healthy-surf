import { createStorage, StorageType } from './base';

export const keywordsStorage = createStorage<string[]>('keywords', [], {
  storageType: StorageType.Local,
});
