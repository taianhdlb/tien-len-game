import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// ============================================================================
// 1. PROCEDURAL TEXTURES & AUDIO SYNTHESIZER (ZERO EXTERNAL ASSETS)
// ============================================================================

// Procedural canvas textures for D6 dice faces (photorealistic indented pips)
function createD6FaceTexture(number, theme = 'ivory') {
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
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// Procedural contact drop-shadow texture
function createShadowTexture() {
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
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Procedural audio synthesizer using Web Audio API (satisfying dice clatter)
class SoundFX {
  static ctx = null;
  static init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  static playShake() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 60, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio autoplay policy catch
    }
  }

  static playLand() {
    try {
      this.init();
      if (!this.ctx) return;
      // Impact thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);

      // Clatter click
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(600, this.ctx.currentTime);
      click.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);
      clickGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      click.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      click.start();
      click.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio autoplay policy catch
    }
  }
}

// Deep cleanup helper for Three.js
function disposeHierarchy(obj) {
  if (!obj) return;
  obj.traverse((node) => {
    if (node.geometry) {
      node.geometry.dispose();
    }
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach((mat) => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      } else {
        if (node.material.map) node.material.map.dispose();
        node.material.dispose();
      }
    }
  });
}

// ============================================================================
// 2. PROCEDURAL 3D PIECES GENERATOR (D&D CLASSES, CHESS & MONOPOLY TOKENS)
// ============================================================================

// Standard luxury pedestal base for miniatures
function createPedestal(colorHex) {
  const group = new THREE.Group();

  // 1. Lower stepped dark granite base
  const bGeo = new THREE.CylinderGeometry(0.72, 0.82, 0.14, 28);
  const bMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.35,
    roughness: 0.65
  });
  const bMesh = new THREE.Mesh(bGeo, bMat);
  bMesh.position.y = 0.07;
  group.add(bMesh);

  // 2. Polished gold filigree trim ring
  const rGeo = new THREE.TorusGeometry(0.75, 0.045, 12, 28);
  const rMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.18
  });
  const rMesh = new THREE.Mesh(rGeo, rMat);
  rMesh.rotation.x = Math.PI / 2;
  rMesh.position.y = 0.14;
  group.add(rMesh);

  // 3. Player colored upper platform
  const tGeo = new THREE.CylinderGeometry(0.64, 0.72, 0.12, 28);
  const tMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.25
  });
  const tMesh = new THREE.Mesh(tGeo, tMat);
  tMesh.position.y = 0.21;
  group.add(tMesh);

  return group;
}

