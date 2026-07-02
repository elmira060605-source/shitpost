'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Stage, SelectedElement } from '@/lib/stages';

interface AnimatedGridProps {
  stage: Stage;
  stageIndex: number;
  selectedElements: SelectedElement[];
  onSelect: (element: { jpgSrc: string; pngSrc?: string; x: number; y: number; width: number; height: number }) => void;
}

type PathType = 'circle' | 'square' | 'loop';

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
  columnSpeed: number;
  phase: number;
  fading: boolean;
  opacity: number;
  avoidant: boolean;
  pathType: PathType;
  orbitRadius: number;
  orbitSpeed: number;
}

const STAGE_PATHS: Record<Stage, string> = {
  background: '/assets/background/',
  face: '/assets/face_jpg/',
  body: '/assets/body_jpg/',
  text: '/assets/text_jpg/',
};

const ASSETS: Record<Stage, string[]> = {
  background: [
    'backrooms.jpg', 'beach.jpeg', 'bedroom-farm.jpg', 'berlin-stickers.jpeg', 'berlin-wall.jpg',
    'classroom.jpeg', 'code.jpeg', 'cult.jpg', 'dessert.jpg', 'dolphins.jpeg', 'dream-core.jpg',
    'dreamcore.jpg', 'egypt.jpg', 'eifel-tower.jpeg', 'explotion.jpg', 'farm-core.jpeg', 'field-clouds.jpeg',
    'flamingo-room.jpg', 'fnaf.jpg', 'forest-room.jpg', 'galaxy.jpeg', 'hallway-normall.jpeg', 'heaven.jpeg',
    'hell.jpeg', 'minecraft.jpg', 'mushrooms.jpg', 'neo-futurism.jpeg', 'new-york.jpeg', 'park.jpg',
    'party-rave.jpg', 'play-room.jpg', 'pride-fest.jpg', 'prison.jpg', 'pyramids.jpeg', 'rainbow.jpg',
    'sea.jpeg', 'slavic-room.jpg', 'slavic_hallway.jpeg', 'spongebob.jpg', 'strip-club.jpg', 'supermarket.jpg',
    'toilet.jpg', 'train-station.jpeg', 'trash-bins.jpg', 'u-bahn.jpeg', 'under-bridge.jpeg', 'weird_room.jpeg',
    'white-room.jpeg', 'wild-west.jpg', 'windows-field.jpg',
  ],
  face: [
    'Peppa-pig.jpg', 'apple.jpg', 'avatar.jpeg', 'baka.jpg', 'bath.jpeg', 'batman.jpg',
    'bear-toy-baby.jpg', 'boy-eyes.jpg', 'boy.webp', 'burger.jpg', 'buzz.jpeg', 'cat-face.jpeg',
    'cat-glasses.jpg', 'cat-sad-face.jpeg', 'cat-wash.jpg', 'chick.jpeg', 'cute-dog.jpeg',
    'dog-human.jpeg', 'doll-baby.jpg', 'drake.jpg', 'egg-face.jpeg', 'epstein.jpeg', 'eureka.jpeg',
    'fancy.jpeg', 'football.jpg', 'handsome.jpg', 'icon-smile.jpeg', 'kim.jpeg', 'lego.jpg',
    'lime-girl.jpg', 'man-eyes.jpg', 'masha.jpeg', 'michael.jpeg', 'mickey.jpeg', 'mike.jpeg',
    'monster-blue.jpeg', 'nerd.jpeg', 'pigeon-face.jpg', 'pinchili.jpeg', 'pink-cat.jpg',
    'red-heat.jpeg', 'roblox-face.jpeg', 'ronaldo.jpeg', 'sigma.jpg', 'simpson-human.jpeg',
    'smart-guy.jpg', 'star.jpg', 'tramp-loksmaxx.jpg', 'worker.jpg', 'zelenkij.jpeg',
  ],
  body: [
    'alien.jpg', 'awquard.jpg', 'baby-doll.jpg', 'ballerina.jpeg', 'barbie.jpg', 'bear.jpg', 'bird.jpeg',
    'black-costume.jpeg', 'bodybuilder.jpeg', 'bold.jpeg', 'boots.jpeg', 'cat-longneck.jpg', 'cat-toes.jpeg',
    'cat-why.jpeg', 'chicken-yoga.jpeg', 'chicken.jpeg', 'cock-pants.jpeg', 'corndog.jpeg', 'dog-long.jpg',
    'dogs-abs.jpg', 'dora.jpeg', 'fairy.jpg', 'fork.jpg', 'funpic.jpeg', 'ginger-cat.jpeg', 'green-guy.jpg',
    'grey-guy.jpg', 'griffin.jpeg', 'hamper.jpeg', 'horse-surfing.jpeg', 'jump.jpg', 'leg.jpeg', 'lion-man.jpg',
    'man-stretched.jpg', 'man-strip-boots.jpeg', 'minion.jpeg', 'patrick.jpeg', 'pickle.jpeg', 'pigeon.jpg',
    'piss-off.jpg', 'pose.jpg', 'purple-fluffy.jpeg', 'round-guy.jpeg', 'shrek.jpg', 'tampon.jpeg', 'teacher.jpg',
    'tiger.jpg', 'tramp.jpeg', 'unicorn.jpeg', 'yetti.jpg',
  ],
  text: [
    'text-01.jpg', 'text-02.jpg', 'text-03.jpg', 'text-04.jpg', 'text-05.jpg',
    'text-06.jpg', 'text-07.jpg', 'text-08.jpg', 'text-09.jpg', 'text-10.jpg',
    'text-11.jpg', 'text-12.jpg', 'text-13.jpg', 'text-14.jpg', 'text-15.jpg',
    'text-16.jpg', 'text-17.jpg', 'text-18.jpg', 'text-19.jpg', 'text-20.jpg',
    'text-21.jpg', 'text-22.jpg', 'text-23.jpg', 'text-24.jpg', 'text-25.jpg',
    'text-26.jpg', 'text-27.jpg', 'text-28.jpg', 'text-29.jpg', 'text-30.jpg',
    'text-31.jpg', 'text-32.jpg', 'text-33.jpg', 'text-34.jpg', 'text-35.jpg',
    'text-36.jpg', 'text-37.jpg', 'text-38.jpg', 'text-39.jpg', 'text-40.jpg',
    'text-41.jpg', 'text-42.jpg', 'text-43.jpg', 'text-44.jpg', 'text-45.jpg',
    'text-46.jpg', 'text-47.jpg', 'text-48.jpg', 'text-49.jpg', 'text-50.jpg',
  ],
};

