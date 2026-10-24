import * as THREE from 'three';

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
    case 'horse': {
      // Warhorse figurine for Cờ Cá Ngựa: lacquered body, gold tack, flowing mane.
      const fig = new THREE.Group();
      const shade = new THREE.Color(colorHex).multiplyScalar(0.45);
      const maneMat = new THREE.MeshStandardMaterial({ color: shade, roughness: 0.55, metalness: 0.2 });
      const hoofMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.65, metalness: 0.25 });
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.3, metalness: 0.4 });

      // Barrel and rounded chest / hindquarters.
      const barrel = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), playerMat);
      barrel.scale.set(0.85, 0.86, 1.3);
      barrel.position.set(0, 0.94, -0.02);
      fig.add(barrel);

      const chest = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), playerMat);
      chest.scale.set(1, 1.05, 0.95);
      chest.position.set(0, 0.94, 0.34);
      fig.add(chest);

      const rump = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), playerMat);
      rump.scale.set(1, 1.02, 1);
      rump.position.set(0, 0.94, -0.4);
      fig.add(rump);

      // Arched neck leaning toward +Z (camera).
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.23, 0.6, 18), playerMat);
      neck.position.set(0, 1.27, 0.32);
      neck.rotation.x = 0.42;
      fig.add(neck);

      // Cranium, tapered face and rounded muzzle.
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 20, 16), playerMat);
      head.scale.set(0.95, 1.08, 1.15);
      head.position.set(0, 1.54, 0.44);
      head.rotation.x = 0.35;
      fig.add(head);

      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.155, 0.44, 10), playerMat);
      face.position.set(0, 1.4, 0.62);
      face.rotation.x = 2.18;
      fig.add(face);

      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), playerMat);
      muzzle.scale.set(0.9, 0.85, 1.1);
      muzzle.position.set(0, 1.29, 0.78);
      fig.add(muzzle);

      // Ears, eyes and nostrils.
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 10), playerMat);
        ear.position.set(side * 0.07, 1.66, 0.36);
        ear.rotation.x = -0.1;
        fig.add(ear);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), eyeMat);
        eye.position.set(side * 0.135, 1.5, 0.6);
        fig.add(eye);

        const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), eyeMat);
        nostril.position.set(side * 0.035, 1.31, 0.85);
        fig.add(nostril);
      }

      const blaze = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.03), goldMat);
      blaze.position.set(0, 1.47, 0.71);
      blaze.rotation.x = -0.75;
      fig.add(blaze);

      const browStar = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), goldMat);
      browStar.position.set(0, 1.61, 0.58);
      fig.add(browStar);

      const forelock = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 8), maneMat);
      forelock.position.set(0, 1.66, 0.48);
      forelock.rotation.x = 0.9;
      fig.add(forelock);

      // Flowing mane down the crest of the neck.
      const maneCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.02, 1.68, 0.38),
        new THREE.Vector3(-0.03, 1.54, 0.24),
        new THREE.Vector3(-0.03, 1.34, 0.1),
        new THREE.Vector3(-0.02, 1.14, 0)
      ]);
      const mane = new THREE.Mesh(new THREE.TubeGeometry(maneCurve, 16, 0.055, 8, false), maneMat);
      fig.add(mane);

      for (let i = 0; i < 3; i++) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.065 - i * 0.012, 0.19, 8), maneMat);
        tuft.position.set(-0.03, 1.58 - i * 0.13, 0.3 - i * 0.1);
        tuft.rotation.x = 2.4;
        fig.add(tuft);
      }

      // Tail sweeping back and down.
      const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.1, -0.52),
        new THREE.Vector3(-0.06, 0.98, -0.7),
        new THREE.Vector3(-0.12, 0.7, -0.8),
        new THREE.Vector3(-0.16, 0.45, -0.72)
      ]);
      const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 16, 0.052, 8, false), maneMat);
      fig.add(tail);

      const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.19, 8), maneMat);
      tailTip.position.set(-0.17, 0.42, -0.7);
      tailTip.rotation.z = -0.25;
      fig.add(tailTip);

      // Saddle blanket, saddle and breast collar.
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.035, 0.5), maneMat);
      blanket.position.set(0, 1.235, 0);
      fig.add(blanket);

      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.32), goldMat);
      saddle.position.set(0, 1.28, 0);
      fig.add(saddle);

      const cantle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.026, 8, 18, Math.PI), goldMat);
      cantle.position.set(0, 1.32, -0.16);
      cantle.rotation.x = Math.PI / 2;
      fig.add(cantle);

      // Breast strap across the chest.
      const breastCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.27, 1.1, 0.36),
        new THREE.Vector3(0, 1.06, 0.58),
        new THREE.Vector3(0.27, 1.1, 0.36)
      ]);
      const breast = new THREE.Mesh(new THREE.TubeGeometry(breastCurve, 12, 0.018, 6, false), goldMat);
      fig.add(breast);

      // Noseband and reins.
      const noseband = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.014, 6, 16, Math.PI), goldMat);
      noseband.position.set(0, 1.29, 0.79);
      noseband.rotation.set(0.2, 0, Math.PI);
      fig.add(noseband);

      for (const side of [-1, 1]) {
        const reinCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.11, 1.32, 0.77),
          new THREE.Vector3(side * 0.27, 1.25, 0.42),
          new THREE.Vector3(side * 0.2, 1.24, 0.1)
        ]);
        const rein = new THREE.Mesh(new THREE.TubeGeometry(reinCurve, 12, 0.012, 6, false), goldMat);
        fig.add(rein);

        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), goldMat);
        strap.position.set(side * 0.24, 1.13, 0.02);
        fig.add(strap);
        const stirrup = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12), goldMat);
        stirrup.position.set(side * 0.24, 0.96, 0.02);
        stirrup.rotation.y = Math.PI / 2;
        fig.add(stirrup);
      }

      // Legs and hooves, front pair slightly forward for a proud stance.
      const legs = [
        [-0.165, 0.24, 0.07],
        [0.165, 0.24, 0.07],
        [-0.165, -0.26, -0.06],
        [0.165, -0.26, -0.06]
      ];
      for (const [x, z, lean] of legs) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.062, 0.56, 10), playerMat);
        leg.position.set(x, 0.56, z);
        leg.rotation.x = lean;
        fig.add(leg);

        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.073, 0.08, 10), hoofMat);
        hoof.position.set(x, 0.315, z + lean * 0.24);
        fig.add(hoof);
      }

      root.add(fig);
      break;
    }

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

