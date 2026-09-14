export type CategoryId = 'big' | 'small' | 'material' | 'reading' | 'extra';

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
  studyMode?: 'memorize' | 'reference';
}

export interface ResumeState {
  contentId: string;
  path: string;
  contentTitle: string;
  unitId: string;
  unitTitle: string;
  segmentIndex: number;
  updatedAt: number;
}

export interface LearningState {
  version: 1;
  favorites: string[];
  completed: string[];
  recent: string[];
  revealMode: 'all' | 'hide-en' | 'initials' | 'recall';
  theme: 'light' | 'dark';
  readingStyle: 'exam' | 'comfort';
  resume: ResumeState | null;
}

export interface LearningUnit {
  id: string;
  title: string;
  kind: string;
  html: string;
  plainText: string;
  wordCount: number;
  sentenceCount: number;
  printable: boolean;
}