const SPEEDS = [0.8, 1.2, 1.6, 2.0];
const BUFFER_ROWS = 2;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getColumnSpeed(col: number): number {
  return SPEEDS[col % SPEEDS.length];
}

const PATH_TYPES: PathType[] = ['circle', 'square', 'loop'];

export function AnimatedGrid({ stage, stageIndex, selectedElements, onSelect }: AnimatedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1024, height: 768 });
  const [elements, setElements] = useState<GridElement[]>([]);
  const [mounted, setMounted] = useState(false);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const failedClickRef = useRef(0);
  const stage3Sounds = useRef<HTMLAudioElement[]>([]);
  const stage4Sounds = useRef<HTMLAudioElement[]>([]);
  const stage4ActiveSounds = useRef<HTMLAudioElement[]>([]);
  const stage4PlayingRef = useRef(false);
  const stage4HoveredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const s3 = [
      '/assets/sound/3_stage/2-3-scream-3stage.mp3',
      '/assets/sound/3_stage/cartoon-low-pitch-laugh-4stage.mp3',
      '/assets/sound/3_stage/clang-3stage.mp3',
      '/assets/sound/3_stage/explotion-4stage.mp3',
      '/assets/sound/3_stage/fart-firstone.mp3',
    ];
    stage3Sounds.current = s3.map(src => {
      const a = new Audio(src);
      a.preload = 'auto';
      return a;
    });

    const s4 = [
      '/assets/sound/4_stage/cartoon-low-pitch-laugh-4stage.mp3',
      '/assets/sound/4_stage/edited-4stage-upd.mp3',
      '/assets/sound/4_stage/explotion-4stage.mp3',
      '/assets/sound/4_stage/laugther-cringe-4stage-upd.mp3',
      '/assets/sound/4_stage/random-sounds-upd.mp3',
      '/assets/sound/4_stage/tongue-stage4-upd.mp3',
    ];
    stage4Sounds.current = s4.map(src => {
      const a = new Audio(src);
      a.preload = 'auto';
      return a;
    });
  }, []);

  const basePath = STAGE_PATHS[stage];
  const assetsList = ASSETS[stage];
  const cols = 10;
  const cellSize = useMemo(() => Math.floor(dimensions.width / cols), [dimensions.width]);
  const rows = useMemo(() => Math.max(10, Math.ceil(dimensions.height / cellSize) + BUFFER_ROWS), [dimensions.height, cellSize]);
  const totalCells = cols * rows;
  const yOffset = -BUFFER_ROWS * cellSize;

  useEffect(() => {
    setMounted(true);
    const updateDimensions = () => setDimensions({ width: window.innerWidth || 1024, height: window.innerHeight || 768 });
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouse);
    return () => window.removeEventListener('mousemove', onMouse);
  }, []);

  useEffect(() => {
    if (stage === 'body') failedClickRef.current = 0;
  }, [stage]);

  useEffect(() => {
    if (stage !== 'text') {
      stage4ActiveSounds.current = [];
      return;
    }
    const shuffled = [...stage4Sounds.current].sort(() => Math.random() - 0.5);
    stage4ActiveSounds.current = shuffled.slice(0, 2);
  }, [stage]);

  const initializeElements = useCallback(() => {
    if (dimensions.width === 0) return;
    const shuffledAssets = shuffleArray(assetsList);
    const newElements: GridElement[] = [];
    for (let i = 0; i < totalCells; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const isText = stage === 'text';
      newElements.push({
        id: `${stage}-${i}`,
        jpgSrc: basePath + shuffledAssets[i % shuffledAssets.length],
        x: col * cellSize,
        y: row * cellSize + yOffset,
        baseX: col * cellSize,
        baseY: row * cellSize + yOffset,
        width: cellSize,
        height: cellSize,
        rotation: 0,
        columnSpeed: getColumnSpeed(col),
        phase: i * 1.7,
        fading: false,
        opacity: 1,
        avoidant: isText && Math.random() < 0.4,
        pathType: isText ? PATH_TYPES[Math.floor(Math.random() * PATH_TYPES.length)] : 'circle',
        orbitRadius: 8 + Math.random() * 12,
        orbitSpeed: 0.3 + Math.random() * 0.4,
      });
    }
    setElements(newElements);
  }, [stage, basePath, assetsList, dimensions.width, dimensions.height, cols, cellSize, rows, totalCells, yOffset]);

  useEffect(() => {
    if (!mounted || dimensions.width === 0) return;
    initializeElements();
  }, [mounted, stage, stageIndex]);

  const playRandomSound = useCallback((sounds: HTMLAudioElement[]) => {
    if (sounds.length === 0) return;
    const idx = Math.floor(Math.random() * sounds.length);
    const audio = sounds[idx];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const playStage4Sound = useCallback(() => {
    if (stage4PlayingRef.current) return;
    const active = stage4ActiveSounds.current;
    if (active.length === 0) return;
    const idx = Math.floor(Math.random() * active.length);
    const audio = active[idx];
    audio.currentTime = 0;
    stage4PlayingRef.current = true;
    audio.play().catch(() => { stage4PlayingRef.current = false; });
    audio.onended = () => { stage4PlayingRef.current = false; };
  }, []);

  useEffect(() => {
    if (stage !== 'text') {
      stage4Sounds.current.forEach(a => { a.pause(); a.currentTime = 0; });
      stage4PlayingRef.current = false;
      stage4HoveredRef.current.clear();
    }
  }, [stage]);

  useEffect(() => {
    return () => {
      stage4Sounds.current.forEach(a => { a.pause(); a.currentTime = 0; });
      stage4PlayingRef.current = false;
      stage4HoveredRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (elements.length === 0 || dimensions.width === 0) return;
    const animate = (timestamp: number) => {
      setElements(prev => prev.map((el, i) => {
        const { baseX, baseY, columnSpeed, phase, fading, opacity, avoidant, pathType, orbitRadius, orbitSpeed } = el;
        let newX = el.x, newY = el.y, newRotation = el.rotation;
        let newOpacity = opacity;
        const t = timestamp / 1000;

        if (stage === 'background') {
          const col = i % cols;
          const scrollPhase = t * 0.4 + col * 0.9;
          const burstSignal = Math.sin(scrollPhase) + Math.sin(scrollPhase * 2.3 + 1.2) * 0.5;
          const scrollMultiplier = 0.3 + (burstSignal + 1.5) / 3.0 * 2.7;
          const extraBurst = col % 4 === 3 ? 1.4 : 1.0;
          newY += columnSpeed * scrollMultiplier * extraBurst;
          if (newY > dimensions.height) newY = -el.height;
        } else if (stage === 'face') {
          const row = Math.floor(i / cols);
          newY += columnSpeed * 1.15;
          newX = baseX + Math.sin(t * 1.5 + row * 0.6) * 12;
          if (newY > dimensions.height) newY = -el.height;
        } else if (stage === 'body') {
          newY += columnSpeed * 1.1;
          const driftX = Math.sin(t * 0.8 + phase) * 25 + Math.sin(t * 2 + phase * 0.5) * 10;
          const jitter = Math.sin(t * 8 + phase * 2) * 3;
          newX = baseX + driftX + jitter;
          newY += Math.sin(t * 4 + phase) * 2;
          newRotation = Math.sin(t * 1.2 + phase) * 0.12;
          if (newY > dimensions.height + 20) newY = -el.height;
          if (fading) {
            newOpacity = Math.max(0, opacity - 0.04);
          }
        } else if (stage === 'text') {
          newY += columnSpeed * 1.2;
          const pathTime = t * orbitSpeed;
          if (pathType === 'circle') {
            newX = baseX + Math.cos(pathTime + phase) * orbitRadius;
            newY += Math.sin(pathTime + phase) * orbitRadius * 0.3;
          } else if (pathType === 'square') {
            const step = (pathTime + phase) % (Math.PI * 2);
            const halfR = orbitRadius * 0.5;
            if (step < Math.PI / 2) { newX = baseX + halfR; newY += 0; }
            else if (step < Math.PI) { newX = baseX + halfR; newY += halfR * 0.5; }
            else if (step < Math.PI * 1.5) { newX = baseX - halfR; newY += halfR * 0.5; }
            else { newX = baseX - halfR; newY += 0; }
            newX += Math.sin(t * 2 + phase) * 3;
          } else {
            newX = baseX + Math.cos(pathTime + phase) * orbitRadius * 0.7;
            newY += Math.sin(pathTime * 1.4 + phase) * orbitRadius * 0.25;
          }
          newRotation = Math.sin(t * 0.8 + phase * 1.3) * 0.06;
          if (newY > dimensions.height + 40) newY = -el.height;

          if (avoidant) {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const mdx = cx - mouseRef.current.x;
            const mdy = cy - mouseRef.current.y;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (dist < 140 && dist > 0) {
              const force = (140 - dist) / 140 * 50;
              const nx = mdx / dist;
              const ny = mdy / dist;
              newX += nx * force;
              newY += ny * force;
              newX = Math.max(0, Math.min(dimensions.width - el.width, newX));
              newY = Math.max(0, Math.min(dimensions.height - el.height, newY));
            }
          }
        }
        return { ...el, x: newX, y: newY, rotation: newRotation, opacity: newOpacity };
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [elements.length, stage, dimensions, cols, playRandomSound]);

  useEffect(() => {
    const allJpg = [
      ...ASSETS.background.map(f => STAGE_PATHS.background + f),
      ...ASSETS.face.map(f => STAGE_PATHS.face + f),
      ...ASSETS.body.map(f => STAGE_PATHS.body + f),
      ...ASSETS.text.map(f => STAGE_PATHS.text + f),
    ];
    allJpg.forEach(src => { const img = new Image(); img.src = src; });

    const textPngs = Array.from({ length: 50 }, (_, i) => `/assets/text_png/text-${String(i + 1).padStart(2, '0')}.png`);
    textPngs.forEach(src => { const img = new Image(); img.src = src; });

    const facePngs = ASSETS.face.map(f => STAGE_PATHS.face.replace('_jpg', '_png') + f.replace(/\.(jpeg|jpg|webp)$/, '.png'));
    facePngs.forEach(src => { const img = new Image(); img.src = src; });

    const bodyPngs = ASSETS.body.map(f => STAGE_PATHS.body.replace('_jpg', '_png') + f.replace(/\.(jpeg|jpg)$/, '.png'));
    bodyPngs.forEach(src => { const img = new Image(); img.src = src; });
  }, []);

  const checkExists = async (src: string | undefined): Promise<boolean> => {
    if (!src) return false;
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

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

    if (stage === 'body' && !element.fading) {
      const firstClick = failedClickRef.current === 0;
      const shouldFail = firstClick || Math.random() < 0.4;
      if (shouldFail) {
        failedClickRef.current += 1;
        playRandomSound(stage3Sounds.current);
        setElements(prev => prev.map(el =>
          el.id === element.id ? { ...el, fading: true } : el
        ));
        return;
      }
    }

    const candidate = getMatchingPng(stage, element.jpgSrc);
    let finalPng: string | undefined = undefined;
    if (candidate) {
      const exists = await checkExists(candidate);
      if (exists) finalPng = candidate;
    }

    onSelect({ jpgSrc: element.jpgSrc, pngSrc: finalPng, x: element.x, y: element.y, width: element.width, height: element.height });
  }, [onSelect, stage]);

  const handleStage4HoverEnter = useCallback((el: GridElement) => {
    if (stage !== 'text' || !el.avoidant) return;
    if (stage4HoveredRef.current.has(el.id)) return;
    stage4HoveredRef.current.add(el.id);
    playStage4Sound();
  }, [stage]);

  const handleStage4HoverLeave = useCallback((el: GridElement) => {
    stage4HoveredRef.current.delete(el.id);
  }, []);

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
        <div
          key={el.id}
          className="absolute cursor-pointer"
          style={{
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            transform: `rotate(${el.rotation}rad)`,
            opacity: el.opacity,
            pointerEvents: el.opacity < 0.01 ? 'none' as const : undefined,
          }}
          onClick={(e) => handleClick(el, e)}
          onMouseEnter={() => handleStage4HoverEnter(el)}
          onMouseLeave={() => handleStage4HoverLeave(el)}
        >
          <img src={el.jpgSrc} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
        </div>
      ))}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm py-3 text-center text-black text-sm font-mono tracking-wider">Click to freeze image</div>
    </div>
  );
}
