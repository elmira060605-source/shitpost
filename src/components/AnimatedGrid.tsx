'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Stage, SelectedElement } from '@/lib/stages';

interface AnimatedGridProps {
  stage: Stage;
  stageIndex: number;
  selectedElements: SelectedElement[];
  onSelect: (element: { jpgSrc: string; pngSrc?: string; x: number; y: number; width: number; height: number }) => void;
}

interface GridElement {
  id: string;
  jpgSrc: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  rotation: number;
  driftX: number;
  driftY: number;
}

const STAGE_PATHS: Record<Stage, string> = {
  background: '/assets/background/',
  face: '/assets/face_jpg/',
  body: '/assets/body_jpg/',
  text: '/assets/text_jpg/',
};

const ASSETS: Record<Stage, string[]> = {
  background: ['beach.jpeg', 'field-clouds.jpeg', 'slavic_hallway.jpeg', 'under-bridge.jpeg', 'weird_room.jpeg', 'white-room.jpeg'],
  face: ['ronaldo.jpeg', 'roblox-face.jpeg', 'cat-face.jpeg', 'cat-sad-face.jpeg', 'boy.webp', 'icon-smile.jpeg'],
  body: ['awquard.jpg', 'boots.jpeg', 'chicken.jpeg', 'dora.jpeg', 'minion.jpeg'],
  text: ['WHY.jpg', '67.jpg', 'arabic.jpg', 'it-is-i.jpg', 'lazy.jpg', 'not-funny.jpg'],
};

const VALID_PNG: Record<Stage, string[]> = {
  background: [],
  face: ['boy.png', 'cat-face.png', 'cat-sad-face.png', 'icon-smile.png', 'roblox-face.png', 'ronaldo.png'],
  body: ['awquard.png', 'boot.png', 'chicken.png', 'dora.png', 'minion.png'],
  text: ['67.png', 'WHY.png', 'arabic.png', 'it-is-i.png', 'not-funny.png'],
};

