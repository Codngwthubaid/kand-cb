/** Date / time formatting helpers. */

export function formatClockTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function formatFullDateTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

/** "Just now" / "5 min ago" / "1 hour ago" / "Today" / date. */
export function relativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;
  if (diff < 0) return "Just now";
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `${m} min ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    if (h < 1) return "Just now";
    // Same calendar day → "Today", else "N hours ago" for recent.
    const sameDay =
      new Date(timestamp).toDateString() === new Date(now).toDateString();
    if (sameDay && h >= 5) return "Today";
    return h === 1 ? "1 hour ago" : `${h} hours ago`;
  }
  const days = Math.floor(diff / day);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  try {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
