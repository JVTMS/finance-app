// Ambiente 3D de fundo: partículas discretas, geometrias metálicas lentas,
// linhas de luz e parallax sutil. Fica sempre ATRÁS da interface.
// Em Performance Mode (ou sem WebGL) usa um fallback CSS estático.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useSettings } from '../../context/SettingsContext';
import { themeColor, createRenderer, fitToCanvas, renderLoop, disposeObject3D } from './sceneUtils';

export default function Background3D() {
  const canvasRef = useRef(null);
  const { performance: perfMode, cinematic, themeId, custom } = useSettings();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (perfMode) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer;
    try {
      renderer = createRenderer(canvas);
    } catch {
      setFailed(true);
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
    camera.position.set(0, 0, 26);

    // ---- Iluminação ----
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(6, 8, 10);
    const accent = new THREE.PointLight(themeColor('--accent'), 60, 60);
    accent.position.set(-16, 6, 6);
    const accent2 = new THREE.PointLight(themeColor('--accent-2'), 30, 50);
    accent2.position.set(16, -8, 4);
    scene.add(ambient, key, accent, accent2);

    // ---- Partículas (poeira de luz) ----
    const buildParticles = (count, spread, size, opacity) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread.x;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: themeColor('--accent-2'),
        size,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      return new THREE.Points(geometry, material);
    };

    const dust = buildParticles(cinematic ? 620 : 380, { x: 70, y: 40, z: 30 }, 0.07, 0.4);
    const dust2 = cinematic ? buildParticles(320, { x: 90, y: 50, z: 40 }, 0.12, 0.22) : null;
    scene.add(dust);
    if (dust2) scene.add(dust2);

    // ---- Geometrias flutuantes ----
    const metal = (color, opacity = 1) =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.9,
        roughness: 0.32,
        transparent: opacity < 1,
        opacity,
      });

    const icosahedron = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), metal(0x9aa0ac, 0.5));
    icosahedron.material.wireframe = true;
    icosahedron.position.set(-16, 4, -12);

    const torus = new THREE.Mesh(new THREE.TorusGeometry(4.2, 1.05, 24, 64), metal(themeColor('--accent'), 0.55));
    torus.position.set(17, -5, -14);

    const octahedron = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), metal(0xb9bfc9, 0.7));
    octahedron.position.set(10, 8, -18);

    const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(1.6, 0), metal(themeColor('--accent-2'), 0.8));
    shard.position.set(-9, -8, -10);

    // Linhas de luz (órbitas finas)
    const lightLine = (radius, tilt) => {
      const curve = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.03, 8, 120),
        new THREE.MeshBasicMaterial({
          color: themeColor('--accent'),
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      curve.rotation.set(tilt.x, tilt.y, tilt.z);
      return curve;
    };
    const orbit1 = lightLine(11, { x: Math.PI / 2.25, y: 0.3, z: 0 });
    const orbit2 = lightLine(14, { x: Math.PI / 2.6, y: -0.5, z: 0.4 });

    scene.add(icosahedron, torus, octahedron, shard, orbit1, orbit2);

    // ---- Parallax sutil ----
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => fitToCanvas(renderer, camera, canvas);
    onResize();
    window.addEventListener('resize', onResize);

    const stop = renderLoop((t) => {
      // rotação extremamente lenta
      icosahedron.rotation.y = t * 0.05;
      icosahedron.rotation.x = Math.sin(t * 0.11) * 0.2;
      torus.rotation.y = t * 0.07;
      torus.rotation.x = Math.PI / 3 + Math.sin(t * 0.09) * 0.15;
      octahedron.rotation.y = -t * 0.06;
      octahedron.rotation.z = t * 0.04;
      shard.rotation.x = t * 0.08;
      shard.rotation.z = t * 0.05;
      orbit1.rotation.z = t * 0.02;
      orbit2.rotation.z = -t * 0.015;

      const float = (obj, phase, amp) => {
        obj.position.y += Math.sin(t * 0.3 + phase) * amp - (obj.userData.prevY || 0);
        obj.userData.prevY = Math.sin(t * 0.3 + phase) * amp;
      };
      float(icosahedron, 0, 0.5);
      float(torus, 1.6, 0.7);
      float(octahedron, 3.1, 0.45);
      float(shard, 4.4, 0.6);

      dust.rotation.y = t * 0.008;
      if (dust2) dust2.rotation.y = -t * 0.006;

      // parallax: movimento pequeno, camera sempre "olha o centro"
      const targetX = pointer.x * 0.9;
      const targetY = -pointer.y * 0.55;
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    });

    return () => {
      stop();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      disposeObject3D(scene);
      renderer.dispose();
    };
  }, [perfMode, cinematic, themeId, custom]);

  if (perfMode || failed) {
    return <div className="bg-fallback" aria-hidden="true" />;
  }
  return <canvas ref={canvasRef} className="bg-3d" aria-hidden="true" />;
}
