#!/usr/bin/env node
/**
 * Dual APCA Lc: sRGB-gamut and Display P3–gamut (APCA-W3 sRGBtoY / displayP3toY).
 * Inputs may be CSS strings or culori color objects (e.g. { mode: 'oklch', ... }).
 */

const { parse, toGamut } = require('culori');
const { sRGBtoY, displayP3toY, APCAcontrast } = require('apca-w3');

function toCuloriColor(input) {
  if (input == null) {
    return null;
  }
  if (typeof input === 'string') {
    return parse(input.trim());
  }
  if (typeof input === 'object' && input.mode) {
    return input;
  }
  return null;
}

function srgb255FromColor(color) {
  if (!color) {
    return null;
  }
  const rgb = toGamut('rgb')(color);
  if (!rgb || rgb.mode !== 'rgb') {
    return null;
  }
  return [
    Math.round(Math.min(255, Math.max(0, rgb.r * 255))),
    Math.round(Math.min(255, Math.max(0, rgb.g * 255))),
    Math.round(Math.min(255, Math.max(0, rgb.b * 255)))
  ];
}

/** Display P3 tuples for apca-w3: 0–1 per channel (not 8-bit). */
function p301FromColor(color) {
  if (!color) {
    return null;
  }
  const p3 = toGamut('p3')(color);
  if (!p3 || p3.mode !== 'p3') {
    return null;
  }
  return [
    Math.min(1, Math.max(0, p3.r)),
    Math.min(1, Math.max(0, p3.g)),
    Math.min(1, Math.max(0, p3.b))
  ];
}

function absApcaLcSrgb(fgInput, bgInput) {
  const fg = toCuloriColor(fgInput);
  const bg = toCuloriColor(bgInput);
  if (!fg || !bg) {
    return null;
  }
  const f = srgb255FromColor(fg);
  const b = srgb255FromColor(bg);
  if (!f || !b) {
    return null;
  }
  return Math.abs(APCAcontrast(sRGBtoY(f), sRGBtoY(b)));
}

function absApcaLcP3(fgInput, bgInput) {
  const fg = toCuloriColor(fgInput);
  const bg = toCuloriColor(bgInput);
  if (!fg || !bg) {
    return null;
  }
  const f = p301FromColor(fg);
  const b = p301FromColor(bg);
  if (!f || !b) {
    return null;
  }
  return Math.abs(APCAcontrast(displayP3toY(f), displayP3toY(b)));
}

function dualApcaLc(fgInput, bgInput) {
  return {
    srgb: absApcaLcSrgb(fgInput, bgInput),
    p3: absApcaLcP3(fgInput, bgInput)
  };
}

module.exports = {
  absApcaLcSrgb,
  absApcaLcP3,
  dualApcaLc,
  toCuloriColor
};
