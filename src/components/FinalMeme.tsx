'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';

interface FinalMemeProps {
  background: string;
  body: string;
  face: string;
  text: string;
  caption: string;
  onReset: () => void;
}

const DEFAULT_BACKGROUND = '/assets/background/white-room.jpeg';
const DEFAULT_FACE = '/assets/face_png/ronaldo.png';
const DEFAULT_BODY = '/assets/body_png/dora.png';

type TextPosition = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'overlap-body' | 'overlap-face';

function getRandomTextParams() {
  const positions: TextPosition[] = ['bottom-center', 'bottom-left', 'bottom-right', 'overlap-body', 'overlap-face'];
  const position = positions[Math.floor(Math.random() * positions.length)];
  const scale = 0.8 + Math.random() * 1.2; // 0.8x - 2.0x
  const stretchX = 0.9 + Math.random() * 0.2; // 0.9x - 1.1x
  const stretchY = 0.9 + Math.random() * 0.2;
  const rotation = (Math.random() - 0.5) * 0.15; // -0.075 to 0.075 radians
  
  return { position, scale, stretchX, stretchY, rotation };
}

export function FinalMeme({ background, body, face, text, onReset }: FinalMemeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textDrawnRef = useRef(false);

  // Generate random text params once per render
  const textParams = useMemo(() => getRandomTextParams(), []);

  const loadImage = useCallback(async (src: string): Promise<HTMLImageElement | null> => {
    if (!src) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.error(`Failed to load: ${src}`);
        resolve(null);
      };
      img.src = src;
    });
  }, []);

  const renderMeme = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const size = 1024;
    canvas.width = size;
    canvas.height = size;

    // Background - full canvas
    let bgImg = await loadImage(background || DEFAULT_BACKGROUND);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, size, size);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, size, size);
    }

    // Body - centered, 55%
    const bodyImg = await loadImage(body || DEFAULT_BODY);
    if (bodyImg) {
      const bWidth = size * 0.55;
      const bHeight = size * 0.55;
      const bX = (size - bWidth) / 2;
      const bY = size * 0.28;
      ctx.drawImage(bodyImg, bX, bY, bWidth, bHeight);
    }

    // Face - centered above body, 28%
    const faceImg = await loadImage(face || DEFAULT_FACE);
    if (faceImg) {
      const fWidth = size * 0.28;
      const fHeight = size * 0.28;
      const fX = (size - fWidth) / 2;
      const fY = size * 0.08;
      ctx.drawImage(faceImg, fX, fY, fWidth, fHeight);
    }

    // Text - final meme layer (PNG) as a true visual element
    const textImg = await loadImage(text);
    if (textImg && !textDrawnRef.current) {
      const { position, scale, stretchX, stretchY, rotation } = textParams;
      let tWidth = size * 0.25 * scale * stretchX;
      let tHeight = size * 0.25 * scale * stretchY;
      let tX = 0;
      let tY = 0;

      // Position based on random selection
      switch (position) {
        case 'bottom-center':
          tX = (size - tWidth) / 2;
          tY = size - tHeight - 20;
          break;
        case 'bottom-left':
          tX = 30;
          tY = size - tHeight - 20;
          break;
        case 'bottom-right':
          tX = size - tWidth - 30;
          tY = size - tHeight - 20;
          break;
        case 'overlap-body':
          tX = (size - tWidth) / 2 + (Math.random() - 0.5) * size * 0.3;
          tY = size * 0.5 + (Math.random() - 0.5) * size * 0.2;
          break;
        case 'overlap-face':
          tX = (size - tWidth) / 2 + (Math.random() - 0.5) * size * 0.4;
          tY = size * 0.25 + (Math.random() - 0.5) * size * 0.15;
          break;
      }

      ctx.save();
      ctx.translate(tX + tWidth / 2, tY + tHeight / 2);
      ctx.rotate(rotation);
      ctx.translate(-tWidth / 2, -tHeight / 2);
      // Do not draw a white background; treat PNG as image with transparency
      ctx.drawImage(textImg, 0, 0, tWidth, tHeight);
      ctx.restore();
      textDrawnRef.current = true;
    }
  }, [background, body, face, text, textParams, loadImage]);

  useEffect(() => {
    renderMeme();
  }, [renderMeme]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border-4 border-black"
        style={{ aspectRatio: '1/1' }}
      />
      <button
        onClick={onReset}
        className="mt-8 px-12 py-5 bg-black text-white font-bold text-xl hover:bg-gray-800 transition-colors rounded-lg"
      >
        CREATE AGAIN
      </button>
    </div>
  );
}
