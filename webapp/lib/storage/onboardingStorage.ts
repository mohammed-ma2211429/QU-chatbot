const KEY = "qu-schedule-planner:seenWelcome";

export function hasSeenWelcomeTour(): boolean {
  if (typeof window === "undefined") return true; // avoid flashing the tour during SSR
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeTourSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // ignore — non-critical, worst case the tour reappears next visit
  }
}
