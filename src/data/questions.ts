export type EmotionalCategory = 'numb' | 'chaotic' | 'anxious' | 'detached';

export interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    category: EmotionalCategory;
  }[];
}

export const questions: Question[] = [
  {
    id: 1,
    text: "You wake up and check your phone. What's the first thing you feel?",
    options: [
      { label: "Nothing, just scroll", category: 'numb' },
      { label: "Dread about 47 unread notifications", category: 'anxious' },
      { label: "Chaos, everything is chaos", category: 'chaotic' },
      { label: "Already planning to go back to sleep", category: 'detached' },
    ],
  },
  {
    id: 2,
    text: "Your friend asks how you're doing. What do you say?",
    options: [
      { label: '"Fine" (but you are not fine)', category: 'numb' },
      { label: "Honest answer because you're spiraling", category: 'chaotic' },
      { label: "Change the subject immediately", category: 'detached' },
      { label: "Overthink your response for 20 minutes", category: 'anxious' },
    ],
  },
  {
    id: 3,
    text: "You're trying to focus but your brain is...",
    options: [
      { label: "Running 47 tabs of nothing useful", category: 'chaotic' },
      { label: "Completely offline", category: 'numb' },
      { label: "Anxious about everything and nothing", category: 'anxious' },
      { label: "In another dimension", category: 'detached' },
    ],
  },
  {
    id: 4,
    text: "What do you actually need right now?",
    options: [
      { label: "Someone to tell me it gets better", category: 'numb' },
      { label: "To scream into the void", category: 'chaotic' },
      { label: "To disappear for a while", category: 'detached' },
      { label: "To know someone actually gets it", category: 'anxious' },
    ],
  },
];
