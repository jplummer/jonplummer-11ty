#!/usr/bin/env node

/**
 * Spinner Utilities
 * Shared spinner frames for progress indicators across the codebase.
 * Centralized here to make it easy to experiment with different spinner styles.
 */

const { spawn } = require('child_process');

const SPINNER_FRAMES = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

/**
 * Run a command with a spinner, buffering its output for the caller.
 * Resolves { code, stdout, stderr } whatever the exit code, so the caller
 * decides what a failure prints; rejects only if the command can't start.
 * The spinner line is cleared before either.
 *
 * @param {string[]} argv command and arguments (no shell)
 * @param {string} message shown beside the spinner
 * @param {{ stream?: NodeJS.WritableStream }} [options] where the spinner
 *   draws; stderr by default, so the command's stdout stays clean
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
function runWithSpinner(argv, message, { stream = process.stderr } = {}) {
  return new Promise((resolve, reject) => {
    let frame = 0;
    const timer = setInterval(() => {
      stream.write(`\r${SPINNER_FRAMES[frame]} ${message}`);
      frame = (frame + 1) % SPINNER_FRAMES.length;
    }, 100);

    let settled = false;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearInterval(timer);
      stream.write('\r\x1b[K');
      fn();
    };

    let stdout = '';
    let stderr = '';
    const child = spawn(argv[0], argv.slice(1), { stdio: ['inherit', 'pipe', 'pipe'] });
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('close', (code) => finish(() => resolve({ code, stdout, stderr })));
    child.on('error', (error) => finish(() => reject(error)));
  });
}

module.exports = {
  SPINNER_FRAMES,
  runWithSpinner
};

// Classic
// const SPIN = ['|', '/', '—', '\\'];

// Braille/dots
// const BRAILLE_1 = ['⠈', '⠐', '⠠', '⠄', '⠂', '⠁'];
// const BRAILLE_3 = ['⠋', '⠙', '⠸', '⠴', '⠦', '⠇'];
// const BRAILLE_BOUNCE = ['⠄', '⠆', '⠇', '⠋', '⠙', '⠸', '⠰', '⠠', '⠰', '⠸', '⠙', '⠋', '⠇', '⠆'];
// const BRAILLE_BOUNCE_SIMPLE = ['⠁', '⠂', '⠄', '⠂'];

// Arrows and triangles
// const TRIANGLE_ROTATE_CORNER = ['◢', '◣', '◤', '◥'];
// const TRIANGLE_HOLLOW = ['▹', '▿', '◃', '▵'];
// const TRIANGLE_SPIN_DIAGONAL = ['◤', '⟋', '◢', ' '];
// const TRIANGLE_SPIN_DOUBLE_DIAGONAL = ['◤', '⟋', '◢', ' ', '◥', '⟍', '◣', ' '];

// Circles
// const CIRCLE_RING = ['○', '◎', '◉', '●', '◉', '◎'];
// const CIRCLE_PULSE = ['·', '•', '●', '•'];
// const CIRCLE_FLIP = ['◠', '◯', '◡', ' '];
// const CIRCLE_FLIP2 = ['◯', '◒', '●', '◓'];

// Arcs
// const ARC_SPIN = ['◜', '◝', '◞', '◟'];

// Squares
// const SQUARE_SPIN_HORIZ = ['□', '◧', '■', '◨'];

// Box drawing
// const CORNER_ROTATE = ['┌', '┐', '┘', '└'];
// const TEE_ROTATE = ['┴', '├', '┬', '┤'];
// const CROSS_ROTATE = ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'];
// const CROSS_SPIN_HORIZ = ['┤', '┼', '├', '│'];

// Blocks/Progress bars
// const BLOCK_SMEAR_ROTATE = ['▙', '▌', '▛', '▀', '▜', '▐', '▟', '▄'];
// const BLOCK_SNAKE_ROTATE = ['▙', '▌', '▘', '▀', '▜', '▐', '▗', '▄'];

// Stars
// const STAR_PULSE = ['✶', '✷', '✹', '✷'];
// const STAR_PULSE_EXTENDED = ['✶', '✸', '✹', '✺', '✹', '✷'];
// const STAR_PULSE_EXTENDED_PLUS = ['✶', '✷', '✸', '✹', '✺', '✹', '✸', '✷'];
// const ASTERISK_VAR = ['*', '+', '×', '✻'];
// const TWINKLE = ['·', '⁖', '⁘', '✧', '⁘', '⁖'];
// const STAR_BEAT = ['✺', '✹', '✷', '✻', '✽', '✾', '❈', '❉'];
// const CLAUDE_SPARK = ["·", "✻", "✽", "✶", "✳", "✢"];

// Math symbols
// const EQUAL_GROW = ['-', '=', '≡', '≣', '≡', '='];

// I Ching
// const ICHING_SPIN_1 = ['☱', '☲', '☴'];
// const ICHING_SPIN_2 = ['☱', '☳', '☶', '☴', '☱', '☲', '☴'];
// const ICHING_SPIN_3 = ['☱', '☳', '☷', '☶', '☴'];
// const ICHING_ALL = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

// Geometric morphing
// const DIAMOND_PULSE = ['◇', '◈', '◆', '◈'];
// const DIAMOND_SPIN = ['◇', '⟐', '◆', '⟐'];
// const HEXAGON_MORPH = ['⬡', '⬢', '⬡', '⬡'];

// Typography
// const ELLIPSIS = ['.  ', '.. ', '...', ' ..', '  .', '   '];
// const BOUNCE_DOT = ['⠁', '⠂', '⠄', '⠠', '⠄', '⠂'];
// const TILDE_WAVE = ['~', '∼', '≈', '∽', '≈', '∼'];

// Emoji
// const EMOJI_RAINBOW = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤'];
// const EMOJI_CLOCK = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
// const EMOJI_MOON = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
// const EMOJI_EARTH = ['🌍', '🌎', '🌏'];
// const EMOJI_VOLCANO = ['🏔️', '⛰️', '🌋', '🗻'];
// const EMOJI_HAND = ['✋', '☝️', '✌️', '🤞', '🤘', '🤟', '🖖', '🖐️'];
// const EMOJI_SLOTS = ['7️⃣', '🔔', '🏇', '🍒', '🍋', '💎', '👑', '🍑', '🪙', '🍉', '💰', '🍀', '🍊', '🀰'];
