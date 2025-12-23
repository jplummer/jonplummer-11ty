#!/usr/bin/env node

/**
 * Spinner Utilities
 * Shared spinner frames for progress indicators across the codebase.
 * Centralized here to make it easy to experiment with different spinner styles.
 */

const SPINNER_FRAMES = ['◤', '⟋', '◢', ' '];

// Classic
// const SPIN = ['|', '/', '—', '\\'];

// Braille/dots
// const BRAILLE_1 = ['⠈', '⠐', '⠠', '⠄', '⠂', '⠁'];
// const BRAILLE_3 = ['⠋', '⠙', '⠸', '⠴', '⠦', '⠇'];
// const BRAILLE_BOUNCE = ['⠄', '⠆', '⠇', '⠋', '⠙', '⠸', '⠰', '⠠', '⠰', '⠸', '⠙', '⠋', '⠇', '⠆'];
// const BRAILLE_BOUNCE_SIMPLE = ['⠁', '⠂', '⠄', '⠂'];

// Arrows and triangles
// const ARROW_ROTATE = ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'];
// const ARROW_RANDOM = ['→', '↖', '↓', '↗', '←', '↘', '↑', '↙'];
// const ARROW_WHOOSH = ['←', '←', '↖', '↖', '↑', '↑', '↑', '↗', '↗', '→', '→', '↘', '↓', '↙'];
// const TRIANGLE_ROTATE = ['▲', '▶', '▼', '◀'];
// const TRIANGLE_ROTATE_CORNER = ['◢', '◣', '◤', '◥'];
// const TRIANGLE_HOLLOW = ['▹', '▿', '◃', '▵'];
// const TRIANGLE_SPIN_DIAGONAL = ['◤', '⟋', '◢', ' '];
// const TRIANGLE_SPIN_DOUBLE_DIAGONAL = ['◤', '⟋', '◢', ' ', '◥', '⟍', '◣', ' '];

// Circles
// const CIRCLE_RING = ['○', '◎', '◉', '●', '◉', '◎'];
// const CIRCLE_PULSE = ['·', '•', '●', '•'];
// const CIRCLE_FLIP = ['◠', '⊙', '◡', ' '];

// Squares
// const SQUARE_FILL_HORIZ = ['□', '◧', '■', '◨'];

// Box drawing
// const CORNER_ROTATE = ['┌', '┐', '┘', '└'];
// const TEE_ROTATE = ['┴', '├', '┬', '┤'];
// const CROSS_ROTATE = ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'];
// const CROSS_HORIZ = ['┤', '┼', '├', '│'];

// Blocks/Progress bars
// const BLOCK_FILL = ['░', '▒', '▓', '█', '▓', '▒'];
// const BLOCK_HALF_ROTATE = ['▌', '▀', '▐', '▄'];
// const BLOCK_SMEAR_ROTATE = ['▙', '▌', '▛', '▀', '▜', '▐', '▟', '▄'];
// const BLOCK_SNAKE_ROTATE = ['▙', '▌', '▘', '▀', '▜', '▐', '▗', '▄'];
// const BLOCK_QUARTER_ROTATE = ['▖', '▘', '▝', '▗'];

// Pie/Sectors
// const PIE_HALF = ['◐', '◓', '◑', '◒'];
// const PIE_ROTATE = ['◴', '◷', '◶', '◵'];
// const PIE_ROTATE_SQUARE = ['◳', '◲', '◱', '◰'];

// Stars
// const STAR_PULSE = ['✶', '✷', '✹', '✷'];
// const STAR_PULSE_EXTENDED = ['✶', '✸', '✹', '✺', '✹', '✷'];
// const STAR_PULSE_EXTENDED_PLUS = ['✶', '✷', '✸', '✹', '✺', '✹', '✸', '✷'];
// const ASTERISK_VAR = ['*', '+', '×', '✻'];
// const TWINKLE = ['·', '⁖', '⁘', '✧', '⁘', '⁖'];
// const STAR_BEAT = ['✺', '✹', '✷', '✻', '✽', '✾', '❈', '❉'];

// Math symbols
// const EQUAL_GROW = ['-', '=', '≡', '≣', '≡', '='];

// Misc
// const ICHING_SPIN_1 = ['☱', '☲', '☴'];
// const ICHING_SPIN_2 = ['☰', '☱', '☳', '☶', '☴', '☱', '☲', '☴'];
// const ICHING_ALL = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

// Emoji
// const EMOJI_ARROW_ROTATE = ['➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '⬆️', '↗️'];
// const EMOJI_RAINBOW = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤'];
// const EMOJI_CLOCK = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
// const EMOJI_MOON = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
// const EMOJI_EARTH = ['🌍', '🌎', '🌏'];
// const EMOJI_VOLCANO = ['🏔️', '⛰️', '🌋', '🗻'];
// const EMOJI_TRAVEL = ['🌄', '🌅', '🌆', '🌇', '🌉', '🌃', '🏙️', '🌁'];
// const EMOJI_MAIL = ['📪', '📭', '📬', '📫', '📬', '📭'];
// const EMOJI_BOOK = ['📕', '📙', '📔', '📒', '📗', '📘', '📓'];
// const EMOJI_CASH = ['💷', '💶', '💵', '💵'];
// const EMOJI_BOX_PULSE = ['⏹️', '⏺️'];
// const EMOJI_FLAG_PULSE = ['🏳', '🏁', '🏴', '🏁'];
// const EMOJI_SMILE = ['🙂', '😊', '😀', '😃', '😄', '😁', '😄', '😃', '😀', '😊'];
// const EMOJI_HAND = ['✋', '☝️', '✌️', '🤞', '🤘', '🤟', '🖖', '🖐️'];
// const EMOJI_FLOWER = ['🌸', '🏵️', '🌺', '🌻', '🌼', '🍀'];
// const EMOJI_FRUIT = ['🍎', '🍊', '🍌', '🍏', '🫐', '🍇', '🍓', '🍑', '🍋', '🍐', '🍒', '🥭', '🍍', '🍉', '🥝'];
// const EMOJI_BALL = ['⚽', '🏉', '⚾', '🏀', '🥎', '🏐', '🏈', '🎾', '🎱', '🪩'];
// const EMOJI_CAR = ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐'];
// const EMOJI_SLOT = ['7️⃣', '🔔', '🏇', '🍒', '🍋', '💎', '👑', '🍑', '🪙', '🍉', '💰', '🍀', '🍊', '🀰'];

module.exports = {
  SPINNER_FRAMES
};
