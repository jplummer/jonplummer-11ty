#!/usr/bin/env node

/**
 * Spinner Utilities
 * 
 * Shared spinner frames for progress indicators across the codebase.
 * Centralized here to make it easy to experiment with different spinner styles.
 */

/**
 * Braille spinner frames - smooth, accessible animation
 * These are Unicode braille characters that create a rotating effect
 */
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Alternative spinner styles (for experimentation)
 * Uncomment and use SPINNER_FRAMES_* to try different styles
 */

// Classic dots
// const SPINNER_FRAMES_DOTS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Simple dots
// const SPINNER_FRAMES_SIMPLE = ['.', '..', '...', '   '];

// Arrows
// const SPINNER_FRAMES_ARROWS = ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'];

// Bars
// const SPINNER_FRAMES_BARS = ['▁', '▃', '▅', '▇', '█', '▇', '▅', '▃'];

module.exports = {
  SPINNER_FRAMES
};
