'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const [showNotification, setShowNotification] = useState(true);
  const [notifVisible, setNotifVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setNotifVisible(true));
    const fadeOut = setTimeout(() => setNotifVisible(false), 3500);
    const remove = setTimeout(() => setShowNotification(false), 4000);
    return () => { clearTimeout(fadeOut); clearTimeout(remove); };
  }, []);

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

  const bgEl = selectedElements.find(e => e.stage === 'background');
  const faceEl = selectedElements.find(e => e.stage === 'face');
  const bodyEl = selectedElements.find(e => e.stage === 'body');
  const textEl = selectedElements.find(e => e.stage === 'text');

  // FINAL RENDER - MUST use ONLY PNG assets
  const finalBackground = bgEl?.src || DEFAULT_ASSETS.background;
  const finalFace = faceEl?.pngSrc || DEFAULT_ASSETS.face;
  const finalBody = bodyEl?.pngSrc || DEFAULT_ASSETS.body;
  const finalText = textEl?.pngSrc || DEFAULT_ASSETS.text;

  return (
    <>
      {showNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div
            className="bg-white/80 backdrop-blur-sm py-5 px-10 text-center text-black text-base font-mono tracking-wider rounded"
            style={{ transition: 'opacity 0.5s ease', opacity: notifVisible ? 1 : 0 }}
          >
            🔊 Sound recommended
          </div>
        </div>
      )}
      {showFinal ? (
        <FinalMeme
          background={finalBackground}
          face={finalFace}
          body={finalBody}
          text={finalText}
          onReset={handleReset}
        />
      ) : (
        <AnimatedGrid
          stage={currentStage}
          stageIndex={stageIndex}
          selectedElements={selectedElements}
          onSelect={handleSelect}
        />
      )}
    </>
  );
}
