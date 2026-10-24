import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { addTicker, createShadow, disposeHierarchy, pixelRatio, renderInto } from './renderer.js';
import { createD6FaceTexture, createD20FaceTexture, d20Theme, D20_UV } from './textures.js';
import { SoundFX } from './sound.js';

const ROLL_MS = 900;
const SETTLE_MS = 450;
const CAMERA_POS = new THREE.Vector3(0, 0.3, 4.4);
const VIEW = CAMERA_POS.clone().normalize();
const SCREEN_UP = new THREE.Vector3(0, 1, 0).projectOnPlane(VIEW).normalize();

// BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
const D6_FACES = [1, 6, 2, 5, 3, 4];
const D6_ROTATIONS = {
  1: [0, -Math.PI / 2],
  6: [0, Math.PI / 2],
  2: [Math.PI / 2, 0],
  5: [-Math.PI / 2, 0],
  3: [0, 0],
  4: [0, Math.PI]
};
const D6_TILT = [0.28, 0.35];

function d6Target(value) {
  const [x, y] = D6_ROTATIONS[value] ?? D6_ROTATIONS[1];
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(x + D6_TILT[0], y + D6_TILT[1], 0));
}

// Rotation that faces `normal` toward the camera with the face's `up` pointing up on screen.
function faceTarget(normal, up) {
  const align = new THREE.Quaternion().setFromUnitVectors(normal, VIEW);
  const u = up.clone().applyQuaternion(align).projectOnPlane(VIEW).normalize();
  const angle = Math.atan2(new THREE.Vector3().crossVectors(u, SCREEN_UP).dot(VIEW), u.dot(SCREEN_UP));
  return new THREE.Quaternion().setFromAxisAngle(VIEW, angle).multiply(align);
}

function buildD6(theme) {
  const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const mats = D6_FACES.map((n) => new THREE.MeshStandardMaterial({ map: createD6FaceTexture(n, theme), roughness: 0.2, metalness: 0.15 }));
  const mesh = new THREE.Mesh(geo, mats);
  const edgeColor = theme === 'obsidian' ? 0x38bdf8 : theme === 'ruby' ? 0xfde047 : 0xd97706;
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: edgeColor })));
  return { mesh, target: d6Target };
}

function buildD20(theme) {
  const geo = new THREE.IcosahedronGeometry(1.45, 0);
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const targets = [];
  for (let f = 0; f < pos.count / 3; f++) {
    uv.set(D20_UV, f * 6);
    geo.addGroup(f * 3, 3, f);
    const a = new THREE.Vector3().fromBufferAttribute(pos, f * 3);
    const b = new THREE.Vector3().fromBufferAttribute(pos, f * 3 + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, f * 3 + 2);
    const centroid = a.clone().add(b).add(c).divideScalar(3);
    targets.push(faceTarget(centroid.clone().normalize(), c.clone().sub(centroid).normalize()));
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  const mats = targets.map(
    (_, f) => new THREE.MeshStandardMaterial({ map: createD20FaceTexture(f + 1, theme), metalness: 0.35, roughness: 0.28, flatShading: true })
  );
  const mesh = new THREE.Mesh(geo, mats);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: d20Theme(theme).edge }));
  mesh.add(edges);
  return { mesh, target: (value) => targets[Math.min(19, Math.max(0, value - 1))] };
}

/**
 * Plays a tumble whenever `rollKey` changes, then settles on `value`.
 * Every client passes the same rollKey/value from shared state, so everyone sees the same roll.
 */
export function Dice3D({ type = 'D6', value = 1, rollKey = 0, size = 96, theme, animateOnMount = false, onSettled, className = '' }) {
  const canvasRef = useRef(null);
  const valueRef = useRef(value);
  const onSettledRef = useRef(onSettled);
  const rollRef = useRef({ phase: animateOnMount ? 'rolling' : 'idle', start: 0, key: rollKey });

  useEffect(() => {
    valueRef.current = value;
    onSettledRef.current = onSettled;
  }, [value, onSettled]);

  useEffect(() => {
    const roll = rollRef.current;
    if (roll.key === rollKey && roll.phase !== 'rolling') return;
    roll.key = rollKey;
    roll.phase = 'rolling';
    roll.start = performance.now();
    SoundFX.playShake();
  }, [rollKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const px = Math.round(size * pixelRatio());
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext('2d');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.copy(CAMERA_POS);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(type === 'D20' ? 0xa855f7 : 0xf59e0b, 1.5);
    fill.position.set(-4, -2, 3);
    scene.add(fill);

    const shadow = createShadow(2.4, -1.25, 0.75);
    scene.add(shadow);

    const { mesh, target } = type === 'D20' ? buildD20(theme ?? 'amethyst') : buildD6(theme ?? 'ivory');
    scene.add(mesh);
    if (rollRef.current.phase === 'idle') mesh.quaternion.copy(target(valueRef.current));
    else rollRef.current.start = performance.now();

    const spin = new THREE.Vector3(0.21, 0.26, 0.17);
    const tick = (now) => {
      const roll = rollRef.current;
      const elapsed = now - roll.start;

      if (roll.phase === 'rolling') {
        mesh.rotation.x += spin.x;
        mesh.rotation.y += spin.y;
        mesh.rotation.z += spin.z;
        mesh.position.y = Math.abs(Math.sin(elapsed * 0.012)) * 0.45 * (1 - elapsed / ROLL_MS);
        if (elapsed >= ROLL_MS) {
          roll.phase = 'settling';
          roll.settleStart = now;
        }
      } else if (roll.phase === 'settling') {
        const k = Math.min(1, (now - roll.settleStart) / SETTLE_MS);
        mesh.quaternion.slerp(target(valueRef.current), 0.1 + k * 0.5);
        mesh.position.y = Math.sin((1 - k) * Math.PI) * 0.12;
        if (k >= 1) {
          mesh.quaternion.copy(target(valueRef.current));
          roll.phase = 'idle';
          SoundFX.playLand();
          onSettledRef.current?.(valueRef.current);
        }
      } else {
        mesh.quaternion.slerp(target(valueRef.current), 0.2);
        mesh.position.y = Math.sin(now * 0.003) * 0.04;
      }

      shadow.scale.setScalar(1 - mesh.position.y * 0.8);
      renderInto(ctx, scene, camera, px, px);
    };

    tick(performance.now());
    const stop = addTicker(tick);
    return () => {
      stop();
      disposeHierarchy(scene);
    };
  }, [type, size, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`block select-none pointer-events-none drop-shadow-[0_12px_18px_rgba(0,0,0,0.8)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