// Build specific 3D figurines mounted on top of the pedestal
export function buildPieceModel(pieceType = 'fighter', colorHex = 0xb91c1c) {
  const root = new THREE.Group();
  const pedestal = createPedestal(colorHex);
  root.add(pedestal);

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.88, roughness: 0.2 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.15 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const playerMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.5, roughness: 0.3 });

  const type = (pieceType || 'pawn').toLowerCase();

  switch (type) {
    // ------------------------------------------------------------------------
    // A. 10 D&D CLASSES
    // ------------------------------------------------------------------------
    case 'fighter':
    case 'warrior': {
      // Crusader Greathelm & crossed steel broadswords
      const fig = new THREE.Group();
      // Helmet body
      const helmGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.5, 24);
      const helmMesh = new THREE.Mesh(helmGeo, steelMat);
      helmMesh.position.y = 0.56;
      fig.add(helmMesh);

      // Dome
      const domeGeo = new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMesh = new THREE.Mesh(domeGeo, steelMat);
      domeMesh.position.y = 0.81;
      fig.add(domeMesh);

      // Visor slit
      const visorGeo = new THREE.BoxGeometry(0.48, 0.07, 0.1);
      const visorMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
      const visorMesh = new THREE.Mesh(visorGeo, visorMat);
      visorMesh.position.set(0, 0.58, 0.3);
      fig.add(visorMesh);

      // Gold cross visor trim
      const crossVGeo = new THREE.BoxGeometry(0.08, 0.32, 0.08);
      const crossVMesh = new THREE.Mesh(crossVGeo, goldMat);
      crossVMesh.position.set(0, 0.58, 0.31);
      fig.add(crossVMesh);

      // Crimson crest plume
      const plumeGeo = new THREE.TorusGeometry(0.3, 0.07, 12, 24, Math.PI * 0.9);
      const plumeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
      const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
      plumeMesh.rotation.y = Math.PI / 2;
      plumeMesh.rotation.z = -Math.PI * 0.45;
      plumeMesh.position.set(0, 0.92, -0.05);
      fig.add(plumeMesh);

      // Crossed swords behind
      const createSword = (angle) => {
        const sw = new THREE.Group();
        const bladeGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.1, 8);
        const bladeMesh = new THREE.Mesh(bladeGeo, steelMat);
        bladeMesh.position.y = 0.55;
        sw.add(bladeMesh);
        const guardGeo = new THREE.BoxGeometry(0.35, 0.05, 0.06);
        const guardMesh = new THREE.Mesh(guardGeo, goldMat);
        guardMesh.position.y = 0.12;
        sw.add(guardMesh);
        const pommelGeo = new THREE.SphereGeometry(0.05, 12, 12);
        const pommelMesh = new THREE.Mesh(pommelGeo, goldMat);
        pommelMesh.position.y = 0.02;
        sw.add(pommelMesh);
        sw.rotation.z = angle;
        sw.position.set(0, 0.3, -0.22);
        return sw;
      };
      fig.add(createSword(Math.PI * 0.18));
      fig.add(createSword(-Math.PI * 0.18));
      root.add(fig);
      break;
    }

    case 'rogue': {
      // Shadow cowl hood with glowing emerald daggers
      const fig = new THREE.Group();
      // Hood
      const hoodGeo = new THREE.ConeGeometry(0.38, 0.75, 20);
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.65 });
      const hoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
      hoodMesh.position.set(0, 0.65, -0.05);
      hoodMesh.rotation.x = -0.15;
      fig.add(hoodMesh);

      // Dark face opening with glowing eyes
      const faceGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const faceMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.set(0, 0.52, 0.08);
      fig.add(faceMesh);

      const eyeGeo = new THREE.BoxGeometry(0.05, 0.02, 0.02);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 2 });
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.08, 0.54, 0.28);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.08, 0.54, 0.28);
      fig.add(eyeL);
      fig.add(eyeR);

      // Twin poisoned curved daggers
      const createDagger = (x, rotZ) => {
        const dg = new THREE.Group();
        const dBladeGeo = new THREE.ConeGeometry(0.06, 0.6, 6);
        const dBladeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 });
        const dBladeMesh = new THREE.Mesh(dBladeGeo, dBladeMat);
        dBladeMesh.position.y = 0.3;
        dg.add(dBladeMesh);
        const gemGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const gemMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.5 });
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.y = 0.6;
        dg.add(gem);
        dg.position.set(x, 0.35, 0.22);
        dg.rotation.z = rotZ;
        dg.rotation.x = 0.25;
        return dg;
      };
      fig.add(createDagger(-0.25, -0.3));
      fig.add(createDagger(0.25, 0.3));
      root.add(fig);
      break;
    }

    case 'wizard': {
      // Archmage hat, crystal orb with orbiting gyroscopic rings & arcane staff
      const fig = new THREE.Group();
      // Hat brim
      const brimGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.04, 28);
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
      const brimMesh = new THREE.Mesh(brimGeo, hatMat);
      brimMesh.position.y = 0.5;
      brimMesh.rotation.x = -0.1;
      fig.add(brimMesh);

      // Conical crown
      const coneGeo = new THREE.ConeGeometry(0.36, 0.75, 24);
      const coneMesh = new THREE.Mesh(coneGeo, hatMat);
      coneMesh.position.set(0, 0.84, -0.06);
      coneMesh.rotation.x = -0.25;
      fig.add(coneMesh);

      // Gold hat band
      const bandGeo = new THREE.TorusGeometry(0.36, 0.04, 12, 28);
      const bandMesh = new THREE.Mesh(bandGeo, goldMat);
      bandMesh.position.set(0, 0.53, -0.02);
      bandMesh.rotation.x = Math.PI / 2 - 0.1;
      fig.add(bandMesh);

      // Floating Mana Orb
      const orbGeo = new THREE.SphereGeometry(0.18, 24, 24);
      const orbMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.6,
        roughness: 0.1
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(0, 0.38, 0.38);
      fig.add(orb);

      // Orbiting arcane ring
      const orbRingGeo = new THREE.TorusGeometry(0.26, 0.02, 8, 24);
      const orbRing = new THREE.Mesh(orbRingGeo, goldMat);
      orbRing.position.copy(orb.position);
      orbRing.rotation.x = Math.PI * 0.35;
      orbRing.name = 'spinning_ring';
      fig.add(orbRing);
      root.add(fig);
      break;
    }

    case 'cleric': {
      // Holy chalice with divine light & radiant sun disc
      const fig = new THREE.Group();
      // Chalice base & stem
      const chBaseGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.1, 20);
      const chBase = new THREE.Mesh(chBaseGeo, goldMat);
      chBase.position.y = 0.32;
      fig.add(chBase);

      const chStemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.32, 16);
      const chStem = new THREE.Mesh(chStemGeo, goldMat);
      chStem.position.y = 0.52;
      fig.add(chStem);

      // Chalice cup
      const chCupGeo = new THREE.CylinderGeometry(0.32, 0.15, 0.38, 24);
      const chCup = new THREE.Mesh(chCupGeo, goldMat);
      chCup.position.y = 0.82;
      fig.add(chCup);

      // Glowing divine liquid
      const liqGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.04, 20);
      const liqMat = new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.8,
        roughness: 0.1
      });
      const liq = new THREE.Mesh(liqGeo, liqMat);
      liq.position.y = 0.98;
      fig.add(liq);

      // Solar cross sunburst rays behind
      const sunGeo = new THREE.RingGeometry(0.28, 0.48, 8);
      const sunMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.6,
        side: THREE.DoubleSide
      });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      sun.position.set(0, 0.8, -0.22);
      fig.add(sun);
      root.add(fig);
      break;
    }

    case 'paladin': {
      // Massive kite shield with embossed cross & broadsword
      const fig = new THREE.Group();
      // Curved tower shield body
      const shGeo = new THREE.BoxGeometry(0.58, 0.88, 0.12);
      const shMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.25 });
      const sh = new THREE.Mesh(shGeo, shMat);
      sh.position.set(0, 0.72, 0.15);
      sh.rotation.x = -0.05;
      fig.add(sh);

      // Gold shield rim
      const rimGeo = new THREE.BoxGeometry(0.62, 0.92, 0.08);
      const rim = new THREE.Mesh(rimGeo, goldMat);
      rim.position.set(0, 0.72, 0.12);
      fig.add(rim);

      // Golden crusader cross on shield
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.04), goldMat);
      crossV.position.set(0, 0.72, 0.22);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.04), goldMat);
      crossH.position.set(0, 0.82, 0.22);
      fig.add(crossV);
      fig.add(crossH);

      // Holy broadsword plunged behind shield
      const swBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.1, 8), steelMat);
      swBlade.position.set(0, 0.85, -0.15);
      const swGuard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.06), goldMat);
      swGuard.position.set(0, 1.25, -0.15);
      const swHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), darkSteelMat);
      swHilt.position.set(0, 1.4, -0.15);
      fig.add(swBlade);
      fig.add(swGuard);
      fig.add(swHilt);
      root.add(fig);
      break;
    }

    case 'barbarian': {
      // Double-headed berserker battleaxe & beast horns
      const fig = new THREE.Group();
      // Axe shaft
      const shaftGeo = new THREE.CylinderGeometry(0.05, 0.06, 1.25, 12);
      const shaftMat = new THREE.MeshStandardMaterial({ color: 0x573418, roughness: 0.8 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 0.85;
      fig.add(shaft);

      // Dual crescent battle blades
      const createBlade = (dir) => {
        const bGroup = new THREE.Group();
        const bladeGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16, 1, false, 0, Math.PI * 0.7);
        const blade = new THREE.Mesh(bladeGeo, steelMat);
        blade.rotation.z = Math.PI / 2;
        blade.rotation.y = dir > 0 ? 0 : Math.PI;
        blade.position.x = dir * 0.26;
        bGroup.add(blade);
        return bGroup;
      };
      const blades = new THREE.Group();
      blades.position.y = 1.15;
      blades.add(createBlade(1));
      blades.add(createBlade(-1));
      fig.add(blades);

      // Gold center boss
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), goldMat);
      boss.position.set(0, 1.15, 0);
      fig.add(boss);

      // Horned crest at base
      const createHorn = (dir) => {
        const hornGeo = new THREE.ConeGeometry(0.09, 0.55, 12);
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 });
        const horn = new THREE.Mesh(hornGeo, hornMat);
        horn.position.set(dir * 0.38, 0.45, 0);
        horn.rotation.z = dir * -0.55;
        return horn;
      };
      fig.add(createHorn(1));
      fig.add(createHorn(-1));
      root.add(fig);
      break;
    }

    case 'ranger': {
      // Recurve longbow, quiver of fletched arrows & forest leaf emblem
      const fig = new THREE.Group();
      // Bow arc
      const bowGeo = new THREE.TorusGeometry(0.55, 0.04, 8, 24, Math.PI * 0.95);
      const bowMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
      const bow = new THREE.Mesh(bowGeo, bowMat);
      bow.position.set(-0.12, 0.8, 0.1);
      bow.rotation.z = -Math.PI * 0.45;
      fig.add(bow);

      // Bowstring
      const strGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.05, 6);
      const strMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.5 });
      const bowStr = new THREE.Mesh(strGeo, strMat);
      bowStr.position.set(-0.35, 0.8, 0.1);
      fig.add(bowStr);

      // Quiver tilted
      const qGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.75, 16);
      const qMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.7 });
      const quiver = new THREE.Mesh(qGeo, qMat);
      quiver.position.set(0.2, 0.65, -0.05);
      quiver.rotation.z = -0.3;
      fig.add(quiver);

      // Fletched arrows
      for (let i = -1; i <= 1; i++) {
        const arr = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), steelMat);
        arr.position.set(0.18 + i * 0.07, 0.9 + Math.abs(i) * 0.05, -0.05);
        arr.rotation.z = -0.3 + i * 0.08;
        const fletch = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 6), goldMat);
        fletch.position.set(0.18 + i * 0.07, 1.25, -0.05);
        fletch.rotation.z = -0.3 + i * 0.08;
        fig.add(arr);
        fig.add(fletch);
      }
      root.add(fig);
      break;
    }

    case 'druid': {
      // Sacred tree totem, branching antlers & emerald life essence orbs
      const fig = new THREE.Group();
      // Trunk pillar
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.65, 16);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.55;
      fig.add(trunk);

      // Antlers
      const createAntler = (dir) => {
        const ant = new THREE.Group();
        const main = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.7, 8), goldMat);
        main.position.set(dir * 0.25, 1.05, 0);
        main.rotation.z = dir * -0.4;
        ant.add(main);
        const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 8), goldMat);
        prong.position.set(dir * 0.35, 1.2, 0.08);
        prong.rotation.z = dir * -0.8;
        ant.add(prong);
        return ant;
      };
      fig.add(createAntler(1));
      fig.add(createAntler(-1));

      // Emerald Life Orbs
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x15803d,
        emissiveIntensity: 1.5,
        roughness: 0.1
      });
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), gemMat);
        orb.position.set(Math.cos(ang) * 0.38, 0.75 + i * 0.12, Math.sin(ang) * 0.38);
        fig.add(orb);
      }
      root.add(fig);
      break;
    }

    case 'warlock': {
      // Eldritch Oculus Eye hovering over open Grimoire
      const fig = new THREE.Group();
      // Open Book Grimoire base
      const bookMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.6 });
      const pageMat = new THREE.MeshStandardMaterial({ color: 0xfae8ff, emissive: 0xc084fc, emissiveIntensity: 0.3 });
      const bookL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.45), bookMat);
      bookL.position.set(-0.16, 0.32, 0);
      bookL.rotation.z = 0.15;
      const bookR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.45), bookMat);
      bookR.position.set(0.16, 0.32, 0);
      bookR.rotation.z = -0.15;
      fig.add(bookL);
      fig.add(bookR);

      // Floating Oculus Eye
      const eyeSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15 })
      );
      eyeSphere.position.set(0, 0.82, 0);
      fig.add(eyeSphere);

      // Pupil / Iris
      const pupil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0xa855f7, emissiveIntensity: 2 })
      );
      pupil.rotation.x = Math.PI / 2;
      pupil.position.set(0, 0.82, 0.27);
      fig.add(pupil);

      // Occult Horns
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.7 });
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 12), hornMat);
      hornL.position.set(-0.32, 0.95, 0);
      hornL.rotation.z = 0.5;
      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 12), hornMat);
      hornR.position.set(0.32, 0.95, 0);
      hornR.rotation.z = -0.5;
      fig.add(hornL);
      fig.add(hornR);
      root.add(fig);
      break;
    }

    case 'sorcerer': {
      // Draconic Crystal Spire with crackling lightning rings
      const fig = new THREE.Group();
      // Main central floating crystal obelisk
      const crystGeo = new THREE.OctahedronGeometry(0.32, 0);
      crystGeo.scale(1, 2.2, 1);
      const crystMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 1.4,
        roughness: 0.1,
        metalness: 0.3
      });
      const cryst = new THREE.Mesh(crystGeo, crystMat);
      cryst.position.set(0, 0.85, 0);
      fig.add(cryst);

      // 4 floating miniature shards
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const shardGeo = new THREE.OctahedronGeometry(0.1, 0);
        shardGeo.scale(1, 1.8, 1);
        const shard = new THREE.Mesh(shardGeo, crystMat);
        shard.position.set(Math.cos(ang) * 0.45, 0.65 + (i % 2) * 0.2, Math.sin(ang) * 0.45);
        fig.add(shard);
      }

      // Energy rings
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 24), goldMat);
      ring1.position.set(0, 0.85, 0);
      ring1.rotation.x = Math.PI * 0.35;
      ring1.name = 'energy_ring_1';
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.025, 8, 24), goldMat);
      ring2.position.set(0, 0.85, 0);
      ring2.rotation.y = Math.PI * 0.35;
      ring2.name = 'energy_ring_2';
      fig.add(ring1);
      fig.add(ring2);
      root.add(fig);
      break;
    }

    // ------------------------------------------------------------------------
    // B. CLASSIC CHESS PIECES
    // ------------------------------------------------------------------------
    case 'knight': {
      // Horse head chess piece
      const fig = new THREE.Group();
      // Neck base
      const neckGeo = new THREE.CylinderGeometry(0.32, 0.44, 0.5, 20);
      const neck = new THREE.Mesh(neckGeo, playerMat);
      neck.position.y = 0.5;
      fig.add(neck);

      // Head / Muzzle
      const headGeo = new THREE.BoxGeometry(0.34, 0.42, 0.6);
      const head = new THREE.Mesh(headGeo, playerMat);
      head.position.set(0, 0.82, 0.12);
      head.rotation.x = 0.35;
      fig.add(head);

      // Ears
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), playerMat);
      earL.position.set(-0.12, 1.12, -0.05);
      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), playerMat);
      earR.position.set(0.12, 1.12, -0.05);
      fig.add(earL);
      fig.add(earR);

      // Mane
      const maneGeo = new THREE.BoxGeometry(0.1, 0.55, 0.25);
      const mane = new THREE.Mesh(maneGeo, goldMat);
      mane.position.set(0, 0.78, -0.22);
      fig.add(mane);
      root.add(fig);
      break;
    }

    case 'rook': {
      // Castle tower with crenellations
      const fig = new THREE.Group();
      // Tower pillar
      const towerGeo = new THREE.CylinderGeometry(0.36, 0.46, 0.75, 24);
      const tower = new THREE.Mesh(towerGeo, playerMat);
      tower.position.y = 0.65;
      fig.add(tower);

      // Parapet ring
      const parapet = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.15, 24), goldMat);
      parapet.position.y = 1.05;
      fig.add(parapet);

      // 4 crenellation battlements
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const cren = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.18, 0.15), playerMat);
        cren.position.set(Math.cos(ang) * 0.36, 1.18, Math.sin(ang) * 0.36);
        fig.add(cren);
      }
      root.add(fig);
      break;
    }

    case 'bishop': {
      // Mitre-topped slender bishop
      const fig = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.22, 0.42, 0.8, 20);
      const body = new THREE.Mesh(bodyGeo, playerMat);
      body.position.y = 0.68;
      fig.add(body);

      // Collar
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 10, 20), goldMat);
      collar.position.y = 1.1;
      collar.rotation.x = Math.PI / 2;
      fig.add(collar);

      // Mitre head
      const mitreGeo = new THREE.SphereGeometry(0.24, 20, 20);
      mitreGeo.scale(1, 1.5, 1);
      const mitre = new THREE.Mesh(mitreGeo, playerMat);
      mitre.position.y = 1.35;
      fig.add(mitre);

      // Gold top pip
      const topPip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), goldMat);
      topPip.position.y = 1.72;
      fig.add(topPip);
      root.add(fig);
      break;
    }

    case 'queen': {
      // Crowned Queen
      const fig = new THREE.Group();
      const gownGeo = new THREE.CylinderGeometry(0.24, 0.44, 0.85, 24);
      const gown = new THREE.Mesh(gownGeo, playerMat);
      gown.position.y = 0.7;
      fig.add(gown);

      // Waist ring
      const waist = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 10, 24), goldMat);
      waist.position.y = 1.14;
      waist.rotation.x = Math.PI / 2;
      fig.add(waist);

      // Crown bowl
      const crownBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.24, 0.28, 24), goldMat);
      crownBowl.position.y = 1.32;
      fig.add(crownBowl);

      // Crown spikes & ruby finial
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), goldMat);
        spike.position.set(Math.cos(ang) * 0.35, 1.52, Math.sin(ang) * 0.35);
        fig.add(spike);
      }
      const ruby = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.2 })
      );
      ruby.position.y = 1.48;
      fig.add(ruby);
      root.add(fig);
      break;
    }

    case 'king': {
      // King with Latin Cross crown
      const fig = new THREE.Group();
      const gown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.48, 0.9, 24), playerMat);
      gown.position.y = 0.72;
      fig.add(gown);

      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 10, 24), goldMat);
      collar.position.y = 1.18;
      collar.rotation.x = Math.PI / 2;
      fig.add(collar);

      // Crown
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.35, 24), goldMat);
      crown.position.y = 1.4;
      fig.add(crown);

      // Holy Cross on top
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.06), goldMat);
      crossV.position.y = 1.75;
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.06), goldMat);
      crossH.position.y = 1.82;
      fig.add(crossV);
      fig.add(crossH);
      root.add(fig);
      break;
    }

    // ------------------------------------------------------------------------
    // C. CLASSIC MONOPOLY TOKENS
    // ------------------------------------------------------------------------
    case 'tophat': {
      // Victorian Gentleman's Top Hat
      const fig = new THREE.Group();
      // Brim
      const brimGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.04, 28);
      const brim = new THREE.Mesh(brimGeo, darkSteelMat);
      brim.position.y = 0.32;
      fig.add(brim);

      // Crown
      const crownGeo = new THREE.CylinderGeometry(0.44, 0.38, 0.65, 28);
      const crown = new THREE.Mesh(crownGeo, darkSteelMat);
      crown.position.y = 0.65;
      fig.add(crown);

      // Silk red ribbon band
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.39, 0.1, 28),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 })
      );
      band.position.y = 0.38;
      fig.add(band);
      root.add(fig);
      break;
    }

    case 'car': {
      // Vintage race car
      const fig = new THREE.Group();
      // Car chassis
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.95), playerMat);
      body.position.y = 0.42;
      fig.add(body);

      // Cockpit hood
      const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.4, 16), darkSteelMat);
      hood.rotation.x = Math.PI / 2;
      hood.position.set(0, 0.54, 0.05);
      fig.add(hood);

      // 4 wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
      const createWheel = (x, z) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.34, z);
        return w;
      };
      fig.add(createWheel(-0.28, -0.3));
      fig.add(createWheel(0.28, -0.3));
      fig.add(createWheel(-0.28, 0.3));
      fig.add(createWheel(0.28, 0.3));
      root.add(fig);
      break;
    }

    case 'battleship': {
      // Naval Dreadnought cruiser
      const fig = new THREE.Group();
      // Hull
      const hullGeo = new THREE.BoxGeometry(0.38, 0.22, 1.05);
      const hull = new THREE.Mesh(hullGeo, steelMat);
      hull.position.y = 0.38;
      fig.add(hull);

      // Bridge superstructure
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.45), darkSteelMat);
      bridge.position.set(0, 0.55, -0.05);
      fig.add(bridge);

      // Smokestack
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.28, 12), goldMat);
      stack.position.set(0, 0.75, -0.12);
      fig.add(stack);

      // Gun turrets
      const createTurret = (z) => {
        const tGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), steelMat);
        base.position.y = 0.52;
        tGroup.add(base);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), darkSteelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.54, 0.16);
        tGroup.add(barrel);
        tGroup.position.z = z;
        return tGroup;
      };
      fig.add(createTurret(0.32));
      fig.add(createTurret(-0.35));
      root.add(fig);
      break;
    }

    case 'thimble': {
      // Classic ridged sewing thimble
      const fig = new THREE.Group();
      const cupGeo = new THREE.CylinderGeometry(0.34, 0.42, 0.65, 24);
      const cup = new THREE.Mesh(cupGeo, steelMat);
      cup.position.y = 0.6;
      fig.add(cup);

      const domeGeo = new THREE.SphereGeometry(0.34, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, steelMat);
      dome.position.y = 0.92;
      fig.add(dome);

      // Rim ring
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.04, 10, 24), goldMat);
      rim.position.y = 0.32;
      rim.rotation.x = Math.PI / 2;
      fig.add(rim);
      root.add(fig);
      break;
    }

    // ------------------------------------------------------------------------
    // D. DEFAULT: LUXURY TURN-TURNED CHESS PAWN
    // ------------------------------------------------------------------------
    case 'pawn':
    default: {
      const fig = new THREE.Group();
      // Concave waist body
      const points = [];
      points.push(new THREE.Vector2(0.42, 0.28));
      points.push(new THREE.Vector2(0.38, 0.38));
      points.push(new THREE.Vector2(0.24, 0.55));
      points.push(new THREE.Vector2(0.18, 0.85));
      points.push(new THREE.Vector2(0.25, 0.95));
      points.push(new THREE.Vector2(0.12, 1.02));
      const latheGeo = new THREE.LatheGeometry(points, 28);
      const body = new THREE.Mesh(latheGeo, playerMat);
      fig.add(body);

      // Gold collar
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 10, 28), goldMat);
      collar.position.y = 1.0;
      collar.rotation.x = Math.PI / 2;
      fig.add(collar);

      // Polished spherical head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 28, 24), playerMat);
      head.position.y = 1.25;
      fig.add(head);

      // Crown golden pip
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), goldMat);
      pip.position.y = 1.55;
      fig.add(pip);
      root.add(fig);
      break;
    }
  }

  return root;
}

