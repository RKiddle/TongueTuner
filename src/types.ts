export type SupportedLanguage = 'thai' | 'mandarin' | 'japanese';

export type AnimalType = 'elephant' | 'panda' | 'shiba';

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  tutorName: string;
  tutorAnimal: AnimalType;
  tutorRole: string;
  tutorCatchphrase: string;
  greetingNative: string;
  greetingRomanized: string;
  greetingEnglish: string;
  defaultVoice: string;
  recommendedVoices: { id: string; name: string; description: string; gender: string }[];
  accentColor: string;
  culturalDescription: string;
  tonalSystemDescription: string;
  keyPoliteParticles: string[];
}

export interface SentimentAnalysis {
  sentiment: string;
  sentimentSummary: string;
  politenessLevel: 'Formal' | 'Polite' | 'Casual' | 'Blunt';
  politenessScore: number; // 0-100
  confidenceScore: number; // 0-100
  emotionalTone: 'Hesitant' | 'Neutral' | 'Confident' | 'Warm' | 'Playful' | 'Apologetic' | 'Frustrated';
  tonalPitchNotes: string;
  grammarPointers?: string;
  encouragement: string;
  tutorReactionEmotion: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: number;
  text: string;
  romanized?: string;
  english?: string;
  audioBase64?: string;
  isPlaying?: boolean;
  analysis?: SentimentAnalysis;
  language: SupportedLanguage;
  inputMode?: 'voice' | 'text';
}

export interface PracticeScenario {
  id: string;
  title: string;
  icon: string;
  description: string;
  language: SupportedLanguage;
  location: string;
  userRole: string;
  tutorRole: string;
  sentimentTarget: string;
  targetPhrases: { native: string; romanized: string; english: string; toneNote?: string }[];
}

export interface PronunciationDrill {
  id: string;
  title: string;
  focus: string;
  nativeText: string;
  romanized: string;
  english: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Mastery';
  tonalTips: string;
  language: SupportedLanguage;
}

export interface FlashCard {
  id: string;
  character: string;
  name: string;
  reading: string;
  toneOrPitch: string;
  meaning: string;
  mnemonic: string;
  exampleWord: string;
  exampleReading: string;
  exampleMeaning: string;
  category: 'consonants' | 'vowels' | 'basic_words' | 'kanji_hanzi';
  language: SupportedLanguage;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentMessageId: string | null;
  speed: number;
}
