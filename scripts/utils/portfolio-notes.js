'use strict';

const fs = require('fs');

/**
 * Parse portfolio speaker-notes text (same formats as convert-pdf-pages-with-notes).
 *
 * Formats:
 * 1. Numbered: "1: note" or "Slide 1: note" — one line per slide; empty notes allowed ("2: ")
 * 2. Blank-line separated blocks (multi-line within a slide joins with spaces)
 * 3. Sequential: one non-blank line per note (only if not detected as numbered)
 *
 * Numbered detection uses the first non-empty line.
 *
 * @param {string} content
 * @returns {string[]}
 */
function parseNotesContent(content) {
  const lines = content.split(/\r?\n/);
  const numberedPattern = /^(?:slide\s+)?(\d+)[:.)]\s*(.*)$/i;

  const firstNonEmpty = lines.map((l) => l.trim()).find((t) => t !== '');
  if (firstNonEmpty !== undefined && numberedPattern.test(firstNonEmpty)) {
    const notesByNumber = {};
    lines.forEach((line) => {
      const match = line.trim().match(numberedPattern);
      if (match) {
        const slideNum = parseInt(match[1], 10);
        const noteText = match[2].trim();
        notesByNumber[slideNum] = noteText;
      }
    });
    const maxSlide = Math.max(...Object.keys(notesByNumber).map(Number), 0);
    const notes = [];
    for (let i = 1; i <= maxSlide; i += 1) {
      notes.push(notesByNumber[i] !== undefined ? notesByNumber[i] : '');
    }
    return notes;
  }

  const notes = [];
  let currentNote = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      if (currentNote.length > 0) {
        notes.push(currentNote.join(' ').trim());
        currentNote = [];
      }
    } else {
      currentNote.push(trimmed);
    }
  }

  if (currentNote.length > 0) {
    notes.push(currentNote.join(' ').trim());
  }

  return notes;
}

/**
 * @param {string} notesPath
 * @returns {string[]}
 */
function parseNotesFile(notesPath) {
  const content = fs.readFileSync(notesPath, 'utf8');
  return parseNotesContent(content);
}

module.exports = {
  parseNotesContent,
  parseNotesFile,
};
