import { useEffect, useRef } from 'react';
import { addTicker, disposeHierarchy, pixelRatio, renderInto } from './renderer.js';
import { createPieceScene, pieceSnapshot, buildingSnapshot } from './scenes.js';

const ICON_FALLBACK = ['🚩', '⛺', '🏰', '🏯'];

export function Piece3D({ classId = 'fighter', hexColor = 0xb91c1c, size = 48, active = false, animated = true, interactive = false, onClick, className = '' }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  const hoverRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const px = Math.round(size * pixelRatio());
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext('2d');
    const { scene, camera, model, shadow, beacon } = createPieceScene(classId, hexColor);
    const spinners = ['spinning_ring', 'energy_ring_1', 'energy_ring_2'].map((n) => model.getObjectByName(n));

    const start = performance.now();
    let drawn = false;
    const tick = (now) => {
      const lively = activeRef.current || hoverRef.current;
      if (drawn && !animated && !lively) return;
      const t = (now - start) / 1000;

      if (spinners[0]) spinners[0].rotation.z += 0.04;
      if (spinners[1]) spinners[1].rotation.z += 0.05;
      if (spinners[2]) spinners[2].rotation.x += 0.03;

      if (lively) {
        model.rotation.y += hoverRef.current ? 0.04 : 0.02;
        model.position.y = Math.abs(Math.sin(t * 4)) * 0.14;
        beacon.intensity = 1.5 + Math.sin(t * 6);
      } else {
        model.rotation.y += animated ? 0.008 : 0;
        model.position.y = animated ? Math.sin(t * 2) * 0.04 : 0;
        beacon.intensity = 0;
      }
      shadow.scale.setScalar(1 - model.position.y * 1.5);
      renderInto(ctx, scene, camera, px, px);
      drawn = true;
    };

    tick(start);
    const stop = addTicker(tick);
    return () => {
      stop();
      disposeHierarchy(scene);
    };
  }, [classId, hexColor, size, animated]);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      onPointerEnter={interactive ? () => (hoverRef.current = true) : undefined}
      onPointerLeave={interactive ? () => (hoverRef.current = false) : undefined}
      className={`block select-none ${interactive ? 'cursor-pointer' : 'pointer-events-none'} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Static, cached render of a piece: no per-instance WebGL work after the first draw.
export function PieceImage({ classId = 'fighter', hexColor = 0xb91c1c, size = 48, className = '', alt = '' }) {
  const url = pieceSnapshot(classId, hexColor, Math.round(size * pixelRatio()));
  if (!url) return <span className={className} style={{ width: size, height: size }} />;
  return (
    <img
      src={url}
      alt={alt}
      draggable={false}
      className={`block select-none pointer-events-none object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function BuildingImage({ tier = 0, hexColor = 0xb91c1c, size = 32, className = '' }) {
  const url = buildingSnapshot(tier, hexColor, Math.round(size * pixelRatio()));
  if (!url) {
    return (
      <span className={className} style={{ fontSize: size * 0.7 }}>
        {ICON_FALLBACK[tier]}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      draggable={false}
      className={`block select-none pointer-events-none object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.8)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
