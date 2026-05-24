'use client';

export type Stage = 'background' | 'face' | 'body' | 'text';

export const STAGES: Stage[] = ['background', 'face', 'body', 'text'];

export interface SelectedElement {
  stage: Stage;
  src: string;
  pngSrc?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