// ----------------------------------------------------------------------------
// 2B. PROCEDURAL 3D BUILDING MODELS (OWNERSHIP FLAG, CAMP, TOWER, CITADEL)
// ----------------------------------------------------------------------------
export function buildBuildingModel(tier = 0, colorHex = 0xb91c1c) {
  const root = new THREE.Group();
  const playerMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.5, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.2, roughness: 0.7 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

  switch (tier) {
    case 1: {
      // ⛺ Trại Tiền Đồn (Adventurer's Tent & Campfire)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 16), stoneMat);
      base.position.y = 0.04;
      root.add(base);

      // A-frame Tent
      const tentGeo = new THREE.ConeGeometry(0.42, 0.65, 4);
      const tent = new THREE.Mesh(tentGeo, playerMat);
      tent.rotation.y = Math.PI / 4;
      tent.position.set(-0.08, 0.36, 0);
      root.add(tent);

      // Wooden ridge pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 8), woodMat);
      pole.position.set(-0.08, 0.42, 0);
      pole.rotation.x = Math.PI / 2;
      root.add(pole);

      // Campfire
      const fire = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.25, 8),
        new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xef4444, emissiveIntensity: 2 })
      );
      fire.position.set(0.32, 0.16, 0);
      root.add(fire);
      break;
    }
    case 2: {
      // 🏰 Tháp Canh Đá (Stone Watchtower)
      const towerGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.85, 16);
      const tower = new THREE.Mesh(towerGeo, stoneMat);
      tower.position.y = 0.45;
      root.add(tower);

      // Parapet
      const parapet = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.42, 0.18, 16), playerMat);
      parapet.position.y = 0.95;
      root.add(parapet);

      // 4 crenellations
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const cren = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.12), playerMat);
        cren.position.set(Math.cos(ang) * 0.38, 1.08, Math.sin(ang) * 0.38);
        root.add(cren);
      }

      // Flagstaff
      const flagStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), goldMat);
      flagStaff.position.set(0, 1.25, 0);
      root.add(flagStaff);

      // Fluttering Pennant
      const pennant = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.02), playerMat);
      pennant.position.set(0.12, 1.38, 0);
      root.add(pennant);
      break;
    }
    case 3: {
      // 🏯 Đại Pháo Đài (Royal Citadel)
      const mainKeep = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), stoneMat);
      mainKeep.position.y = 0.38;
      root.add(mainKeep);

      // 4 corner turrets
      for (let i = 0; i < 4; i++) {
        const x = (i % 2 === 0 ? 1 : -1) * 0.32;
        const z = (i < 2 ? 1 : -1) * 0.32;
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 12), playerMat);
        turret.position.set(x, 0.48, z);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.38, 12), goldMat);
        spire.position.set(x, 1.08, z);
        root.add(turret);
        root.add(spire);
      }

      // Central Grand Spire
      const grandTower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 1.1, 16), stoneMat);
      grandTower.position.y = 0.65;
      const grandSpire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 16), goldMat);
      grandSpire.position.y = 1.45;
      root.add(grandTower);
      root.add(grandSpire);
      break;
    }
    case 0:
    default: {
      // 🚩 Cờ Sở Hữu / Boundary Stone
      const stoneBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.12, 12), stoneMat);
      stoneBase.position.y = 0.06;
      root.add(stoneBase);

      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8), woodMat);
      staff.position.y = 0.52;
      root.add(staff);

      const goldFinial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), goldMat);
      goldFinial.position.y = 1.02;
      root.add(goldFinial);

      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.03), playerMat);
      banner.position.set(0.2, 0.82, 0);
      root.add(banner);
      break;
    }
  }

  return root;
}

