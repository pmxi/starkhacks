import { useEffect, useRef, useState } from 'react';
import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { createPoseLandmarker } from '../../lib/detector';
import { PushupCounter } from '../../lib/counter';
import { OneEuroFilter } from '../../lib/oneEuro';
import { angleDeg, L } from '../../lib/angles';

interface Props {
  onRep: () => void;
  gameEnded: boolean;
  gameType: string;
}

// Skeleton edges to draw
const EDGES: [number, number][] = [
  [L.LS, L.LE], [L.LE, L.LW],
  [L.RS, L.RE], [L.RE, L.RW],
  [L.LS, L.RS],
  [L.LS, L.LH], [L.RS, L.RH],
  [L.LH, L.RH],
  [L.LH, L.LA], [L.RH, L.RA],
];

const JOINT_DOTS = [L.LS, L.RS, L.LE, L.RE, L.LW, L.RW, L.LH, L.RH, L.LA, L.RA];

function drawSkeleton(ctx: CanvasRenderingContext2D, lm: NormalizedLandmark[], w: number, h: number) {
  ctx.strokeStyle = '#b794f6';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#b794f6';
  ctx.shadowBlur = 6;

  for (const [a, b] of EDGES) {
    const p1 = lm[a], p2 = lm[b];
    if (!p1 || !p2) continue;
    ctx.beginPath();
    // mirror x because video is flipped
    ctx.moveTo((1 - p1.x) * w, p1.y * h);
    ctx.lineTo((1 - p2.x) * w, p2.y * h);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  for (const idx of JOINT_DOTS) {
    const p = lm[idx];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc((1 - p.x) * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

export default function WorkoutCamera({ onRep, gameEnded, gameType }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const counterRef = useRef(new PushupCounter());
  const leftFilter = useRef(new OneEuroFilter());
  const rightFilter = useRef(new OneEuroFilter());
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (gameType.toLowerCase() !== 'pushup') {
      setStatus('error');
      setErrorMsg(`AI tracking only supports Pushup mode (current: ${gameType})`);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const landmarker = await createPoseLandmarker();
        if (cancelled) { landmarker.close(); return; }
        landmarkerRef.current = landmarker;

        // Match canvas to video
        const canvas = canvasRef.current!;
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        setStatus('ready');
        startLoop();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Camera unavailable');
        }
      }
    }

    function startLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker) return;

      const ctx = canvas.getContext('2d')!;

      function loop() {
        if (cancelled) return;
        rafRef.current = requestAnimationFrame(loop);

        if (video.readyState < 2) return;

        // Sync canvas size if video dimensions changed
        if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const w = canvas.width;
        const h = canvas.height;
        const tMs = performance.now();

        ctx.clearRect(0, 0, w, h);

        const result = landmarker.detectForVideo(video, tMs);
        const lm = result.landmarks[0];
        if (!lm) return;

        drawSkeleton(ctx, lm, w, h);

        if (gameEnded) return;

        // Validate visibility of arm landmarks
        const required = [L.LS, L.RS, L.LE, L.RE, L.LW, L.RW];
        const visOk = required.every(i => {
          const p = lm[i];
          return p && (p.visibility ?? 1) > 0.65 && p.x > 0.02 && p.x < 0.98 && p.y > 0.02 && p.y < 0.98;
        });

        const tSec = tMs / 1000;
        const leftAngle = leftFilter.current.filter(
          angleDeg(lm[L.LS], lm[L.LE], lm[L.LW]), tSec
        );
        const rightAngle = rightFilter.current.filter(
          angleDeg(lm[L.RS], lm[L.RE], lm[L.RW]), tSec
        );
        const elbowAngle = Math.min(leftAngle, rightAngle);

        const prevCount = counterRef.current.count;
        counterRef.current.update(elbowAngle, visOk, tMs);
        if (counterRef.current.count > prevCount) {
          onRep();
        }
      }

      loop();
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync gameEnded into the loop via ref closure — no restart needed
  const gameEndedRef = useRef(gameEnded);
  gameEndedRef.current = gameEnded;

  return (
    <div className="relative w-full rounded-[24px] overflow-hidden bg-black/40 border border-white/10" style={{ aspectRatio: '16/9' }}>
      {/* Mirrored video */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      {/* Skeleton canvas overlay — NOT mirrored (drawSkeleton flips x coords) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-[#b794f6]/30 border-t-[#b794f6] rounded-full animate-spin" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Loading AI model...</p>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-4 text-center">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{errorMsg}</p>
        </div>
      )}

      {/* Corner label */}
      {status === 'ready' && (
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#b794f6] animate-pulse" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">AI Tracking Live</span>
        </div>
      )}
    </div>
  );
}
