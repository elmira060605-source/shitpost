'use client';

import { useEffect, useRef, useCallback } from 'react';

interface FinalMemeProps {
  background: string;
  body: string;
  face: string;
  text: string;
  onReset: () => void;
}

const DEFAULT_BACKGROUND = '/assets/background/white-room.jpeg';
const DEFAULT_FACE = '/assets/face_png/ronaldo.png';
const DEFAULT_BODY = '/assets/body_png/dora.png';

type TextPosition = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'side-left' | 'side-right';

function getTextAnalysis(img: HTMLImageElement): {
  transparencyRatio: number;
  density: number;
  isTextOnly: boolean;
} {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return { transparencyRatio: 0, density: 0.5, isTextOnly: false };

  c.width = img.width;
  c.height = img.height;
  ctx.drawImage(img, 0, 0);

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, img.width, img.height);
  } catch {
    return { transparencyRatio: 0, density: 0.5, isTextOnly: false };
  }

  const d = data.data;
  const totalPixels = img.width * img.height;
  let transparentPixels = 0;
  let top = img.height, bottom = 0, left = img.width, right = 0;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const alpha = d[(y * img.width + x) * 4 + 3];
      if (alpha === 0) {
        transparentPixels++;
      } else {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  const nonTransparentPixels = totalPixels - transparentPixels;
  const transparencyRatio = transparentPixels / totalPixels;
  const bboxW = Math.max(1, right - left);
  const bboxH = Math.max(1, bottom - top);
  const density = nonTransparentPixels / (bboxW * bboxH);
  const isTextOnly = transparencyRatio > 0.5 || density < 0.4;

  return { transparencyRatio, density, isTextOnly };
}

function getRandomTextParams(bodyWidth: number, textAnalysis: { isTextOnly: boolean }) {
  const positions: TextPosition[] = ['bottom-center', 'bottom-left', 'bottom-right', 'side-left', 'side-right'];
  const position = positions[Math.floor(Math.random() * positions.length)];
  let scale: number;

  if (textAnalysis.isTextOnly) {
    scale = 2.0 + Math.random() * 2.0;
  } else {
    scale = 1.0 + Math.random() * 1.5;
  }

  const stretchX = 0.85 + Math.random() * 0.3;
  const stretchY = 0.85 + Math.random() * 0.3;
  const rotation = (Math.random() - 0.5) * 0.2;

  if (bodyWidth > 0) {
    const textSize = 256 * scale;
    if (textAnalysis.isTextOnly) {
      if (textSize > bodyWidth * 3.5) {
        scale = (bodyWidth * 3.5) / 256;
      }
    } else {
      if (textSize > bodyWidth * 2.5) {
        scale = (bodyWidth * 2.5) / 256;
      }
    }
  }

  return { position, scale, stretchX, stretchY, rotation };
}

function getNeckZone(img: HTMLImageElement, bounds: { top: number; bottom: number; left: number; right: number; width: number; height: number }): { neckY: number; shoulderCenterX: number } {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return { neckY: bounds.top, shoulderCenterX: bounds.left + bounds.width / 2 };

  c.width = img.width;
  c.height = img.height;
  ctx.drawImage(img, 0, 0);

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, img.width, img.height);
  } catch {
    return { neckY: bounds.top, shoulderCenterX: bounds.left + bounds.width / 2 };
  }

  const d = data.data;
  const rows: { left: number; right: number; width: number }[] = [];

  for (let y = bounds.top; y <= bounds.bottom; y++) {
    let left = bounds.right, right = bounds.left;
    for (let x = bounds.left; x <= bounds.right; x++) {
      if (d[(y * img.width + x) * 4 + 3] > 0) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
    if (right > left) {
      rows.push({ left, right, width: right - left });
    }
  }

  if (rows.length === 0) return { neckY: bounds.top, shoulderCenterX: bounds.left + bounds.width / 2 };

  const maxWidth = Math.max(...rows.map(r => r.width));
  const threshold = maxWidth * 0.35;

  let shoulderIdx = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].width >= threshold) {
      shoulderIdx = i;
      break;
    }
  }

  const shoulderY = bounds.top + shoulderIdx;
  const neckOffset = Math.max(5, Math.round(bounds.height * 0.08));
  const neckY = Math.max(bounds.top, shoulderY - neckOffset);
  const shoulderCenterX = (rows[shoulderIdx].left + rows[shoulderIdx].right) / 2;

  return { neckY, shoulderCenterX };
}