const buildingSnapshotCache = new Map();

function getBuildingDataUrl(tier, colorHex) {
  const key = `${tier}_${colorHex}`;
  if (buildingSnapshotCache.has(key)) return buildingSnapshotCache.get(key);
  if (typeof document === 'undefined') return null;

  try {
    const width = 120;
    const height = 120;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 1.35, 2.7);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(2);

    const ambLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.0);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    const model = buildBuildingModel(tier, colorHex);
    model.rotation.y = Math.PI * 0.25;
    scene.add(model);

    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL('image/png');

    disposeHierarchy(scene);
    renderer.dispose();
    renderer.forceContextLoss();

    buildingSnapshotCache.set(key, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Error generating 3D building snapshot:', err);
    return null;
  }
}

export function Building3D({ tier = 0, colorHex = 0xb91c1c, size = 36, className = "" }) {
  const [dataUrl, setDataUrl] = useState(() => getBuildingDataUrl(tier, colorHex));

  useEffect(() => {
    const url = getBuildingDataUrl(tier, colorHex);
    setDataUrl(url);
  }, [tier, colorHex]);

  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt={`Building Tier ${tier}`}
        style={{ width: size, height: size }}
        className={`inline-block pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] object-contain select-none ${className}`}
      />
    );
  }

  return (
    <div style={{ width: size, height: size }} className="inline-flex items-center justify-center">
      <span className="text-xl">{tier === 3 ? '🏯' : tier === 2 ? '🏰' : tier === 1 ? '⛺' : '🚩'}</span>
    </div>
  );
}

