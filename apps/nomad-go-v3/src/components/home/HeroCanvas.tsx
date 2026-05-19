import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';

interface Blob {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  cr: [number, number, number];
}

const BLOB_COLORS: [number, number, number][] = [
  [180, 240, 210], // mint
  [210, 235, 255], // sky blue
  [255, 235, 200], // peach
  [230, 210, 255], // lavender
  [200, 240, 222], // seafoam
  [255, 220, 200], // warm peach
];

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const blobs: Blob[] = BLOB_COLORS.map((cr, i) => ({
      x: w * (0.15 + (i % 3) * 0.25 + Math.random() * 0.1),
      y: h * (0.3 + Math.floor(i / 3) * 0.3 + Math.random() * 0.1),
      r: 50 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.3,
      cr,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#F5F3EE';
      ctx.fillRect(0, 0, w, h);

      for (const blob of blobs) {
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < -blob.r) blob.x = w + blob.r;
        if (blob.x > w + blob.r) blob.x = -blob.r;
        if (blob.y < -blob.r) blob.y = h + blob.r;
        if (blob.y > h + blob.r) blob.y = -blob.r;
      }

      // Draw each blob
      for (const blob of blobs) {
        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        grad.addColorStop(0, `rgba(${blob.cr[0]},${blob.cr[1]},${blob.cr[2]},0.52)`);
        grad.addColorStop(1, `rgba(${blob.cr[0]},${blob.cr[1]},${blob.cr[2]},0)`);
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw merge blobs at intersections
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const a = blobs[i];
          const b = blobs[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < (a.r + b.r) * 0.82) {
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const mr = (a.r + b.r) * 0.35;
            const mixR = Math.round((a.cr[0] + b.cr[0]) / 2);
            const mixG = Math.round((a.cr[1] + b.cr[1]) / 2);
            const mixB = Math.round((a.cr[2] + b.cr[2]) / 2);
            const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
            mGrad.addColorStop(0, `rgba(${mixR},${mixG},${mixB},0.45)`);
            mGrad.addColorStop(1, `rgba(${mixR},${mixG},${mixB},0)`);
            ctx.beginPath();
            ctx.arc(mx, my, mr, 0, Math.PI * 2);
            ctx.fillStyle = mGrad;
            ctx.fill();
          }
        }
      }

      // Bottom fade overlay
      const fadeGrad = ctx.createLinearGradient(0, h * 0.58, 0, h);
      fadeGrad.addColorStop(0, 'rgba(245,243,238,0)');
      fadeGrad.addColorStop(1, 'rgba(245,243,238,1)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, h * 0.58, w, h * 0.42);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      w = canvas.offsetWidth;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-[260px] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center text-center gap-3"
        >
          <span className="ng-pill bg-ng-dim text-ng border border-ng-border">
            📍 Ulaanbaatar, Mongolia
          </span>
          <h1 className="font-display text-[32px] leading-[1.1] font-black text-ng-tx">
            Discover{' '}
            <em className="italic text-ng">Mongolia</em>
          </h1>
          <p className="text-[13px] text-[var(--mu)] max-w-[260px] leading-relaxed">
            Complete quests, earn XP, and unlock the hidden gems of the steppe.
          </p>
          <div className="flex gap-2 mt-1">
            <button onClick={() => navigate('/quests')} className="ng-btn-primary text-sm px-5 py-2.5 shadow-lg shadow-ng/20">
              Start Adventure
            </button>
            <button onClick={() => navigate('/map')} className="ng-btn-secondary text-sm px-5 py-2.5">
              View Map
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
