# MoveBreak AI — Project Docs

เว็บแอปสำหรับเตือนผู้ใช้ให้พักจากการนั่งเป็นเวลานาน และใช้กล้อง Webcam + MediaPipe Pose Landmarker ตรวจว่าผู้ใช้ทำท่าหรือการเคลื่อนไหวที่กำหนดจริงก่อนจบช่วงพัก

> เป้าหมายของ V1 คือ “ทำแกนหลักให้ใช้ได้จริง” ไม่ใช่สร้างผลิตภัณฑ์ระดับ production

## Core Flow

```text
Start App
  ↓
Set / Start 45-minute work timer
  ↓
Time is up
  ↓
Alarm + Break Screen
  ↓
Open Webcam
  ↓
MediaPipe detects body landmarks
  ↓
Exercise Engine evaluates movement
  ↓
Hold / repeat until completed
  ↓
Stop alarm
  ↓
Save local break record
  ↓
Start next timer
```

## V1 Technology Stack

| Part | Technology |
|---|---|
| Web UI | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Webcam | `navigator.mediaDevices.getUserMedia()` |
| Pose AI | MediaPipe Pose Landmarker (`@mediapipe/tasks-vision`) |
| Skeleton Overlay | Canvas 2D |
| Timer | Timestamp-based JavaScript |
| Alarm | Web Audio API |
| Notification | Notification API |
| PWA | Optional in late V1 |
| Local Data | IndexedDB |
| CV Processing | On-device / in browser |
| Backend | None |
| Database / Login | None in V1 |
| YOLO | Not needed |
| OpenCV.js | Not needed |

## Important Scope Rule

Cursor may adjust internal implementation details when needed, but it should preserve these core principles:

1. No backend in V1.
2. Pose inference runs locally in the browser.
3. Timer must be timestamp-based, not just decrementing a number every second.
4. Alarm inside the app stops when the exercise is completed, or via a clearly labeled emergency skip.
5. Keep the code understandable for a school project.
6. Avoid unnecessary abstraction or enterprise-style architecture.
7. Prioritize a working demo over feature count.

## Documents

- `docs/01_PROJECT_HANDOFF.md` — project context and goals
- `docs/02_REQUIREMENTS.md` — functional / non-functional requirements
- `docs/03_ARCHITECTURE.md` — architecture, modules, data flow
- `docs/04_EXERCISE_ENGINE_SPEC.md` — MediaPipe landmarks and movement logic
- `docs/05_45_MINUTE_TASK_PLAN.md` — implementation plan split into ~45 minute tasks
- `docs/06_TEST_PLAN.md` — practical testing checklist
- `docs/07_CURSOR_MASTER_PROMPT.md` — prompt for a fresh Cursor chat
- `docs/08_SCHOOL_REPORT_NOTES.md` — wording for school report / presentation

## Suggested Project Name

**MoveBreak AI**

Alternative names:
- PostureBreak
- BreakMotion
- Move45
- ActiveBreak AI