// ============================================================================
// 3. REACT 3D COMPONENT: PIECE3D (ON-DEMAND & SMOOTH GPU OPTIMIZED)
// ============================================================================

export function Piece3D({
  classId = 'fighter',
  hexColor = 0xb91c1c,
  size = 48,
  isCurrentTurn = false,
  animated = true,
  interactive = false,
  onClick,
  className = ''
}) {
  const mountRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const width = size;
    const height = size;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 3.2);
    camera.lookAt(0, 0.65, 0);

    // 2. Optimized WebGLRenderer with low power preference
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // Turn beacon pointlight
    const beaconLight = new THREE.PointLight(0xfbbf24, isCurrentTurn ? 2.5 : 0, 5);
    beaconLight.position.set(0, 1.8, 1);
    scene.add(beaconLight);

    // 4. Contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    // 5. Piece Model
    const modelGroup = buildPieceModel(classId, hexColor);
    scene.add(modelGroup);

    // 6. Animation Loop (Smart Throttle: Only animates at 60fps when active/hovered)
    let startTime = performance.now();
    let isDisposed = false;

    const render = () => {
      if (isDisposed) return;
      const elapsed = (performance.now() - startTime) / 1000;

      // Spinning rings if present (Wizard/Sorcerer)
      const ring1 = modelGroup.getObjectByName('spinning_ring');
      if (ring1) ring1.rotation.z += 0.04;
      const eRing1 = modelGroup.getObjectByName('energy_ring_1');
      if (eRing1) eRing1.rotation.z += 0.05;
      const eRing2 = modelGroup.getObjectByName('energy_ring_2');
      if (eRing2) eRing2.rotation.x += 0.03;

      // Active / Turn / Hover Animation
      if (isCurrentTurn || isHoveredRef.current) {
        modelGroup.rotation.y += isHoveredRef.current ? 0.04 : 0.02;
        modelGroup.position.y = Math.sin(elapsed * 4) * 0.12;
        beaconLight.intensity = 1.5 + Math.sin(elapsed * 6) * 1.0;
        shadowMesh.scale.setScalar(1 - modelGroup.position.y * 1.5);
      } else if (animated) {
        // Gentle subtle breathing bob
        modelGroup.rotation.y += 0.008;
        modelGroup.position.y = Math.sin(elapsed * 2) * 0.04;
        shadowMesh.scale.setScalar(1 - modelGroup.position.y * 1.5);
      }

      renderer.render(scene, camera);

      if (animated || isCurrentTurn || isHoveredRef.current) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    // First render
    render();

    // Mouse hover listeners
    const onMouseEnter = () => {
      isHoveredRef.current = true;
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = requestAnimationFrame(render);
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
    };

    if (interactive) {
      mountEl.addEventListener('mouseenter', onMouseEnter);
      mountEl.addEventListener('mouseleave', onMouseLeave);
    }

    // Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameIdRef.current);
      if (interactive) {
        mountEl.removeEventListener('mouseenter', onMouseEnter);
        mountEl.removeEventListener('mouseleave', onMouseLeave);
      }
      disposeHierarchy(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      if (mountEl) mountEl.innerHTML = '';
    };
  }, [classId, hexColor, size, isCurrentTurn, animated, interactive]);

  return (
    <div
      ref={mountRef}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Backward-compatible wrapper for existing Monopoly code
export function PawnSVG({ hexColor = 0xb91c1c, size = 45, classId = 'fighter', ...props }) {
  return (
    <div className="relative flex items-center justify-center drop-shadow-xl">
      <Piece3D classId={classId} hexColor={hexColor} size={size} animated={true} {...props} />
    </div>
  );
}

// ============================================================================
// 4. REACT 3D COMPONENT: DICE3D (D6 MONOPOLY & D20 RPG ACCURATE ROLLING)
// ============================================================================

export function Dice3D({
  type = 'D6',
  isRolling = false,
  result = 1,
  size = 120,
  theme = 'ivory',
  onRollEnd
}) {
  const mountRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const diceMeshRef = useRef(null);
  const [displayResult, setDisplayResult] = useState(result);
  const prevRollingRef = useRef(isRolling);

  // Exact target rotations for D6 to face camera prominently with 3D isometric tilt
  const getD6TargetRotation = (val) => {
    // Tilts by 0.28 rad pitch & 0.35 rad yaw to showcase 3D depth while face is clear
    const tiltX = 0.28;
    const tiltY = 0.35;
    switch (val) {
      case 1: // +X face
        return { x: tiltX, y: -Math.PI / 2 + tiltY, z: 0 };
      case 6: // -X face
        return { x: tiltX, y: Math.PI / 2 + tiltY, z: 0 };
      case 2: // +Y face
        return { x: Math.PI / 2 + tiltX, y: tiltY, z: 0 };
      case 5: // -Y face
        return { x: -Math.PI / 2 + tiltX, y: tiltY, z: 0 };
      case 3: // +Z face
        return { x: tiltX, y: tiltY, z: 0 };
      case 4: // -Z face
        return { x: tiltX, y: Math.PI + tiltY, z: 0 };
      default:
        return { x: tiltX, y: tiltY, z: 0 };
    }
  };

  useEffect(() => {
    // Sound FX & Result updates
    if (isRolling && !prevRollingRef.current) {
      SoundFX.playShake();
    } else if (!isRolling && prevRollingRef.current) {
      SoundFX.playLand();
      setDisplayResult(result);
      if (onRollEnd) onRollEnd(result);
    }
    prevRollingRef.current = isRolling;
  }, [isRolling, result, onRollEnd]);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const width = size;
    const height = size;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 0.3, 4.4);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    // 3. Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.6);
    dirLight1.position.set(4, 6, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(type === 'D20' ? 0xa855f7 : 0xf59e0b, 1.5);
    dirLight2.position.set(-4, -2, 3);
    scene.add(dirLight2);

    // 4. Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.2;
    scene.add(shadowMesh);

    // 5. Build Dice Geometry & Materials
    let diceGroup = new THREE.Group();
    let d20Normals = [];

    if (type === 'D20') {
      // D20 Icosahedron
      const geo = new THREE.IcosahedronGeometry(1.4, 0);
      const nonIndexed = geo.toNonIndexed();

      // Extract 20 face normals for mathematical face alignment
      const pos = nonIndexed.attributes.position;
      for (let i = 0; i < 20; i++) {
        const ax = pos.getX(i * 3);
        const ay = pos.getY(i * 3);
        const az = pos.getZ(i * 3);
        const bx = pos.getX(i * 3 + 1);
        const by = pos.getY(i * 3 + 1);
        const bz = pos.getZ(i * 3 + 1);
        const cx = pos.getX(i * 3 + 2);
        const cy = pos.getY(i * 3 + 2);
        const cz = pos.getZ(i * 3 + 2);
        const norm = new THREE.Vector3((ax + bx + cx) / 3, (ay + by + cy) / 3, (az + bz + cz) / 3).normalize();
        d20Normals.push(norm);
      }

      // Faceted gemstone material
      const mat = new THREE.MeshStandardMaterial({
        color: theme === 'ruby' ? 0x991b1b : theme === 'emerald' ? 0x065f46 : 0x581c87,
        metalness: 0.55,
        roughness: 0.2,
        flatShading: true
      });
      const d20Mesh = new THREE.Mesh(nonIndexed, mat);

      // Gold beveled wireframe edges
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xfde047, linewidth: 2 })
      );
      d20Mesh.add(edges);
      diceGroup.add(d20Mesh);
    } else {
      // D6 Monopoly Cube with 6 photorealistic canvas textures
      const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      // Group order in Three.js BoxGeometry:
      // 0: +X (1), 1: -X (6), 2: +Y (2), 3: -Y (5), 4: +Z (3), 5: -Z (4)
      const materials = [
        new THREE.MeshStandardMaterial({ map: createD6FaceTexture(1, theme), roughness: 0.2, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ map: createD6FaceTexture(6, theme), roughness: 0.2, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ map: createD6FaceTexture(2, theme), roughness: 0.2, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ map: createD6FaceTexture(5, theme), roughness: 0.2, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ map: createD6FaceTexture(3, theme), roughness: 0.2, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ map: createD6FaceTexture(4, theme), roughness: 0.2, metalness: 0.15 })
      ];
      const d6Mesh = new THREE.Mesh(geo, materials);

      // Gold bevel wireframe edges
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color: theme === 'obsidian' ? 0x38bdf8 : theme === 'ruby' ? 0xfde047 : 0xd97706,
          linewidth: 2
        })
      );
      d6Mesh.add(edges);
      diceGroup.add(d6Mesh);
    }

    diceMeshRef.current = diceGroup;
    scene.add(diceGroup);

    // Initial orientation
    if (!isRolling) {
      if (type === 'D6') {
        const targetRot = getD6TargetRotation(result);
        diceGroup.rotation.set(targetRot.x, targetRot.y, targetRot.z);
      } else {
        const faceIdx = Math.max(0, Math.min(19, result - 1));
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(
          d20Normals[faceIdx] || new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0.25, 1).normalize()
        );
        diceGroup.quaternion.copy(targetQuat);
      }
    }

    // 6. Animation Engine with Physics Deceleration & Settling
    let rollVelocity = { x: 0.2, y: 0.25, z: 0.18 };
    let settleProgress = 1.0;
    let isDisposed = false;

    const animate = () => {
      if (isDisposed) return;

      if (isRolling) {
        // High-velocity tumbling tumble
        diceGroup.rotation.x += rollVelocity.x;
        diceGroup.rotation.y += rollVelocity.y;
        diceGroup.rotation.z += rollVelocity.z;

        // Bouncing parabolic arc
        const bounce = Math.abs(Math.sin(performance.now() * 0.015)) * 0.45;
        diceGroup.position.y = bounce;
        shadowMesh.scale.setScalar(1 - bounce * 0.8);
        shadowMesh.material.opacity = 0.75 - bounce * 0.4;
        settleProgress = 0.0;
      } else {
        // Settling phase: Slerp / Ease-out into the target face
        if (settleProgress < 1.0) {
          settleProgress = Math.min(1.0, settleProgress + 0.04);
          const ease = 1 - Math.pow(1 - settleProgress, 3);

          if (type === 'D6') {
            const targetRot = getD6TargetRotation(result);
            const targetQuat = new THREE.Quaternion().setFromEuler(
              new THREE.Euler(targetRot.x, targetRot.y, targetRot.z)
            );
            diceGroup.quaternion.slerp(targetQuat, 0.15);
          } else {
            const faceIdx = Math.max(0, Math.min(19, result - 1));
            const targetQuat = new THREE.Quaternion().setFromUnitVectors(
              d20Normals[faceIdx] || new THREE.Vector3(0, 1, 0),
              new THREE.Vector3(0, 0.25, 1).normalize()
            );
            diceGroup.quaternion.slerp(targetQuat, 0.15);
          }

          // Gentle settling dampening bounce
          const dampBounce = Math.sin((1 - ease) * Math.PI) * 0.15;
          diceGroup.position.y = dampBounce;
          shadowMesh.scale.setScalar(1 - dampBounce);
          shadowMesh.material.opacity = 0.75;
        } else {
          // Idle floating hover
          diceGroup.position.y = Math.sin(performance.now() * 0.003) * 0.04;
          shadowMesh.scale.setScalar(1 - diceGroup.position.y);
        }
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameIdRef.current);
      disposeHierarchy(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      if (mountEl) mountEl.innerHTML = '';
    };
  }, [type, isRolling, result, size, theme]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div
        ref={mountRef}
        style={{ width: size, height: size }}
        className="drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)] cursor-pointer"
      />

      {/* Floating Result Badge */}
      {!isRolling && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="font-black text-amber-300 drop-shadow-[0_4px_12px_rgba(0,0,0,1)] text-2xl md:text-3xl animate-bounce"
            style={{ textShadow: '0 0 12px rgba(245, 158, 11, 0.9), 0 0 2px #000' }}
          >
            {displayResult}
          </span>
        </div>
      )}

      {/* Type pill label */}
      <div className="mt-1 bg-stone-900/90 border border-amber-600/60 px-3 py-0.5 rounded-full text-[10px] font-bold text-amber-300 shadow-lg tracking-wider">
        {type} {isRolling ? '...' : `[${displayResult}]`}
      </div>
    </div>
  );
}

