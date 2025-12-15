export enum LogType {
  FEEDING = 'FEEDING',
  SLEEP = 'SLEEP',
  DIAPER = 'DIAPER',
  GROWTH = 'GROWTH',
  TEMPERATURE = 'TEMPERATURE',
  SYMPTOM = 'SYMPTOM'
}

export enum FeedType {
  BREAST = 'BREAST',
  BOTTLE = 'BOTTLE',
  SOLIDS = 'SOLIDS'
}

export enum AgeGroup {
  NEWBORN = 'Newborn (0-3m)',
  INFANT = 'Infant (3-12m)',
  TODDLER = 'Toddler (1yr+)'
}

export type Language = 'en' | 'te';

export interface LogEntry {
  id: string;
  type: LogType;
  timestamp: Date;
  details: {
    amount?: number; // oz or ml
    duration?: number; // minutes
    side?: 'left' | 'right' | 'both';
    contents?: string; // for diaper
    temperature?: number; // celsius
    symptom?: string;
    note?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface InfantProfile {
  name: string;
  parentName: string;
  birthDate: Date;
  weight: number; // kg
  height: number; // cm
  ageGroup?: AgeGroup; // Derived field
  language: Language;
}

export type ViewState = 'dashboard' | 'logs' | 'analysis' | 'report';