const DEFAULT_PNG: Record<Stage, string> = {
  background: '/assets/background/white-room.jpeg',
  face: '/assets/face_png/ronaldo.png',
  body: '/assets/body_png/dora.png',
  text: '/assets/text_png/it-is-i.png',
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getMatchingPng(stageType: Stage, jpgSrc: string): string | null {
  const filename = jpgSrc.split('/').pop() || '';
  const name = filename.replace(/\.[^.]+$/, '');
  
  let pngFolder = '';
  if (stageType === 'body') pngFolder = '/assets/body_png/';
  else if (stageType === 'face') pngFolder = '/assets/face_png/';
  else if (stageType === 'text') pngFolder = '/assets/text_png/';
  else return jpgSrc;
  
  const pngName = name + '.png';
  if (VALID_PNG[stageType].includes(pngName)) {
    return pngFolder + pngName;
  }
  console.warn(`Missing asset: ${pngFolder}${pngName}`);
  return null;
}

export function AnimatedGrid({ stage, stageIndex, selectedElements, onSelect }: AnimatedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1024, height: 768 });
  const [elements, setElements] = useState<GridElement[]>([]);
  const [mounted, setMounted] = useState(false);
  const animationRef = useRef<number | null>(null);

  const basePath = STAGE_PATHS[stage];
  const assetsList = ASSETS[stage];
  const cols = 10;
  const cellSize = useMemo(() => Math.floor(dimensions.width / cols), [dimensions.width]);
  const rows = useMemo(() => Math.max(6, Math.floor(dimensions.height / cellSize)), [dimensions.height, cellSize]);
  const totalCells = cols * rows;

  useEffect(() => {
    setMounted(true);
    const updateDimensions = () => setDimensions({ width: window.innerWidth || 1024, height: window.innerHeight || 768 });
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const initializeElements = useCallback(() => {
    if (dimensions.width === 0) return;
    const shuffledAssets = shuffleArray(assetsList);
    const newElements: GridElement[] = [];
    for (let i = 0; i < totalCells; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      newElements.push({
        id: `${stage}-${i}`,
        jpgSrc: basePath + shuffledAssets[i % shuffledAssets.length],
        x: col * cellSize,
        y: row * cellSize,
        baseX: col * cellSize,
        baseY: row * cellSize,
        width: cellSize,
        height: cellSize,
        rotation: 0,
        driftX: 0,
        driftY: 0,
      });
    }
    setElements(newElements);
  }, [stage, basePath, assetsList, dimensions.width, dimensions.height, cols, cellSize, rows, totalCells]);

  useEffect(() => {
    if (!mounted || dimensions.width === 0) return;
    initializeElements();
  }, [mounted, stage, stageIndex]);

  useEffect(() => {
    if (elements.length === 0 || dimensions.width === 0) return;
    const animate = () => {
      setElements(prev => prev.map((el, i) => {
        let { baseX, baseY } = el;
        let newX = el.x, newY = el.y, newRotation = el.rotation;
        const direction = (i % cols) % 2 === 0 ? 1 : -1;
        
        if (stage === 'background') {
          newY += 0.7 * direction;
          if (newY > dimensions.height) newY = -el.height;
          if (newY < -el.height) newY = dimensions.height;
        } else if (stage === 'face') {
          const row = Math.floor(i / cols);
          newX = baseX + Math.sin(Date.now() / 800 + row * 0.6) * 12;
          newY += 1.0 * direction;
          if (newY > dimensions.height) newY = -el.height;
          if (newY < -el.height) newY = dimensions.height;
        } else if (stage === 'body') {
          const time = Date.now() / 600;
          newX = baseX + Math.cos(time + i * 0.3) * 45;
          newY = baseY + Math.sin(time * 1.2 + i * 0.4) * 35;
          newRotation = Math.sin(time + i) * 0.2;
        } else if (stage === 'text') {
          const time = Date.now() / 120;
          const glitch = Math.random() > 0.92 ? (Math.random() - 0.5) * 80 : 0;
          newX = baseX + Math.sin(time * 0.8 + i * 0.4) * 40 + glitch;
          newY = baseY + Math.cos(time * 0.6 + i * 0.3) * 40 + glitch;
          newRotation = Math.sin(time * 1.5 + i) * 0.25;
        }
        return { ...el, x: newX, y: newY, rotation: newRotation };
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [elements.length, stage, dimensions]);

  // Helper: check if given image URL exists (graceful fallback)
  const checkExists = async (src: string | undefined): Promise<boolean> => {
    if (!src) return false;
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  // Final PNG path mapping for current stage
  const getMatchingPng = (stageType: Stage, jpgSrc: string): string | null => {
    const filename = jpgSrc.split('/').pop() || '';
    const name = filename.replace(/\.[^.]+$/, '');
    let folder = '';
    if (stageType === 'body') folder = '/assets/body_png/';
    else if (stageType === 'face') folder = '/assets/face_png/';
    else if (stageType === 'text') folder = '/assets/text_png/';
    else return null;
    const candidate = folder + name + '.png';
    return candidate;
  };

  const handleClick = useCallback(async (element: GridElement, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const candidate = getMatchingPng(stage, element.jpgSrc);
    let finalPng: string | undefined = undefined;
    if (candidate) {
      const exists = await checkExists(candidate);
      if (exists) finalPng = candidate;
    }

    onSelect({ jpgSrc: element.jpgSrc, pngSrc: finalPng, x: element.x, y: element.y, width: element.width, height: element.height });
  }, [onSelect, stage]);

  if (!mounted || dimensions.width === 0 || elements.length === 0) {
    return <div ref={containerRef} className="fixed inset-0 bg-white flex items-center justify-center"><div className="text-black font-mono">Loading...</div></div>;
  }

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-white">
      {selectedElements.map((el, i) => (
        <div key={`frozen-${el.stage}-${i}`} className="absolute pointer-events-none z-20" style={{ left: el.x, top: el.y, width: el.width, height: el.height }}>
          <img src={el.src} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      ))}
      {elements.map(el => (
        <div key={el.id} className="absolute cursor-pointer" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}rad)` }} onClick={(e) => handleClick(el, e)}>
          <img src={el.jpgSrc} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
        </div>
      ))}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-black text-sm font-mono z-50 bg-white/90 px-4 py-2">Click to freeze image</div>
    </div>
  );
}