// ============================================================================
// 5. TOKEN GALLERY MODAL: 360° 3D VIEWER FOR ALL PIECES & DICE
// ============================================================================

export const PIECE_CATALOG = [
  // RPG Classes
  { id: 'fighter', name: 'Warriors', category: 'D&D Hero', icon: '⚔️', color: 0xb91c1c, desc: 'Chiến Binh Giáp Trụ & Song Kiếm' },
  { id: 'rogue', name: 'Rogue', category: 'D&D Hero', icon: '🗡️', color: 0x7e22ce, desc: 'Sát Thủ Bóng Đêm & Song Đoản Đao' },
  { id: 'wizard', name: 'Wizard', category: 'D&D Hero', icon: '🔮', color: 0x1d4ed8, desc: 'Đại Pháp Sư Nón Phù Thủy & Quả Cầu Mana' },
  { id: 'cleric', name: 'Cleric', category: 'D&D Hero', icon: '✝️', color: 0xd97706, desc: 'Mục Sư Thánh Quang & Chén Thánh Mặt Trời' },
  { id: 'paladin', name: 'Paladin', category: 'D&D Hero', icon: '🛡️', color: 0xfacc15, desc: 'Hiệp Sĩ Thánh Khiên Pháo Đài Hoàng Gia' },
  { id: 'barbarian', name: 'Barbarian', category: 'D&D Hero', icon: '🪓', color: 0xc2410c, desc: 'Chiến Tướng Cuồng Nộ Rìu Song Lưỡi' },
  { id: 'ranger', name: 'Ranger', category: 'D&D Hero', icon: '🏹', color: 0x047857, desc: 'Thiện Xạ Rừng Sâu Cung & Ống Tên' },
  { id: 'druid', name: 'Druid', category: 'D&D Hero', icon: '🌿', color: 0x15803d, desc: 'Hiền Triết Thiên Nhiên Sừng Hươu & Ngọc Lục Bảo' },
  { id: 'warlock', name: 'Warlock', category: 'D&D Hero', icon: '👁️', color: 0x4338ca, desc: 'Thuật Sĩ Hư Không Mắt Quỷ & Sách Ma Đạo' },
  { id: 'sorcerer', name: 'Sorcerer', category: 'D&D Hero', icon: '⚡', color: 0x0891b2, desc: 'Phù Thủy Long Tộc Tháp Tinh Thể Sấm Sét' },
  // Classic Chess
  { id: 'pawn', name: 'Tốt (Pawn)', category: 'Cờ Vua', icon: '♟️', color: 0xe2e8f0, desc: 'Quân Tốt Cờ Vua Gỗ Tiện Hoàng Gia' },
  { id: 'knight', name: 'Mã (Knight)', category: 'Cờ Vua', icon: '♞', color: 0xe2e8f0, desc: 'Chiến Mã Tinh Xảo Với Bờm & Dây Cương' },
  { id: 'rook', name: 'Xe (Rook)', category: 'Cờ Vua', icon: '♜', color: 0xe2e8f0, desc: 'Pháo Đài Kiên Cố Lỗ Châu Mai' },
  { id: 'bishop', name: 'Tượng (Bishop)', category: 'Cờ Vua', icon: '♝', color: 0xe2e8f0, desc: 'Giáo Hoàng Mũ Giám Mục & Thánh Điểm' },
  { id: 'queen', name: 'Hậu (Queen)', category: 'Cờ Vua', icon: '♛', color: 0xe2e8f0, desc: 'Nữ Hoàng Vương Miện Tinh Thể Hồng Ngọc' },
  { id: 'king', name: 'Vua (King)', category: 'Cờ Vua', icon: '♚', color: 0xe2e8f0, desc: 'Đức Vua Vương Miện Thánh Giá Latin' },
  // Classic Monopoly
  { id: 'tophat', name: 'Nón Quý Tộc', category: 'Monopoly', icon: '🎩', color: 0x334155, desc: 'Mũ Ảo Thuật Quý Tộc Victoria Cổ Điển' },
  { id: 'car', name: 'Xe Đua Cổ', category: 'Monopoly', icon: '🚗', color: 0xb91c1c, desc: 'Chiếc Xe Thể Thao Vintage 4 Bánh Răng Cưa' },
  { id: 'battleship', name: 'Chiến Hạm', category: 'Monopoly', icon: '🚢', color: 0x64748b, desc: 'Thiết Giáp Hạm Hải Quân Đại Bác Đôi' },
  { id: 'thimble', name: 'Ống Chỉ Bạc', category: 'Monopoly', icon: '🧵', color: 0x94a3b8, desc: 'Ống Chỉ Kim Loại Khảm Hoa Văn Cổ' }
];

