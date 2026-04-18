import { createPoseLandmarker } from './detector';
import { angleDeg, L, type Vec3 } from './angles';
import { OneEuroFilter } from './oneEuro';
import { PushupCounter } from './counter';

const video = document.getElementById('video') as HTMLVideoElement;
const overlay = document.getElementById('overlay') as HTMLCanvasElement;
const countVal = document.getElementById('count-val') as HTMLSpanElement;
const stateVal = document.getElementById('state-val') as HTMLSpanElement;
const elbowVal = document.getElementById('elbow-val') as HTMLSpanElement;
const lElbowVal = document.getElementById('lelbow-val') as HTMLSpanElement;
const rElbowVal = document.getElementById('relbow-val') as HTMLSpanElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

const ctx = overlay.getContext('2d')!;

const SKELETON_EDGES: ReadonlyArray<readonly [number, number]> = [
  [L.LS, L.RS], [L.LS, L.LE], [L.LE, L.LW],
  [L.RS, L.RE], [L.RE, L.RW],
  [L.LS, L.LH], [L.RS, L.RH], [L.LH, L.RH],
  [L.LH, L.LA], [L.RH, L.RA],
];

async function initCamera(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      video.play().then(() => resolve());
    };
  });
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
}

function setStatus(msg: string): void {
  statusEl.textContent = msg;
}

async function main(): Promise<void> {
  setStatus('Requesting webcam…');
  await initCamera();
  setStatus('Loading pose model…');
  const landmarker = await createPoseLandmarker();
  setStatus('Running. Get into pushup position.');

  const leftElbowFilter = new OneEuroFilter(1.0, 0.007);
  const rightElbowFilter = new OneEuroFilter(1.0, 0.007);
  const counter = new PushupCounter();

  resetBtn.addEventListener('click', () => {
    counter.reset();
    countVal.textContent = '0';
  });

  const REQUIRED = [L.LS, L.RS, L.LE, L.RE, L.LW, L.RW];

  const loop = (): void => {
    const tMs = performance.now();
    const result = landmarker.detectForVideo(video, tMs);

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (result.landmarks.length > 0) {
      const pix = result.landmarks[0];

      // Skeleton overlay
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      for (const [a, b] of SKELETON_EDGES) {
        ctx.beginPath();
        ctx.moveTo(pix[a].x * overlay.width, pix[a].y * overlay.height);
        ctx.lineTo(pix[b].x * overlay.width, pix[b].y * overlay.height);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      for (const idx of REQUIRED) {
        const lm = pix[idx];
        ctx.beginPath();
        ctx.arc(lm.x * overlay.width, lm.y * overlay.height, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const visOk = REQUIRED.every((i) => {
        const lm = pix[i];
        const inFrame = lm.x > 0.02 && lm.x < 0.98 && lm.y > 0.02 && lm.y < 0.98;
        return inFrame && (lm.visibility ?? 0) > 0.65;
      });

      // 2D pixel landmarks scaled to image dims (aspect-ratio correct).
      // World-landmark z is model-predicted and compresses the angle range,
      // so we measure in image space where the skeleton overlay is ground truth.
      const W = overlay.width;
      const H = overlay.height;
      const p = (i: number): Vec3 => ({ x: pix[i].x * W, y: pix[i].y * H, z: 0 });
      const tSec = tMs / 1000;
      const leftElbow = leftElbowFilter.filter(angleDeg(p(L.LS), p(L.LE), p(L.LW)), tSec);
      const rightElbow = rightElbowFilter.filter(angleDeg(p(L.RS), p(L.RE), p(L.RW)), tSec);

      // For a pushup both arms move in lockstep; the deepest bend drives the
      // rep. min(left, right) counts a rep when either arm is fully bent, and
      // ignores a resting arm stuck at ~180°.
      const elbow = Math.min(leftElbow, rightElbow);

      counter.update(elbow, visOk, tMs);

      countVal.textContent = String(counter.count);
      stateVal.textContent = counter.getState();
      lElbowVal.textContent = leftElbow.toFixed(0);
      rElbowVal.textContent = rightElbow.toFixed(0);
      elbowVal.textContent = elbow.toFixed(0);
      if (!visOk) setStatus('Arms not fully visible');
      else setStatus('Tracking');
    } else {
      stateVal.textContent = '—';
      elbowVal.textContent = '—';
      lElbowVal.textContent = '—';
      rElbowVal.textContent = '—';
      setStatus('No pose detected');
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

main().catch((err) => {
  console.error(err);
  setStatus(`Error: ${err.message ?? err}`);
});
