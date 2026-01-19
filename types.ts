
export enum LogType {
  FEEDING = 'FEEDING',
  SLEEP = 'SLEEP',
  DIAPER = 'DIAPER',
  GROWTH = 'GROWTH',
  TEMPERATURE = 'TEMPERATURE',
  SYMPTOM = 'SYMPTOM',
  HEART_RATE = 'HEART_RATE',
  SPO2 = 'SPO2',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  MEAL_ANALYSIS = 'MEAL_ANALYSIS'
}

export enum SeverityLevel {
  STABLE = 'STABLE',
  WARNING = 'WARNING',
  EMERGENCY = 'EMERGENCY'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export enum AgeGroup {
  NEWBORN = 'Newborn (0-3m)',
  INFANT = 'Infant (3-12m)',
  TODDLER = 'Toddler (1yr+)'
}

export type Language = 'en' | 'te';

export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  mainIngredients: string[];
}

export interface LogEntry {
  id: string;
  type: LogType;
  timestamp: Date;
  details: {
    amount?: number;
    duration?: number;
    side?: 'left' | 'right' | 'both';
    contents?: string;
    temperature?: number;
    bpm?: number;
    oxygen?: number;
    glucose?: number;
    symptom?: string;
    note?: string;
    severity?: SeverityLevel;
    nutrients?: Nutrients;
    imageUrl?: string;
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
  doctorPhone?: string;
  birthDate: Date;
  weight: number;
  height: number;
  gender: Gender;
  ageGroup?: AgeGroup;
  language: Language;
}

export type ViewState = 'landing' | 'auth' | 'dashboard' | 'logs' | 'analysis' | 'report' | 'profile' | 'scanner';
