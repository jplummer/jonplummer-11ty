/**
 * DR + default color presets for the gallery and any future full-page color lab (single source of truth).
 * @see docs/colors.md
 */
'use strict';

const presets = {
  default: {
    '--text-color': '#2a2d32',
    '--text-color-light': '#5c6169',
    '--background-color': '#f1f3f7',
    '--content-background-color': '#fff',
    '--link-color': '#d63d36',
    '--link-hover-color': '#b26205',
    '--link-visited-color': '#4a4f57',
    '--link-active-color': '#0d703f',
    '--border-color': '#d8dce3'
  },
  DR01: {
    '--text-color': '#261201',
    '--text-color-light': '#736356',
    '--background-color': '#bfb1a8',
    '--content-background-color': '#fff',
    '--link-color': '#ad1d1d',
    '--link-hover-color': '#736356',
    '--link-visited-color': '#261201',
    '--link-active-color': '#ad1d1d',
    '--border-color': '#aab7bf'
  },
  DR02: {
    '--text-color': '#0d0000',
    '--text-color-light': '#3a3124',
    '--background-color': '#b9ada4',
    '--content-background-color': '#fff',
    '--link-color': '#84754a',
    '--link-hover-color': '#3a3124',
    '--link-visited-color': '#96937d',
    '--link-active-color': '#84754a',
    '--border-color': '#96937d'
  },
  DR03: {
    '--text-color': '#5f503e',
    '--text-color-light': '#9c9c9c',
    '--background-color': '#e1e4e1',
    '--content-background-color': '#fff',
    '--link-color': '#bf7c2a',
    '--link-hover-color': '#c09c6f',
    '--link-visited-color': '#5f503e',
    '--link-active-color': '#bf7c2a',
    '--border-color': '#9c9c9c'
  },
  DR04: {
    '--text-color': '#372e2d',
    '--text-color-light': '#84764b',
    '--background-color': '#dbd7d3',
    '--content-background-color': '#fff',
    '--link-color': '#84764b',
    '--link-hover-color': '#b7b183',
    '--link-visited-color': '#372e2d',
    '--link-active-color': '#84764b',
    '--border-color': '#bcb3a6'
  },
  DR05: {
    '--text-color': '#3b4b59',
    '--text-color-light': '#bfa07a',
    '--background-color': '#d9c3b0',
    '--content-background-color': '#fff',
    '--link-color': '#af2e1b',
    '--link-hover-color': '#cc6324',
    '--link-visited-color': '#3b4b59',
    '--link-active-color': '#af2e1b',
    '--border-color': '#bfa07a'
  },
  DR06: {
    '--text-color': '#736b1e',
    '--text-color-light': '#bf1b1b',
    '--background-color': '#d9d2c6',
    '--content-background-color': '#fff',
    '--link-color': '#ed3f1c',
    '--link-hover-color': '#ed8008',
    '--link-visited-color': '#736b1e',
    '--link-active-color': '#ed3f1c',
    '--border-color': '#d9d2c6'
  },
  DR06a: {
    '--text-color': '#736b1e',
    '--text-color-light': '#bf1b1b',
    '--background-color': '#dadccf',
    '--content-background-color': '#fff',
    '--link-color': '#ed3f1c',
    '--link-hover-color': '#ed8008',
    '--link-visited-color': '#736b1e',
    '--link-active-color': '#ed3f1c',
    '--border-color': '#dadccf'
  },
  DR07: {
    '--text-color': '#292a2e',
    '--text-color-light': '#50474c',
    '--background-color': '#bebab0',
    '--content-background-color': '#fff',
    '--link-color': '#ae2f25',
    '--link-hover-color': '#e15e3e',
    '--link-visited-color': '#315b7b',
    '--link-active-color': '#ae2f25',
    '--border-color': '#50474c'
  },
  DR08: {
    '--text-color': '#a43f14',
    '--text-color-light': '#9a9a9a',
    '--background-color': '#bebab0',
    '--content-background-color': '#fff',
    '--link-color': '#bd7033',
    '--link-hover-color': '#d8a367',
    '--link-visited-color': '#a43f14',
    '--link-active-color': '#bd7033',
    '--border-color': '#9a9a9a'
  },
  DR09: {
    '--text-color': '#40341f',
    '--text-color-light': '#8b8178',
    '--background-color': '#d9cab8',
    '--content-background-color': '#fff',
    '--link-color': '#c5441f',
    '--link-hover-color': '#f07032',
    '--link-visited-color': '#40341f',
    '--link-active-color': '#c5441f',
    '--border-color': '#8b8178'
  },
  DR10: {
    '--text-color': '#5b4a3b',
    '--text-color-light': '#5b4a3b',
    '--background-color': '#d3d8d2',
    '--content-background-color': '#fff',
    '--link-color': '#e6423a',
    '--link-hover-color': '#f1b73a',
    '--link-visited-color': '#5b4a3b',
    '--link-active-color': '#0d703f',
    '--border-color': '#d3d8d2'
  },
  DR10a: {
    '--text-color': '#2a2a2a',
    '--text-color-light': '#5a5a5a',
    '--background-color': '#d3d8d2',
    '--content-background-color': '#fff',
    '--link-color': '#d63d36',
    '--link-hover-color': '#b26205',
    '--link-visited-color': '#5b4a3b',
    '--link-active-color': '#0d703f',
    '--border-color': '#d0d0d0'
  }
};

module.exports = () => ({ presets });
