import { useEffect } from "react";
import { BreakScreen } from "./components/BreakScreen";
import { TimerDisplay } from "./components/TimerDisplay";
import { formatMmSs } from "./lib/formatDuration";
import {
  DEMO_DURATION_MS,
  WORK_DURATION_MS,
  useWorkTimer,
} from "./hooks/useWorkTimer";

const APP_TITLE = "MoveBreak AI";

export default function App() {
  const timer = useWorkTimer();

  useEffect(() => {
    return () => {
      document.title = APP_TITLE;
    };
  }, []);

  useEffect(() => {
    if (timer.mode === "working") {
      document.title = `${formatMmSs(timer.remainingMs)} · ${APP_TITLE}`;
      return;
    }
    if (timer.mode === "break") {
      document.title = `Break · ${APP_TITLE}`;
      return;
    }
    document.title = APP_TITLE;
  }, [timer.mode, timer.remainingMs]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-100 px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-8 py-12 shadow-sm">
        {timer.mode === "break" ? (
          <BreakScreen onBack={timer.stop} endedWhileAway={timer.endedWhileAway} />
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

  let status = "Ready when you are";
  if (!timer.hydrated) {
    status = "Restoring your session…";
  } else if (isWorking) {
    if (isDemo) {
      status = timer.resumed ? "Demo session resumed" : "Demo session in progress";
    } else {
      status = timer.resumed ? "Work session resumed" : "Work session in progress";
    }
  }

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">MoveBreak AI</h1>
        <p className="text-sm text-slate-500" role="status">
          {status}
        </p>
      </div>

      <TimerDisplay remainingMs={timer.hydrated ? timer.remainingMs : null} />

      {!isWorking && (
        <div className="flex gap-2">
          <DurationButton
            selected={isDemo}
            disabled={!timer.hydrated}
            onClick={() => timer.setDurationMs(DEMO_DURATION_MS)}
          >
            Demo 10s
          </DurationButton>
          <DurationButton
            selected={!isDemo}
            disabled={!timer.hydrated}
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
          disabled={!timer.hydrated}
          className="rounded-xl bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start
        </button>
      )}

      {!isWorking && (
        <button
          type="button"
          onClick={timer.goToBreak}
          disabled={!timer.hydrated}
          className="text-sm text-slate-400 underline underline-offset-4 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Preview break screen (temporary)
        </button>
      )}
    </section>
  );
}

function DurationButton({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={
        selected
          ? "rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          : "rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}