export const PIECE_CATALOG = [
  // RPG Classes
  { id: 'fighter', name: 'Warrior', category: 'D&D Hero', icon: '⚔️', color: 0xb91c1c, desc: 'Chiến Binh Giáp Trụ & Song Kiếm' },
  { id: 'rogue', name: 'Rogue', category: 'D&D Hero', icon: '🗡️', color: 0x7e22ce, desc: 'Sát Thủ Bóng Đêm & Song Đoản Đao' },
  { id: 'wizard', name: 'Wizard', category: 'D&D Hero', icon: '🔮', color: 0x1d4ed8, desc: 'Đại Pháp Sư Nón Phù Thủy & Quả Cầu Mana' },
  { id: 'cleric', name: 'Cleric', category: 'D&D Hero', icon: '✝️', color: 0xd97706, desc: 'Mục Sư Thánh Quang & Chén Thánh Mặt Trời' },
  { id: 'paladin', name: 'Paladin', category: 'D&D Hero', icon: '🛡️', color: 0xfacc15, desc: 'Hiệp Sĩ Thánh Khiên Pháo Đài Hoàng Gia' },
  { id: 'barbarian', name: 'Barbarian', category: 'D&D Hero', icon: '🪓', color: 0xc2410c, desc: 'Chiến Tướng Cuồng Nộ Rìu Song Lưỡi' },
  { id: 'ranger', name: 'Ranger', category: 'D&D Hero', icon: '🏹', color: 0x047857, desc: 'Thiện Xạ Rừng Sâu Cung & Ống Tên' },
  { id: 'druid', name: 'Druid', category: 'D&D Hero', icon: '🌿', color: 0x15803d, desc: 'Hiền Triết Thiên Nhiên Sừng Hươu & Ngọc Lục Bảo' },
  { id: 'warlock', name: 'Warlock', category: 'D&D Hero', icon: '👁️', color: 0x4338ca, desc: 'Thuật Sĩ Hư Không Mắt Quỷ & Sách Ma Đạo' },
  { id: 'sorcerer', name: 'Sorcerer', category: 'D&D Hero', icon: '⚡', color: 0x0891b2, desc: 'Phù Thủy Long Tộc Tháp Tinh Thể Sấm Sét' },
  { id: 'horse', name: 'Chiến Mã', category: 'Cờ Cá Ngựa', icon: '🐴', color: 0xef4444, desc: 'Chiến mã bờm vàng, yên cương lụa là' },
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
