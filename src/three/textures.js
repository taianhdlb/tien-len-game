import * as THREE from 'three';

// Procedural canvas textures for D6 dice faces (photorealistic indented pips)
export function createD6FaceTexture(number, theme = 'ivory') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background base
  let bgGradient;
  if (theme === 'obsidian') {
    bgGradient = ctx.createRadialGradient(128, 128, 30, 128, 128, 180);
    bgGradient.addColorStop(0, '#1e293b');
    bgGradient.addColorStop(1, '#090d16');
  } else if (theme === 'ruby') {
    bgGradient = ctx.createRadialGradient(128, 128, 30, 128, 128, 180);
    bgGradient.addColorStop(0, '#991b1b');
    bgGradient.addColorStop(1, '#450a0a');
  } else if (theme === 'gold') {
    bgGradient = ctx.createRadialGradient(128, 128, 30, 128, 128, 180);
    bgGradient.addColorStop(0, '#fef08a');
    bgGradient.addColorStop(1, '#b45309');
  } else {
    // Ivory / Pearl default
    bgGradient = ctx.createRadialGradient(128, 128, 40, 128, 128, 180);
    bgGradient.addColorStop(0, '#fcfaf2');
    bgGradient.addColorStop(0.85, '#f5efe0');
    bgGradient.addColorStop(1, '#ded3be');
  }
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 256, 256);

  // Rounded outer border vignette
  ctx.strokeStyle = theme === 'obsidian' ? 'rgba(56, 189, 248, 0.25)' : theme === 'ruby' ? 'rgba(254, 240, 138, 0.4)' : 'rgba(180, 83, 9, 0.25)';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 240);

  // Draw indented engraved pips
  const drawPip = (x, y, radius = 22, isCenterSpecial = false) => {
    ctx.save();
    // Outer bevel / shadow
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = theme === 'obsidian' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.25)';
    ctx.fill();

    // Inner cavity depression gradient
    const pipGrad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
    if (isCenterSpecial && theme !== 'obsidian') {
      // Classic royal Asian / luxury casino crimson ruby center for face 1
      pipGrad.addColorStop(0, '#ff1744');
      pipGrad.addColorStop(0.7, '#b71c1c');
      pipGrad.addColorStop(1, '#5f0911');
    } else if (theme === 'obsidian') {
      pipGrad.addColorStop(0, '#38bdf8');
      pipGrad.addColorStop(0.7, '#0284c7');
      pipGrad.addColorStop(1, '#082f49');
    } else if (theme === 'gold') {
      pipGrad.addColorStop(0, '#78350f');
      pipGrad.addColorStop(0.8, '#451a03');
      pipGrad.addColorStop(1, '#1c1917');
    } else {
      // Onyx black pip
      pipGrad.addColorStop(0, '#334155');
      pipGrad.addColorStop(0.7, '#0f172a');
      pipGrad.addColorStop(1, '#020617');
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = pipGrad;
    ctx.fill();

    // Specular light glint on bottom-right edge for 3D indentation illusion
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, radius - 2, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.strokeStyle = theme === 'obsidian' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  };

  const c = 128;
  const l = 68;
  const r = 188;
  const t = 68;
  const b = 188;
  const m = 128;

  switch (number) {
    case 1:
      drawPip(c, c, 34, true);
      break;
    case 2:
      drawPip(l, t);
      drawPip(r, b);
      break;
    case 3:
      drawPip(l, t);
      drawPip(c, c);
      drawPip(r, b);
      break;
    case 4:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(l, b);
      drawPip(r, b);
      break;
    case 5:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(c, c);
      drawPip(l, b);
      drawPip(r, b);
      break;
    case 6:
      drawPip(l, t);
      drawPip(l, m);
      drawPip(l, b);
      drawPip(r, t);
      drawPip(r, m);
      drawPip(r, b);
      break;
    default:
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

const D20_THEMES = {
  amethyst: { from: '#a855f7', to: '#3b0764', text: '#fde68a', edge: '#fde047' },
  ruby: { from: '#ef4444', to: '#450a0a', text: '#fef3c7', edge: '#fde047' },
  emerald: { from: '#34d399', to: '#022c22', text: '#fef9c3', edge: '#fde047' }
};

export const d20Theme = (theme) => D20_THEMES[theme] || D20_THEMES.amethyst;

// UV triangle used for every D20 face: base along v=0, apex at the top.
export const D20_UV = [0, 0, 1, 0, 0.5, 0.866];

export function createD20FaceTexture(number, theme = 'amethyst') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const colors = d20Theme(theme);

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, colors.from);
  grad.addColorStop(1, colors.to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size * (1 - 0.866 / 3);
  const isCrit = number === 20 || number === 1;
  ctx.font = `900 ${number >= 10 ? 34 : 40}px "Alegreya SC", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(String(number), cx, cy);
  ctx.fillStyle = isCrit ? (number === 20 ? '#fde047' : '#fca5a5') : colors.text;
  ctx.fillText(String(number), cx, cy);
  if (number === 6 || number === 9) {
    ctx.fillRect(cx - 9, cy + 20, 18, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
