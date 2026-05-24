'use client';

import { useState, useCallback } from 'react';
import { Stage, SelectedElement } from '@/lib/stages';
import { AnimatedGrid } from './AnimatedGrid';
import { FinalMeme } from './FinalMeme';

const DEFAULT_ASSETS = {
  background: '/assets/background/white-room.jpeg',
  face: '/assets/face_png/ronaldo.png',
  body: '/assets/body_png/dora.png',
  text: '/assets/text_png/text-01.png',
};

export function StageController() {
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
  const [showFinal, setShowFinal] = useState(false);

  const stages: Stage[] = ['background', 'face', 'body', 'text'];
  const currentStage = stages[stageIndex];

  const handleSelect = useCallback((element: { jpgSrc: string; pngSrc?: string; x: number; y: number; width: number; height: number }) => {
    if (!element.jpgSrc) return;

    // Get PNG for final render - NEVER use JPG for final
    let renderPng = element.pngSrc || DEFAULT_ASSETS[currentStage] || '';

    const newElement: SelectedElement = {
      stage: currentStage,
      src: element.jpgSrc,         // Visual: what user clicked (JPG)
      pngSrc: renderPng,         // Final: ONLY PNG
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };

    console.log(`Selected ${currentStage}:`, { jpg: element.jpgSrc, png: renderPng });

    setSelectedElements(prev => [...prev, newElement]);

    if (stageIndex < 3) {
      setStageIndex(prev => prev + 1);
    } else {
      setShowFinal(true);
    }
  }, [currentStage, stageIndex]);

  const handleReset = useCallback(() => {
    setStageIndex(0);
    setSelectedElements([]);
    setShowFinal(false);
  }, []);

  if (showFinal) {
    const bgEl = selectedElements.find(e => e.stage === 'background');
    const faceEl = selectedElements.find(e => e.stage === 'face');
    const bodyEl = selectedElements.find(e => e.stage === 'body');
    const textEl = selectedElements.find(e => e.stage === 'text');

    // FINAL RENDER - MUST use ONLY PNG assets
    const finalBackground = bgEl?.src || DEFAULT_ASSETS.background;
    const finalFace = faceEl?.pngSrc || DEFAULT_ASSETS.face;
    const finalBody = bodyEl?.pngSrc || DEFAULT_ASSETS.body;
    const finalText = textEl?.pngSrc || DEFAULT_ASSETS.text;

    console.log('FINAL MEME ASSETS (must be PNG):', {
      background: finalBackground,
      face: finalFace,
      body: finalBody,
      text: finalText,
    });

    return (
      <FinalMeme
        background={finalBackground}
        face={finalFace}
        body={finalBody}
        text={finalText}
        onReset={handleReset}
      />
    );
  }

  return (
    <AnimatedGrid
      stage={currentStage}
      stageIndex={stageIndex}
      selectedElements={selectedElements}
      onSelect={handleSelect}
    />
  );
}