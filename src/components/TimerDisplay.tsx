type TimerDisplayProps = {
  remainingMs: number;
};

function formatMmSs(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerDisplay({ remainingMs }: TimerDisplayProps) {
  return (
    <p className="font-mono text-7xl font-semibold tracking-tight tabular-nums text-slate-900">
      {formatMmSs(remainingMs)}
    </p>
  );
}
