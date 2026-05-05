import { EmotionalCategory } from '@/data/questions';

export const assetCategories: Record<EmotionalCategory, string[]> = {
  numb: ['white-room'],
  chaotic: ['weird_room'],
  anxious: ['slavic_hallway'],
  detached: ['under-bridge'],
};

export const backgroundImages: Record<string, string[]> = {
  'white-room': ['white-room.jpeg'],
  'weird_room': ['weird_room.jpeg'],
  'slavic_hallway': ['slavic_hallway.jpeg'],
  'under-bridge': ['under-bridge.jpeg'],
  'beach': ['beach.jpeg'],
  'field-clouds': ['field-clouds.jpeg'],
};

export const bodyImages: Record<string, string[]> = {
  'white-room': ['minion.png', 'dora.png'],
  'weird_room': ['chicken.png', 'boot.png', 'awquard.png'],
  'slavic_hallway': ['dora.png', 'chicken.png'],
  'under-bridge': ['minion.png', 'awquard.png'],
  'beach': ['minion.png', 'boot.png'],
  'field-clouds': ['dora.png', 'chicken.png'],
};

export const faceImages: Record<string, string[]> = {
  'white-room': ['icon-smile.png', 'boy.png'],
  'weird_room': ['roblox-face.png', 'ronaldo.png', 'cat-face.png'],
  'slavic_hallway': ['cat-sad-face.png', 'boy.png', 'ronaldo.png'],
  'under-bridge': ['cat-face.png', 'icon-smile.png'],
  'beach': ['roblox-face.png', 'cat-face.png'],
  'field-clouds': ['cat-sad-face.png', 'icon-smile.png'],
};

export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function selectAssets(categories: EmotionalCategory[]): {
  background: string;
  body: string;
  face: string;
} {
  const backgroundCategories = categories.flatMap(c => assetCategories[c]);
  const bodyCategories = categories.flatMap(c => assetCategories[c]);
  const faceCategories = categories.flatMap(c => assetCategories[c]);

  const backgroundCategory = getRandomItem(backgroundCategories);
  const bodyCategory = getRandomItem(bodyCategories);
  const faceCategory = getRandomItem(faceCategories);

  return {
    background: getRandomItem(backgroundImages[backgroundCategory] || backgroundImages['white-room']),
    body: getRandomItem(bodyImages[bodyCategory] || bodyImages['white-room']),
    face: getRandomItem(faceImages[faceCategory] || faceImages['white-room']),
  };
}
