// Visualização 3D discreta dos investimentos: uma forma geométrica por classe,
// dimensionada pelo valor atual, flutuando lentamente com iluminação do tema.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSettings } from '../context/SettingsContext';
import { themeColor, createRenderer, fitToCanvas, renderLoop, disposeObject3D } from './three/sceneUtils';
import { INVESTMENT_TYPES } from '../data/categories';
import { formatBRL } from '../utils/format';

const GEOMETRIES = [
  (s) => new THREE.IcosahedronGeometry(s, 0),
  (s) => new THREE.TorusGeometry(s, s * 0.38, 24, 60),
  (s) => new THREE.OctahedronGeometry(s, 0),
  (s) => new THREE.DodecahedronGeometry(s, 0),
  (s) => new THREE.BoxGeometry(s * 1.5, s * 1.5, s * 1.5),
  (s) => new THREE.TetrahedronGeometry(s * 1.25, 0),
];

export default function Investments3D({ investments }) {
  const canvasRef = useRef(null);
  const { performance: perfMode, themeId, custom } = useSettings();

  useEffect(() => {
    if (perfMode || !investments.length) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer;
    try {
      renderer = createRenderer(canvas);
    } catch {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    camera.position.set(0, 1.4, 11);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 8);
    const rim = new THREE.PointLight(themeColor('--accent'), 34, 30);
    rim.position.set(-6, -2, 5);
    scene.add(key, rim);

    const typeColor = Object.fromEntries(INVESTMENT_TYPES.map((t) => [t.id, new THREE.Color(t.color)]));

    // agrupa por tipo somando o valor atual
    const byType = new Map();
    for (const inv of investments) {
      byType.set(inv.type, (byType.get(inv.type) || 0) + inv.current);
    }
    const entries = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const totalValue = entries.reduce((s, [, v]) => s + v, 0) || 1;

    const group = new THREE.Group();
    scene.add(group);
    const shapes = [];
    const count = entries.length;
    const spacing = 2.9;

    entries.forEach(([type, value], i) => {
      const share = value / totalValue;
      const s = 0.55 + share * 1.15;
      const color = typeColor[type] || new THREE.Color('#94a3b8');
      const mesh = new THREE.Mesh(
        GEOMETRIES[i % GEOMETRIES.length](s),
        new THREE.MeshStandardMaterial({ color, metalness: 0.78, roughness: 0.3, flatShading: true })
      );
      mesh.position.x = (i - (count - 1) / 2) * spacing;
      mesh.userData.phase = i * 1.7;
      group.add(mesh);
      shapes.push(mesh);
    });

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
      group.rotation.y = Math.sin(t * 0.1) * 0.16 + pointer.x * 0.14;
      group.rotation.x = pointer.y * -0.08;
      shapes.forEach((m, i) => {
        m.rotation.y = t * (0.22 + i * 0.03) + m.userData.phase;
        m.rotation.x = Math.sin(t * 0.3 + m.userData.phase) * 0.3;
        m.position.y = Math.sin(t * 0.7 + m.userData.phase) * 0.28;
      });
      renderer.render(scene, camera);
    });

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      disposeObject3D(scene);
      renderer.dispose();
    };
  }, [investments, perfMode, themeId, custom]);

  const legend = () => {
    const byType = new Map();
    for (const inv of investments) byType.set(inv.type, (byType.get(inv.type) || 0) + inv.current);
    return [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  };

  if (perfMode) {
    return (
      <div className="inv3d inv3d--fallback" aria-hidden="true">
        {legend().map(([type, v]) => (
          <span key={type} className="inv3d__orb" style={{ '--c': INVESTMENT_TYPES.find((t) => t.id === type)?.color || '#94a3b8' }} />
        ))}
      </div>
    );
  }

  if (!investments.length) return null;

  return (
    <div className="inv3d">
      <canvas ref={canvasRef} className="inv3d__canvas" aria-label="Visualização 3D dos investimentos por classe" role="img" />
      <ul className="inv3d__legend">
        {legend().map(([type, v]) => (
          <li key={type}>
            <span className="inv3d__dot" style={{ '--c': INVESTMENT_TYPES.find((t) => t.id === type)?.color || '#94a3b8' }} />
            <span className="inv3d__type">{type}</span>
            <span className="inv3d__value num">{formatBRL(v)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
