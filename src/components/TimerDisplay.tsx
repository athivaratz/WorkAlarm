import { formatMmSs } from "../lib/formatDuration";

type TimerDisplayProps = {
  remainingMs: number | null;
};

export function TimerDisplay({ remainingMs }: TimerDisplayProps) {
  return (
    <p className="font-mono text-7xl font-semibold tracking-tight tabular-nums text-slate-900">
      {remainingMs == null ? "--:--" : formatMmSs(remainingMs)}
    </p>
  );
}
