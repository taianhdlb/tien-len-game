import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Pawn3D({ hexColor, size = 40 }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 2, 4);
    camera.lookAt(0, 0.5, 0);
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 5, 3);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

    // Dựng Model dạng low-poly RPG
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: hexColor, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.2, 8), mat);
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 8), mat);
    body.position.y = 0.7;
    group.add(base, body);
    scene.add(group);

    let id;
    const animate = () => {
      group.rotation.y += 0.03;
      renderer.render(scene, camera);
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(id); renderer.dispose(); mountRef.current?.replaceChildren(); };
  }, [hexColor, size]);
  return <div ref={mountRef} className="pointer-events-none drop-shadow-2xl" />;
}

export function Dice3D({ type = 'D6', isRolling = false }) {
  const mountRef = useRef(null);
  const meshRef = useRef(null);
  
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 4);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(80, 80);
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1), new THREE.PointLight(0xffaa00, 3, 10).position.set(2, 2, 2));

    const geo = type === 'D20' ? new THREE.IcosahedronGeometry(1.2) : new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const mat = new THREE.MeshStandardMaterial({ color: type === 'D20' ? 0x6b21a8 : 0xb45309, wireframe: true, wireframeLinewidth: 2 });
    const mesh = new THREE.Mesh(geo, mat);
    meshRef.current = mesh;
    scene.add(mesh);

    let id;
    const animate = () => {
      if (isRolling) { mesh.rotation.x += 0.3; mesh.rotation.y += 0.4; }
      else { mesh.rotation.x += 0.01; mesh.rotation.y += 0.01; }
      renderer.render(scene, camera);
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(id); renderer.dispose(); mountRef.current?.replaceChildren(); };
  }, [type, isRolling]);
  return <div ref={mountRef} className="pointer-events-none drop-shadow-lg" />;
}