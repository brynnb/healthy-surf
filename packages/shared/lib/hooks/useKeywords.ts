import { useStorageSuspense } from './useStorage';
import { keywordsStorage } from '@extension/storage';

export function useKeywords() {
  const keywords = useStorageSuspense(keywordsStorage);

  const addKeyword = (newKeyword: string) => {
    keywordsStorage.set([...keywords, newKeyword]);
  };

  const removeKeyword = (keywordToRemove: string) => {
    keywordsStorage.set(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  return { keywords, addKeyword, removeKeyword };
}
