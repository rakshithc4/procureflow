"use client";

// Signature empty-state visual: a small rotating wireframe crate rendered
// with three.js, echoing the Package logo mark. Hand-rolled WebGL lifecycle
// (resize/intersection/visibility observers, disposal) mirrors
// shader-background.tsx for consistency across the app's two WebGL surfaces.
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CrateIcon({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2.4, 2, 2.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const group = new THREE.Group();
    const box = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const edges = new THREE.EdgesGeometry(box);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.85 }),
    );
    const fill = new THREE.Mesh(
      box,
      new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.05 }),
    );
    group.add(fill, line);
    group.rotation.set(0.5, 0.7, 0);
    scene.add(group);

    let raf = 0;
    let disposed = false;
    let visible = document.visibilityState === "visible";
    let inView = true;

    const resize = () => {
      const size = canvas.getBoundingClientRect().width || canvas.clientWidth || 48;
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    resize();

    function render() {
      raf = 0;
      if (disposed || !visible || !inView) return;
      if (!reduceMotion) {
        group.rotation.y += 0.006;
        group.rotation.x += 0.002;
      }
      renderer.render(scene, camera);
      if (!reduceMotion) raf = requestAnimationFrame(render);
    }
    render();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (raf === 0 && !disposed && visible && inView) raf = requestAnimationFrame(render);
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView && raf === 0 && !disposed && visible) raf = requestAnimationFrame(render);
    });
    intersectionObserver.observe(canvas);

    const onVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      if (visible && raf === 0 && !disposed && inView) raf = requestAnimationFrame(render);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      box.dispose();
      edges.dispose();
      line.material.dispose();
      fill.material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
