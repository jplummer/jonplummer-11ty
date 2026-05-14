#!/usr/bin/env node

/**
 * Spinner Utilities
 * Shared spinner frames for progress indicators across the codebase.
 * Centralized here to make it easy to experiment with different spinner styles.
 */

const SPINNER_FRAMES = ['◤', '⟋', '◢', ' '];

module.exports = {
  SPINNER_FRAMES
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
// const CIRCLE_FLIP = ['◠', '⊙', '◡', ' '];

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
// const ICHING_SPIN_2 = ['☰', '☱', '☳', '☶', '☴', '☱', '☲', '☴'];
// const ICHING_ALL = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

// Geometric morphing
// const DIAMOND_PULSE = ['◇', '◈', '◆', '◈'];
// const DIAMOND_SPIN = ['◇', '⟐', '◆', '⟐'];
// const HEXAGON_MORPH = ['⬡', '⬢', '⬡', '⬡'];
// const SHIELD_PULSE = ['⛨', '⛩', '⛨', ' '];

// Weather/nature
// const WAVE = ['〰', '∿', '≈', '∿'];
// const WIND = ['𝄞', '𝄡', '𝄢', '𝄡'];

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
