export type PushupState = 'unknown' | 'up' | 'down';

export interface CounterConfig {
  downThreshold: number;
  upThreshold: number;
  minCycleMs: number;
}

export const DEFAULT_CONFIG: CounterConfig = {
  downThreshold: 90,
  upThreshold: 160,
  minCycleMs: 400,
};

export class PushupCounter {
  count = 0;
  private state: PushupState = 'unknown';
  private lastTransitionMs = 0;
  private readonly cfg: CounterConfig;

  constructor(cfg: CounterConfig = DEFAULT_CONFIG) {
    this.cfg = cfg;
  }

  update(elbowAngle: number, visibilityOk: boolean, tMs: number): void {
    if (!visibilityOk || Number.isNaN(elbowAngle)) {
      this.state = 'unknown';
      return;
    }

    const { downThreshold, upThreshold, minCycleMs } = this.cfg;

    if (this.state === 'unknown' && elbowAngle > upThreshold) {
      this.state = 'up';
      this.lastTransitionMs = tMs;
      return;
    }

    if (this.state !== 'down' && elbowAngle < downThreshold) {
      this.state = 'down';
      this.lastTransitionMs = tMs;
      return;
    }

    if (this.state === 'down' && elbowAngle > upThreshold) {
      if (tMs - this.lastTransitionMs >= minCycleMs) {
        this.count += 1;
      }
      this.state = 'up';
      this.lastTransitionMs = tMs;
    }
  }

  getState(): PushupState {
    return this.state;
  }

  reset(): void {
    this.count = 0;
    this.state = 'unknown';
    this.lastTransitionMs = 0;
  }
}
