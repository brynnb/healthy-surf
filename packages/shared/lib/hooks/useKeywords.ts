import { useStorageSuspense } from './useStorage';
import { keywordsStorage } from '@extension/storage';
import { loadFromSQLite } from '@extension/storage/lib/sqliteHelper'; // Import the function

export function useKeywords() {
  // Use useStorageSuspense to get the keywords from storage
  const keywords = useStorageSuspense(keywordsStorage);

  const addKeyword = (newKeyword: string) => {
    keywordsStorage.set([...keywords, newKeyword]);
  };

  const removeKeyword = (keywordToRemove: string) => {
    keywordsStorage.set(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  // New function to clear local storage
  const clearLocalStorage = () => {
    keywordsStorage.set([]); // Clear local storage
  };

  // New function to load keywords from SQLite
  const loadKeywordsFromSQLite = async () => {
    const sqliteKeywords = await loadFromSQLite('keywords');
    keywordsStorage.set(sqliteKeywords); // Set keywords from SQLite
  };

  return { keywords, addKeyword, removeKeyword, clearLocalStorage, loadKeywordsFromSQLite };
}