function getVisibleBounds(img: HTMLImageElement): { top: number; bottom: number; left: number; right: number; width: number; height: number } | null {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  c.width = img.width;
  c.height = img.height;
  ctx.drawImage(img, 0, 0);

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, img.width, img.height);
  } catch {
    return null;
  }

  const d = data.data;
  let top = img.height, bottom = 0, left = img.width, right = 0;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (d[(y * img.width + x) * 4 + 3] > 0) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }

  if (bottom <= top || right <= left) return null;

  const visW = right - left;
  const visH = bottom - top;

  if (visW < img.width * 0.08 || visH < img.height * 0.08) {
    return { top: 0, bottom: img.height, left: 0, right: img.width, width: img.width, height: img.height };
  }

  return { top, bottom, left, right, width: visW, height: visH };
}

export function FinalMeme({ background, body, face, text, onReset }: FinalMemeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedRef = useRef(false);
  const textDrawnRef = useRef(false);

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
    if (renderedRef.current) return;
    renderedRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const size = 1024;
    canvas.width = size;
    canvas.height = size;

    // Background
    const bgImg = await loadImage(background || DEFAULT_BACKGROUND);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, size, size);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, size, size);
    }

    // Analyze body and face PNGs for visible content bounds
    const bodyImg = await loadImage(body || DEFAULT_BODY);
    const bodyBounds = bodyImg ? getVisibleBounds(bodyImg) : null;

    const faceImg = await loadImage(face || DEFAULT_FACE);
    const faceBounds = faceImg ? getVisibleBounds(faceImg) : null;

    // === BODY ===
    let bodyScale = 1;
    let bWidth = 0, bHeight = 0, bX = 0, bY = 0;

    if (bodyImg && bodyBounds) {
      bodyScale = (size * 0.6) / bodyBounds.height;
      bWidth = bodyBounds.width * bodyScale;
      bHeight = bodyBounds.height * bodyScale;
      bX = (size - bWidth) / 2;
      bY = size * 0.82 - bHeight;
      ctx.drawImage(bodyImg, bX, bY, bWidth, bHeight);
    } else if (bodyImg) {
      bWidth = size * 0.55;
      bHeight = size * 0.55;
      bX = (size - bWidth) / 2;
      bY = size * 0.28;
      ctx.drawImage(bodyImg, bX, bY, bWidth, bHeight);
    }

    // === FACE ===
    if (faceImg && faceBounds && bodyImg && bodyBounds && bWidth > 0) {
      const neckZone = getNeckZone(bodyImg, bodyBounds);
      const faceRatio = 0.4 + Math.random() * 0.15;
      const faceScale = (bodyBounds.width * bodyScale * faceRatio) / faceBounds.width;
      const fWidth = faceBounds.width * faceScale;
      const fHeight = faceBounds.height * faceScale;

      const bodyNeckY = bY + neckZone.neckY * bodyScale;
      const overlap = 15 + Math.random() * 15;
      const fY = bodyNeckY + overlap - faceBounds.bottom * faceScale;

      const shoulderCenterX = bX + neckZone.shoulderCenterX * bodyScale;
      const fX = shoulderCenterX - fWidth / 2;

      ctx.drawImage(faceImg, fX, fY, fWidth, fHeight);
    } else if (faceImg) {
      const fWidth = size * 0.28;
      const fHeight = size * 0.28;
      const fX = (size - fWidth) / 2;
      const fY = size * 0.08;
      ctx.drawImage(faceImg, fX, fY, fWidth, fHeight);
    }

    // === TEXT ===
    const textImg = await loadImage(text);
    if (textImg && !textDrawnRef.current) {
      const textAnalysis = getTextAnalysis(textImg);
      const { position, scale, stretchX, stretchY, rotation } = getRandomTextParams(bWidth, textAnalysis);
      let tWidth = size * 0.25 * scale * stretchX;
      let tHeight = size * 0.25 * scale * stretchY;
      let tX = 0;
      let tY = 0;

      switch (position) {
        case 'bottom-center':
          tX = (size - tWidth) / 2;
          tY = size - tHeight - 20;
          break;
        case 'bottom-left':
          tX = 20;
          tY = size - tHeight - 20;
          break;
        case 'bottom-right':
          tX = size - tWidth - 20;
          tY = size - tHeight - 20;
          break;
        case 'side-left':
          tX = 15;
          tY = size * 0.55 + (Math.random() - 0.5) * size * 0.2;
          break;
        case 'side-right':
          tX = size - tWidth - 15;
          tY = size * 0.55 + (Math.random() - 0.5) * size * 0.2;
          break;
      }

      // Ensure text fits entirely inside the canvas
      const padX = Math.abs(Math.sin(rotation)) * tHeight / 2 + 5;
      const padY = Math.abs(Math.sin(rotation)) * tWidth / 2 + 5;
      const availW = size - 2 * padX;
      const availH = size - 2 * padY;

      if (tWidth > availW || tHeight > availH) {
        const cx = tX + tWidth / 2;
        const cy = tY + tHeight / 2;
        const fitScale = Math.min(1, availW / tWidth, availH / tHeight);
        tWidth *= fitScale;
        tHeight *= fitScale;
        tX = cx - tWidth / 2;
        tY = cy - tHeight / 2;
      }

      tX = Math.max(padX, Math.min(tX, size - tWidth - padX));
      tY = Math.max(padY, Math.min(tY, size - tHeight - padY));

      ctx.save();
      ctx.translate(tX + tWidth / 2, tY + tHeight / 2);
      ctx.rotate(rotation);
      ctx.translate(-tWidth / 2, -tHeight / 2);
      ctx.drawImage(textImg, 0, 0, tWidth, tHeight);
      ctx.restore();
      textDrawnRef.current = true;
    }
  }, [background, body, face, text, loadImage]);

  useEffect(() => {
    renderMeme();
  }, [renderMeme]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[70vh] rounded-lg shadow-xl"
        style={{ aspectRatio: '1/1' }}
      />
      <style>{`
        @keyframes rainbowShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes sparklePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        .cringe-btn {
          font-family: 'Comic Sans MS', 'Comic Sans', 'Papyrus', cursive;
          background: linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000);
          background-size: 200% 100%;
          animation: rainbowShine 3s linear infinite;
          color: white;
          text-shadow: 0 0 8px rgba(0,0,0,0.5), 2px 2px 0px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.4);
          box-shadow: 0 0 12px rgba(255,0,255,0.4), inset 0 0 20px rgba(255,255,255,0.15);
          transition: transform 0.15s;
        }
        .cringe-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 20px rgba(255,0,255,0.6), inset 0 0 30px rgba(255,255,255,0.2);
        }
      `}</style>
      <button onClick={onReset} className="cringe-btn mt-6 px-5 py-2.5 text-base font-bold rounded-lg">
        <span style={{ animation: 'sparklePulse 1.2s ease-in-out infinite', display: 'inline-block' }}>✨</span>
        {' '}Create Again{' '}
        <span style={{ animation: 'sparklePulse 1.2s ease-in-out infinite 0.4s', display: 'inline-block' }}>✨</span>
      </button>
    </div>
  );
}
