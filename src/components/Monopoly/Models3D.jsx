import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ----------------------------------------------------
// 1. QUÂN CỜ (Dùng CSS/SVG thay cho WebGL để tránh lỗi Context loss)
// ----------------------------------------------------
export function PawnSVG({ hexColor, size = 45 }) {
  const colorStr = `#${hexColor.toString(16).padStart(6, '0')}`;
  return (
    <div 
      className="relative drop-shadow-2xl flex items-center justify-center animate-bounce"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Đế */}
        <ellipse cx="50" cy="85" rx="35" ry="10" fill="#1c1917" stroke={colorStr} strokeWidth="3" />
        {/* Thân */}
        <path d="M25 80 L40 20 Q50 10 60 20 L75 80 Z" fill={colorStr} />
        {/* Đầu */}
        <circle cx="50" cy="20" r="15" fill={colorStr} stroke="#1c1917" strokeWidth="2" />
        {/* Ánh sáng kim loại */}
        <path d="M45 25 L35 75" stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none" />
      </svg>
    </div>
  );
}

// ----------------------------------------------------
// 2. XÚC XẮC 3D (D6 & D20) CHUẨN D&D VỚI HIỆU ỨNG METALLIC
// ----------------------------------------------------
export function Dice3D({ type = 'D6', isRolling = false, result = 1 }) {
  const mountRef = useRef(null);
  const meshRef = useRef(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Nếu đang tung, ẩn số kết quả
    if (isRolling) {
      setShowResult(false);
    } else {
      // Khi dừng tung, đợi nửa giây rồi hiện số lên cho kịch tính
      const timer = setTimeout(() => setShowResult(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isRolling]);

  useEffect(() => {
    const width = 120;
    const height = 120;
    
    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);
    }

    // Ánh sáng (Phá vỡ khối wireframe cũ)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(type === 'D20' ? 0xa855f7 : 0xf59e0b, 4, 10);
    pointLight.position.set(-2, 2, 2);
    scene.add(pointLight);

    // Hình học
    let geometry;
    if (type === 'D20') {
      geometry = new THREE.IcosahedronGeometry(1.4, 0); // D20
    } else {
      geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // D6
    }

    // Chất liệu kim loại bóng bẩy
    const material = new THREE.MeshStandardMaterial({ 
      color: type === 'D20' ? 0x6b21a8 : 0xb45309, 
      metalness: 0.6,
      roughness: 0.2,
      flatShading: true // Giúp nổi bật các mặt của đa diện
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Viền kim loại mạ vàng
    const edgesGeo = new THREE.EdgesGeometry(geometry);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xfef08a, linewidth: 2 });
    const edgesMesh = new THREE.LineSegments(edgesGeo, edgesMat);
    mesh.add(edgesMesh);

    meshRef.current = mesh;
    scene.add(mesh);

    // Vị trí mặc định khi dừng
    if (!isRolling) {
      mesh.rotation.x = type === 'D20' ? 0.3 : 0.5;
      mesh.rotation.y = type === 'D20' ? 0.4 : 0.5;
    }

    let animationFrameId;
    const animate = () => {
      if (isRolling) {
        // Lăn cuồng nhiệt
        mesh.rotation.x += Math.random() * 0.3 + 0.1;
        mesh.rotation.y += Math.random() * 0.3 + 0.1;
        mesh.rotation.z += Math.random() * 0.3 + 0.1;
      } else {
        // Lơ lửng thư thái
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => { 
      cancelAnimationFrame(animationFrameId); 
      renderer.dispose(); 
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, [type, isRolling]);

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-none">
      <div ref={mountRef} className="w-[120px] h-[120px] drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
      
      {/* Lớp Overlay hiển thị số kết quả */}
      {!isRolling && showResult && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span 
            className="font-extrabold text-white drop-shadow-[0_0_5px_rgba(0,0,0,1)] animate-bounce"
            style={{ fontSize: type === 'D20' ? '28px' : '36px' }}
          >
            {result}
          </span>
        </div>
      )}
      
      <div className="mt-[-10px] bg-stone-900/80 border border-stone-600 px-3 py-1 rounded-full text-[10px] font-bold text-stone-300 shadow-md">
        {type}
      </div>
    </div>
  );
}