export function TokenGalleryModal({ isOpen, onClose }) {
  const [selectedPiece, setSelectedPiece] = useState(PIECE_CATALOG[0]);
  const [filter, setFilter] = useState('ALL');
  const [diceRolling, setDiceRolling] = useState(false);
  const [d6Result, setD6Result] = useState(6);
  const [d20Result, setD20Result] = useState(20);

  if (!isOpen) return null;

  const categories = ['ALL', 'D&D Hero', 'Cờ Vua', 'Monopoly'];
  const filtered = filter === 'ALL' ? PIECE_CATALOG : PIECE_CATALOG.filter((p) => p.category === filter);

  const handleTestRoll = () => {
    setDiceRolling(true);
    setTimeout(() => {
      setD6Result(Math.floor(Math.random() * 6) + 1);
      setD20Result(Math.floor(Math.random() * 20) + 1);
      setDiceRolling(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-stone-900 border-2 border-amber-600/80 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="p-4 bg-stone-950 border-b border-amber-900/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
              <span>🏛️</span> Bảo Tàng Quân Cờ & Xúc Xắc 3D Monopoly
            </h2>
            <p className="text-stone-400 text-xs">Mô hình 3D tương tác hoàn toàn bằng Three.js procedurally</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: 3D Showcase Preview */}
          <div className="md:col-span-6 flex flex-col items-center bg-stone-950/70 border border-stone-800 rounded-xl p-5 shadow-inner">
            <h3 className="text-amber-500 font-bold uppercase tracking-wider text-xs mb-3">
              Mô Hình Quân Cờ 3D (Xoay 360°)
            </h3>
            <div className="w-56 h-56 flex items-center justify-center relative bg-gradient-to-b from-stone-900/60 to-black/80 rounded-2xl border border-amber-500/30 shadow-2xl">
              <Piece3D
                classId={selectedPiece.id}
                hexColor={selectedPiece.color}
                size={210}
                animated={true}
                interactive={true}
                isCurrentTurn={true}
              />
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-black text-stone-100 flex items-center justify-center gap-2">
                <span>{selectedPiece.icon}</span> {selectedPiece.name}
              </div>
              <div className="text-amber-400/90 text-sm font-semibold mt-1">{selectedPiece.category}</div>
              <p className="text-stone-400 text-xs mt-2 max-w-xs">{selectedPiece.desc}</p>
            </div>

            {/* Test Dice Section */}
            <div className="w-full mt-6 pt-4 border-t border-stone-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-amber-500 uppercase">Thử Nghiệm Xúc Xắc 3D</span>
                <button
                  onClick={handleTestRoll}
                  disabled={diceRolling}
                  className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded shadow transition"
                >
                  {diceRolling ? 'Đang Lăn...' : '🎲 Tung Thử 3D'}
                </button>
              </div>
              <div className="flex justify-around items-center bg-stone-900/80 rounded-lg p-2 border border-stone-800">
                <Dice3D type="D6" isRolling={diceRolling} result={d6Result} size={90} theme="ivory" />
                <Dice3D type="D20" isRolling={diceRolling} result={d20Result} size={90} theme="amethyst" />
              </div>
            </div>
          </div>

          {/* Right: Grid of all 20 tokens */}
          <div className="md:col-span-6 flex flex-col">
            {/* Filter Tabs */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`text-xs px-3 py-1 rounded-md font-bold transition ${
                    filter === cat
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Token Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filtered.map((piece) => {
                const isSelected = selectedPiece.id === piece.id;
                return (
                  <div
                    key={piece.id}
                    onClick={() => setSelectedPiece(piece)}
                    className={`cursor-pointer rounded-xl p-2.5 border transition flex flex-col items-center justify-between text-center ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]'
                        : 'border-stone-800 bg-stone-900/60 hover:border-stone-600'
                    }`}
                  >
                    <div className="w-14 h-14 flex items-center justify-center">
                      <Piece3D classId={piece.id} hexColor={piece.color} size={54} animated={false} />
                    </div>
                    <div className="text-xs font-bold text-stone-200 mt-1 truncate w-full flex items-center justify-center gap-1">
                      <span>{piece.icon}</span> {piece.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-bold px-6 py-2 rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
