import { BreakScreen } from "./components/BreakScreen";
import { TimerDisplay } from "./components/TimerDisplay";
import {
  DEMO_DURATION_MS,
  WORK_DURATION_MS,
  useWorkTimer,
} from "./hooks/useWorkTimer";

export default function App() {
  const timer = useWorkTimer();

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-8 py-12 shadow-sm">
        {timer.mode === "break" ? (
          <BreakScreen onBack={timer.stop} />
        ) : (
          <IdleWorkingShell timer={timer} />
        )}
      </div>
    </main>
  );
}

type IdleWorkingShellProps = {
  timer: ReturnType<typeof useWorkTimer>;
};

function IdleWorkingShell({ timer }: IdleWorkingShellProps) {
  const isWorking = timer.mode === "working";
  const isDemo = timer.durationMs === DEMO_DURATION_MS;

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">MoveBreak AI</h1>
        <p className="text-sm text-slate-500">
          {isWorking
            ? isDemo
              ? "Demo session in progress"
              : "Work session in progress"
            : "Ready when you are"}
        </p>
      </div>

      <TimerDisplay remainingMs={timer.remainingMs} />

      {!isWorking && (
        <div className="flex gap-2">
          <DurationButton
            selected={isDemo}
            onClick={() => timer.setDurationMs(DEMO_DURATION_MS)}
          >
            Demo 10s
          </DurationButton>
          <DurationButton
            selected={!isDemo}
            onClick={() => timer.setDurationMs(WORK_DURATION_MS)}
          >
            45 min
          </DurationButton>
        </div>
      )}

      {isWorking ? (
        <button
          type="button"
          onClick={timer.stop}
          className="rounded-xl bg-slate-800 px-8 py-3 text-base font-medium text-white hover:bg-slate-700"
        >
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={timer.start}
          className="rounded-xl bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-500"
        >
          Start
        </button>
      )}

      {!isWorking && (
        <button
          type="button"
          onClick={timer.goToBreak}
          className="text-sm text-slate-400 underline underline-offset-4 hover:text-slate-600"
        >
          Preview break screen (temporary)
        </button>
      )}
    </section>
  );
}

function DurationButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white"
          : "rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
      }
    >
      {children}
    </button>
  );
}
