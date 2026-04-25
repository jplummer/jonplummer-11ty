/**
 * Shared color lab: optional legacy /color/ controls + style-exercise layout (when that page is enabled).
 * Expects <script type="application/json" id="color-lab-schemes"> with { "default": {...}, "DR01": {...}, ... }
 */
(function () {
  'use strict';

  const propertyToInputId = {
    '--text-color': 'custom-text-color',
    '--text-color-light': 'custom-text-color-light',
    '--background-color': 'custom-background-color',
    '--content-background-color': 'custom-content-background-color',
    '--link-color': 'custom-link-color',
    '--link-hover-color': 'custom-link-hover-color',
    '--link-visited-color': 'custom-link-visited-color',
    '--link-active-color': 'custom-link-active-color',
    '--border-color': 'custom-border-color'
  };

  function readPresets() {
    const el = document.getElementById('color-lab-schemes');
    if (!el) {
      return null;
    }
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  function applyColorScheme(schemeName, colorSchemes) {
    if (!colorSchemes) {
      return;
    }
    const scheme = colorSchemes[schemeName];
    if (!scheme) {
      return;
    }

    const root = document.documentElement;
    Object.entries(scheme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    if (schemeName !== 'custom') {
      Object.entries(scheme).forEach(([property, value]) => {
        const inputId = propertyToInputId[property];
        if (inputId) {
          const input = document.getElementById(inputId);
          if (input) {
            input.value = value;
          }
        }
      });
    }
  }

  function applyCustomColors() {
    const root = document.documentElement;
    Object.entries(propertyToInputId).forEach(([property, inputId]) => {
      const input = document.getElementById(inputId);
      if (input) {
        root.style.setProperty(property, input.value);
      }
    });
  }

  function resetColors(colorSchemes) {
    applyColorScheme('default', colorSchemes);
    const selector = document.getElementById('color-scheme-selector');
    if (selector) {
      selector.value = 'default';
    }
  }

  function wireColorPage(colorSchemes) {
    const selector = document.getElementById('color-scheme-selector');
    const applyCustomBtn = document.getElementById('apply-custom-colors');
    const resetBtn = document.getElementById('reset-colors');
    const previewBtn = document.getElementById('color-open-exercise-preview');

    if (selector) {
      selector.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          return;
        }
        applyColorScheme(e.target.value, colorSchemes);
      });
    }

    if (applyCustomBtn) {
      applyCustomBtn.addEventListener('click', () => {
        applyCustomColors();
        if (selector) {
          selector.value = 'custom';
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => resetColors(colorSchemes));
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const sel = document.getElementById('color-scheme-selector');
        const v = sel && sel.value;
        if (!v || v === 'custom') {
          return;
        }
        window.open('/color/', '_blank', 'noopener,noreferrer');
      });
    }
  }

  function bootExercisePage(colorSchemes) {
    const params = new URLSearchParams(window.location.search);
    let scheme = params.get('scheme') || 'default';
    if (!colorSchemes[scheme]) {
      scheme = 'default';
    }
    applyColorScheme(scheme, colorSchemes);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const colorSchemes = readPresets();
    if (!colorSchemes) {
      return;
    }

    if (document.getElementById('color-scheme-selector')) {
      wireColorPage(colorSchemes);
    } else if (document.querySelector('[data-color-lab-exercise]')) {
      bootExercisePage(colorSchemes);
    }
  });
})();
