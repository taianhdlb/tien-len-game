import * as THREE from 'three';
import { buildPieceModel, buildBuildingModel } from './models.js';
import { addStudioLights, createShadow, disposeHierarchy, snapshot } from './renderer.js';

export function createPieceScene(classId, hexColor) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 1.25, 3.2);
  camera.lookAt(0, 0.65, 0);
  addStudioLights(scene);

  const beacon = new THREE.PointLight(0xfbbf24, 0, 5);
  beacon.position.set(0, 1.8, 1);
  scene.add(beacon);

  const shadow = createShadow(1.6);
  scene.add(shadow);

  const model = buildPieceModel(classId, hexColor);
  scene.add(model);
  return { scene, camera, model, shadow, beacon };
}

const cache = new Map();

function cached(key, render) {
  if (!cache.has(key)) {
    try {
      cache.set(key, render());
    } catch (err) {
      console.error('3D snapshot failed', err);
      cache.set(key, null);
    }
  }
  return cache.get(key);
}

export function pieceSnapshot(classId, hexColor, px) {
  return cached(`piece:${classId}:${hexColor}:${px}`, () => {
    const { scene, camera, model } = createPieceScene(classId, hexColor);
    model.rotation.y = -0.35;
    const url = snapshot(scene, camera, px, px);
    disposeHierarchy(scene);
    return url;
  });
}

// Board tokens are viewed from a high angle so the figurine's base — the point that must
// line up with a board cell — sits at the centre of the sprite instead of near its bottom edge.
export function boardTokenSnapshot(classId, hexColor, px) {
  return cached(`token:${classId}:${hexColor}:${px}`, () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 3.6, 1.9);
    camera.lookAt(0, 0.45, 0);
    addStudioLights(scene);
    scene.add(createShadow(1.5));
    const model = buildPieceModel(classId, hexColor);
    model.rotation.y = -0.35;
    scene.add(model);
    const url = snapshot(scene, camera, px, px);
    disposeHierarchy(scene);
    return url;
  });
}

export function buildingSnapshot(tier, hexColor, px) {
  return cached(`building:${tier}:${hexColor}:${px}`, () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 1.35, 2.7);
    camera.lookAt(0, 0.45, 0);
    addStudioLights(scene);
    const model = buildBuildingModel(tier, hexColor);
    model.rotation.y = Math.PI * 0.25;
    scene.add(model);
    const url = snapshot(scene, camera, px, px);
    disposeHierarchy(scene);
    return url;
  });
}
