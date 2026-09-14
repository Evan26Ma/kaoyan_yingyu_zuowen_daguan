export type CategoryId = 'big' | 'small' | 'material' | 'extra';

export interface CatalogEntry {
  id: string;
  slug: string;
  title: string;
  category: CategoryId;
  type: string;
  source: string;
  description: string;
  tags: string[];
  years: number[];
  featured: boolean;
}

export interface LearningState {
  version: 1;
  favorites: string[];
  completed: string[];
  recent: string[];
  revealMode: 'all' | 'hide-en' | 'hide-zh';
  theme: 'light' | 'dark';
}
