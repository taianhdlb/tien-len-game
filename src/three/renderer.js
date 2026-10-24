import * as THREE from 'three';

// One WebGL context for the whole app: every 3D widget renders into a corner of this
// offscreen canvas and copies the pixels into its own 2D canvas or a cached data URL.
let renderer = null;
let capacity = 0;

function getRenderer(minSize) {
  if (!renderer) {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      renderer = null;
      capacity = 0;
    });
    capacity = 0;
  }
  if (minSize > capacity) {
    capacity = Math.max(minSize, 256);
    renderer.setSize(capacity, capacity, false);
  }
  return renderer;
}

export const pixelRatio = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);

// Renders the scene and blits the result onto `ctx` (a 2D context whose canvas is w*h device pixels).
export function renderInto(ctx, scene, camera, w, h) {
  const r = getRenderer(Math.max(w, h));
  r.setScissorTest(true);
  r.setViewport(0, 0, w, h);
  r.setScissor(0, 0, w, h);
  r.render(scene, camera);
  r.setScissorTest(false);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(r.domElement, 0, capacity - h, w, h, 0, 0, w, h);
}

export function snapshot(scene, camera, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderInto(canvas.getContext('2d'), scene, camera, w, h);
  return canvas.toDataURL('image/png');
}

// Single rAF loop shared by every animated widget; stops itself when nothing is registered.
const tickers = new Set();
let frame = 0;

function loop(now) {
  frame = 0;
  for (const tick of tickers) tick(now);
  if (tickers.size) frame = requestAnimationFrame(loop);
}

export function addTicker(tick) {
  tickers.add(tick);
  if (!frame) frame = requestAnimationFrame(loop);
  return () => {
    tickers.delete(tick);
    if (!tickers.size && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

let shadowTexture = null;
export function getShadowTexture() {
  if (!shadowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    shadowTexture = new THREE.CanvasTexture(canvas);
    shadowTexture.userData.shared = true;
  }
  return shadowTexture;
}

export function createShadow(size, y = 0.01, opacity = 0.65) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: getShadowTexture(), transparent: true, opacity, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

export function addStudioLights(scene, accent = 0x93c5fd) {
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(accent, 1.2);
  rim.position.set(-3, 3, -3);
  scene.add(rim);
}

export function disposeHierarchy(obj) {
  obj?.traverse((node) => {
    node.geometry?.dispose();
    const mats = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    for (const mat of mats) {
      if (mat.map && !mat.map.userData.shared) mat.map.dispose();
      mat.dispose();
    }
  });
}
