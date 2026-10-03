// Utilidades compartilhadas pelas cenas three.js (cor de tema, sizing, loop com pausa).

import * as THREE from 'three';

/** Lê uma variável CSS do tema (precisa ser cor hex ou compatível com THREE.Color). */
export function themeColor(varName, fallback = '#d4af37') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!v) return new THREE.Color(fallback);
  try {
    return new THREE.Color(v);
  } catch {
    return new THREE.Color(fallback);
  }
}

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  return renderer;
}

export function fitToCanvas(renderer, camera, canvas) {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

/** Loop de render que pausa quando a aba fica oculta. Retorna função stop(). */
export function renderLoop(callback) {
  let raf = 0;
  let running = true;
  const clock = new THREE.Clock();

  const tick = () => {
    if (!running) return;
    callback(clock.getElapsedTime(), clock.getDelta());
    raf = requestAnimationFrame(tick);
  };

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      clock.getDelta(); // descarta o tempo ocioso
      raf = requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  raf = requestAnimationFrame(tick);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

export function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((m) => m.dispose());
    }
  });
}
