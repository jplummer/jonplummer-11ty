#!/usr/bin/env node

/**
 * Run timing helpers
 *
 * Shared by build.js and deploy.js so their closing "finished" lines agree on
 * format. Completion time answers "when did this last go out?"; elapsed makes
 * the start time derivable from the same line.
 */

/**
 * Local wall-clock time, 12-hour, no seconds (seconds belong in elapsed).
 * Example: "Thu, Aug 13, 9:31 PM"
 */
function formatClock(date = new Date()) {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Elapsed duration. Under a minute keeps a decimal ("12.4s"); above it drops
 * to whole seconds ("1m 47s") since the fraction stops mattering.
 */
function formatElapsed(milliseconds) {
  const totalSeconds = milliseconds / 1000;

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  // Rounding can push seconds to 60 (e.g. 119.7s) — carry into minutes.
  if (seconds === 60) {
    return `${minutes + 1}m 0s`;
  }

  return `${minutes}m ${seconds}s`;
}

/**
 * The closing line itself, e.g.
 * "🕒 Deploy finished Thu, Aug 13, 9:31 PM (1m 47s)"
 */
function formatRunFinishedLine(label, startedAt, now = new Date()) {
  return `🕒 ${label} ${formatClock(now)} (${formatElapsed(now.getTime() - startedAt)})`;
}

module.exports = {
  formatClock,
  formatElapsed,
  formatRunFinishedLine,
};
