type BreakScreenProps = {
  onBack: () => void;
};

export function BreakScreen({ onBack }: BreakScreenProps) {
  return (
    <section className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-700">
        Break time
      </p>
      <h1 className="text-3xl font-semibold text-slate-900">Time to move</h1>
      <p className="text-base text-slate-600">
        Stand in front of the camera and follow the exercise. Pose detection
        will confirm that you actually moved.
      </p>
      <div className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-slate-500">
        Camera / pose detection will appear here
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-800"
      >
        Back to timer
      </button>
    </section>
  );
}
