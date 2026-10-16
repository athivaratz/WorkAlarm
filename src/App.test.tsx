import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import { DEMO_DURATION_MS } from "./hooks/useWorkTimer";
import { readWorkSession, writeWorkSession } from "./lib/workSessionStore";

async function waitUntilReady() {
  await waitFor(() => {
    expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
}

describe("App session resume", () => {
  it("saves a demo session and restores it after the page is opened again", async () => {
    const first = render(<App />);
    await waitUntilReady();

    fireEvent.click(screen.getByRole("button", { name: "Demo 10s" }));
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByRole("button", { name: "Stop" })).toBeTruthy();
    expect(screen.getByText("Demo session in progress")).toBeTruthy();
    expect(document.title).toMatch(/^\d{2}:\d{2} · MoveBreak AI$/);

    await waitFor(async () => {
      expect(await readWorkSession()).toMatchObject({
        phase: "working",
        durationMs: DEMO_DURATION_MS,
      });
    });

    const saved = await readWorkSession();
    if (saved == null || saved.phase !== "working") {
      throw new Error("Expected a working session to be saved");
    }
    await writeWorkSession({
      ...saved,
      targetAt: Date.now() + 8_000,
    });

    first.unmount();
    render(<App />);

    expect(await screen.findByText("Demo session resumed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop" })).toBeTruthy();
    expect(document.title).toMatch(/^\d{2}:\d{2} · MoveBreak AI$/);
  });

  it("shows a session that ended while the page was closed until the user goes back", async () => {
    await writeWorkSession({
      version: 1,
      phase: "working",
      targetAt: Date.now() - 1_000,
      durationMs: DEMO_DURATION_MS,
    });

    const first = render(<App />);
    expect(
      await screen.findByText("Your work session ended while this page was closed."),
    ).toBeTruthy();
    expect(document.title).toBe("Break · MoveBreak AI");

    await waitFor(async () => {
      expect(await readWorkSession()).toMatchObject({
        phase: "break",
        endedWhileAway: true,
      });
    });

    first.unmount();
    render(<App />);
    expect(
      await screen.findByText("Your work session ended while this page was closed."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back to timer" }));
    expect(await screen.findByRole("button", { name: "Start" })).toBeTruthy();
    expect(screen.getByText("00:10")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Demo 10s" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    await waitFor(async () => {
      expect(await readWorkSession()).toBeNull();
    });
    expect(document.title).toBe("MoveBreak AI");
  });

  it("previews the break screen without marking the session as missed", async () => {
    render(<App />);
    await waitUntilReady();
    fireEvent.click(screen.getByRole("button", { name: "Preview break screen (temporary)" }));

    expect(await screen.findByRole("heading", { name: "Time to move" })).toBeTruthy();
    expect(screen.queryByText("Your work session ended while this page was closed.")).toBeNull();
    expect(await readWorkSession()).toBeNull();
  });
});
