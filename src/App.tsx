import { useState } from "react";
import { BreakScreen } from "./components/BreakScreen";
import { TimerDisplay } from "./components/TimerDisplay";

const DEFAULT_DURATION_MS = 45 * 60 * 1000;

type AppMode = "idle" | "working" | "break";

export default function App() {
  const [mode, setMode] = useState<AppMode>("idle");

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-8 py-12 shadow-sm">
        {mode === "break" ? (
          <BreakScreen onBack={() => setMode("idle")} />
        ) : (
          <IdleWorkingShell mode={mode} onChangeMode={setMode} />
        )}
      </div>
    </main>
  );
}

function IdleWorkingShell({
  mode,
  onChangeMode,
}: {
  mode: "idle" | "working";
  onChangeMode: (mode: AppMode) => void;
}) {
  const isWorking = mode === "working";

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">MoveBreak AI</h1>
        <p className="text-sm text-slate-500">
          {isWorking ? "Work session in progress" : "Ready when you are"}
        </p>
      </div>

      <TimerDisplay remainingMs={DEFAULT_DURATION_MS} />

      {isWorking ? (
        <button
          type="button"
          onClick={() => onChangeMode("idle")}
          className="rounded-xl bg-slate-800 px-8 py-3 text-base font-medium text-white hover:bg-slate-700"
        >
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onChangeMode("working")}
          className="rounded-xl bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-500"
        >
          Start
        </button>
      )}

      <button
        type="button"
        onClick={() => onChangeMode("break")}
        className="text-sm text-slate-400 underline underline-offset-4 hover:text-slate-600"
      >
        Preview break screen (temporary)
      </button>
    </section>
  );
}
