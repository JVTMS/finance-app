// Objeto hero ao lado do saldo: anel metálico + núcleo geométrico + satélite
// luminoso. Reage suavemente ao mouse. Desativado no Performance Mode.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSettings } from '../../context/SettingsContext';
import { themeColor, createRenderer, fitToCanvas, renderLoop, disposeObject3D } from './sceneUtils';

export default function HeroObject3D({ className }) {
  const canvasRef = useRef(null);
  const { performance: perfMode, themeId, custom } = useSettings();

  useEffect(() => {
    if (perfMode) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer;
    try {
      renderer = createRenderer(canvas);
    } catch {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0, 8.2);

    const group = new THREE.Group();
    scene.add(group);

    // Anel principal — cromo
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.5, 40, 110),
      new THREE.MeshStandardMaterial({ color: 0xd6d9df, metalness: 0.96, roughness: 0.2 })
    );
    ring.rotation.x = Math.PI / 5;
    group.add(ring);

    // Anel secundário fino
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(3.05, 0.045, 16, 130),
      new THREE.MeshStandardMaterial({
        color: themeColor('--accent'),
        metalness: 0.85,
        roughness: 0.3,
        emissive: themeColor('--accent'),
        emissiveIntensity: 0.55,
      })
    );
    ring2.rotation.x = Math.PI / 2.4;
    ring2.rotation.y = 0.3;
    group.add(ring2);

    // Núcleo
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 0),
      new THREE.MeshStandardMaterial({
        color: themeColor('--accent'),
        metalness: 0.75,
        roughness: 0.28,
        emissive: themeColor('--accent'),
        emissiveIntensity: 0.18,
        flatShading: true,
      })
    );
    group.add(core);

    // Satélite luminoso orbitando o anel
    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 20),
      new THREE.MeshBasicMaterial({ color: themeColor('--accent-2') })
    );
    group.add(satellite);

    // Iluminação de estúdio
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(4, 5, 6);
    const rim = new THREE.PointLight(themeColor('--accent'), 42, 30);
    rim.position.set(-5, -3, 4);
    const fill = new THREE.PointLight(themeColor('--accent-2'), 18, 26);
    fill.position.set(3, -4, -3);
    scene.add(key, rim, fill);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const ro = new ResizeObserver(() => fitToCanvas(renderer, camera, canvas));
    ro.observe(canvas);
    fitToCanvas(renderer, camera, canvas);

    const stop = renderLoop((t) => {
      group.rotation.y = t * 0.28 + pointer.x * 0.55;
      group.rotation.x = pointer.y * -0.35 + Math.sin(t * 0.4) * 0.05;
      core.rotation.y = -t * 0.5;
      core.rotation.x = t * 0.3;
      ring2.rotation.z = t * 0.15;

      const a = t * 0.9;
      satellite.position.set(Math.cos(a) * 3.05, Math.sin(a) * 0.9, Math.sin(a) * 3.05);

      group.position.y = Math.sin(t * 0.8) * 0.08;
      renderer.render(scene, camera);
    });

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      disposeObject3D(scene);
      renderer.dispose();
    };
  }, [perfMode, themeId, custom]);

  if (perfMode) return null;
  return <canvas ref={canvasRef} className={className || 'hero-object'} aria-hidden="true" />;
}
