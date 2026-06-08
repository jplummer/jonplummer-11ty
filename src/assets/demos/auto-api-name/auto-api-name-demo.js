// ====================================================================
    // CONFIG — Edit these to change validation rules everywhere.
    // ====================================================================
    const CONFIG = {
      // Allowed characters in a final API name (whole-string match)
      allowedPattern: /^[A-Za-z0-9_-]+$/,

      // Whole-name matches that should be flagged (case-insensitive)
      forbiddenNames: ['GET', 'POST', 'PUT', 'DELETE', 'UPDATE', 'LIST'],

      // Debounce delay (ms) used by scheme #9
      debounceMs: 400,
    };

    // ====================================================================
    // Transform: Display Name → candidate API Name
    // ====================================================================
    let currentTransformStyle = 'snake_case';

    function transform(displayName) {
      if (!displayName) return '';
      // Strip everything except letters, digits, spaces, underscores, hyphens
      const cleaned = displayName.replace(/[^A-Za-z0-9 _-]+/g, '');

      if (currentTransformStyle === 'preserve') {
        return cleaned
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^[_-]+|[_-]+$/g, '');
      }
      if (currentTransformStyle === 'lowercase') {
        return cleaned
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^[_-]+|[_-]+$/g, '');
      }

      // snake_case and camelCase: tokenize by whitespace, underscores,
      // hyphens, AND lowercase→uppercase boundaries (so "deletePost"
      // splits into ["delete", "Post"]).
      const tokens = cleaned
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(/[\s_-]+/)
        .filter(Boolean);

      if (currentTransformStyle === 'snake_case') {
        return tokens.map(t => t.toLowerCase()).join('_');
      }
      if (currentTransformStyle === 'camelCase') {
        return tokens
          .map((t, i) =>
            i === 0
              ? t.toLowerCase()
              : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
          )
          .join('');
      }
      return cleaned;
    }

    // ====================================================================
    // Validation (independent of scheme behavior)
    // ====================================================================
    function validate(apiName) {
      if (apiName === '') return null;
      if (!CONFIG.allowedPattern.test(apiName)) {
        return 'Only letters, digits, hyphens, and underscores allowed.';
      }
      const upper = apiName.toUpperCase();
      if (CONFIG.forbiddenNames.some(f => f.toUpperCase() === upper)) {
        return `"${apiName}" is a reserved HTTP method name.`;
      }
      return null;
    }

    // ====================================================================
    // Card helpers
    // ====================================================================
    function getInputs(card) {
      return {
        display: card.querySelector('input.display'),
        api: card.querySelector('input.api'),
      };
    }
    function setApi(card, value) {
      const { api } = getInputs(card);
      api.value = value;
      runValidation(card);
    }
    function runValidation(card) {
      const { api } = getInputs(card);
      const err = validate(api.value);
      card.querySelector('.error').textContent = err || '';
      api.classList.toggle('invalid', !!err);
    }
    function makeStatus(card) {
      const badge = card.querySelector('.status-badge');
      return (text) => { badge.textContent = text; };
    }
    function makeDebugLine(card) {
      const dbg = card.querySelector('.debug-line');
      return (text) => { dbg.textContent = text || ''; };
    }

    // ====================================================================
    // SCHEMES — each wires up one card's behavior.
    // ====================================================================
    const schemes = [
      {
        n: 1,
        name: 'Always update',
        desc: 'Every keystroke in Display Name overwrites API Name. No exceptions.',
        setup(card) {
          const { display } = getInputs(card);
          const setStatus = makeStatus(card);
          setStatus('auto');
          display.addEventListener('input', () => {
            setApi(card, transform(display.value));
          });
        },
      },
      {
        n: 2,
        name: 'Update only if blank',
        desc: 'On each Display Name change: if API Name is currently empty, fill it. Otherwise leave it.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          const refresh = () => setStatus(api.value === '' ? 'auto (blank)' : 'manual');
          refresh();
          display.addEventListener('input', () => {
            if (api.value === '') setApi(card, transform(display.value));
            refresh();
          });
          api.addEventListener('input', () => { runValidation(card); refresh(); });
        },
      },
      {
        n: 3,
        name: 'Update until blur',
        desc: 'Auto-updates as you type. Blurring Display Name stops it permanently.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          let active = true;
          setStatus('auto');
          display.addEventListener('input', () => {
            if (active) setApi(card, transform(display.value));
          });
          display.addEventListener('blur', () => {
            if (active) { active = false; setStatus('locked'); }
          });
          api.addEventListener('input', () => runValidation(card));
        },
      },
      {
        n: 4,
        name: 'Editing API locks it forever',
        desc: 'Live syncing until you touch the API Name field. After that, never again.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          let apiTouched = false;
          setStatus('auto');
          display.addEventListener('input', () => {
            if (!apiTouched) setApi(card, transform(display.value));
          });
          api.addEventListener('input', () => {
            apiTouched = true;
            setStatus('manual (locked)');
            runValidation(card);
          });
        },
      },
      {
        n: 5,
        chip: 'This works',
        name: 'Until blur, restored if cleared',
        desc: 'Like #3, but clearing API Name re-enables auto-update.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          let active = true;
          setStatus('auto');
          display.addEventListener('input', () => {
            if (active) setApi(card, transform(display.value));
          });
          display.addEventListener('blur', () => {
            if (active) { active = false; setStatus('locked'); }
          });
          api.addEventListener('input', () => {
            runValidation(card);
            if (api.value === '' && !active) {
              active = true;
              setStatus('auto (restored)');
            }
          });
        },
      },
      {
        n: 6,
        name: 'Sticky while matching',
        desc: 'Syncs as long as API Name still equals the last auto-generated value. Diverge → stops. Restore the match → resumes.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          const setDebug = makeDebugLine(card);
          let lastGenerated = '';
          const refresh = () => {
            const synced = api.value === lastGenerated;
            setStatus(synced ? 'auto (matches)' : 'manual (diverged)');
            setDebug(`last auto: ${lastGenerated ? '"' + lastGenerated + '"' : '∅'}`);
          };
          refresh();
          display.addEventListener('input', () => {
            if (api.value === lastGenerated) {
              const v = transform(display.value);
              setApi(card, v);
              lastGenerated = v;
            }
            refresh();
          });
          api.addEventListener('input', () => { runValidation(card); refresh(); });
        },
      },
      {
        n: 7,
        chip: 'Also interesting',
        name: 'Suggest, don’t fill',
        desc: 'API Name stays untouched. A suggestion appears below — click Accept (or press Enter while in API Name) to take it.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          const suggestEl = card.querySelector('.suggest');
          const suggestVal = card.querySelector('.suggest-val');
          const acceptBtn = card.querySelector('.suggest-accept');
          setStatus('suggested');
          const refresh = () => {
            const v = transform(display.value);
            if (v && api.value !== v) {
              suggestVal.textContent = v;
              suggestEl.style.display = '';
            } else {
              suggestEl.style.display = 'none';
            }
          };
          refresh();
          display.addEventListener('input', refresh);
          api.addEventListener('input', () => { runValidation(card); refresh(); });
          acceptBtn.addEventListener('click', () => {
            setApi(card, suggestVal.textContent);
            refresh();
          });
          api.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && api.value === '' && suggestVal.textContent) {
              e.preventDefault();
              setApi(card, suggestVal.textContent);
              refresh();
            }
          });
        },
      },
      {
        n: 8,
        name: 'Explicit lock toggle',
        desc: 'Linked by default — click the lock to unlink. Linked = live auto-update; Unlinked = ignore Display Name changes.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          const lockBtn = card.querySelector('.lock-btn');
          let linked = true;
          const refresh = () => {
            lockBtn.textContent = linked ? '🔗 Linked' : '🔓 Unlinked';
            lockBtn.classList.toggle('locked', linked);
            setStatus(linked ? 'auto' : 'unlinked');
          };
          refresh();
          display.addEventListener('input', () => {
            if (linked) setApi(card, transform(display.value));
          });
          lockBtn.addEventListener('click', () => { linked = !linked; refresh(); });
          api.addEventListener('input', () => runValidation(card));
        },
      },
      {
        n: 9,
        name: `Debounced (${CONFIG.debounceMs}ms)`,
        desc: 'Like #1, but waits for a typing pause before updating. Less strobe-y.',
        setup(card) {
          const { display } = getInputs(card);
          const setStatus = makeStatus(card);
          let timer = null;
          setStatus('auto');
          display.addEventListener('input', () => {
            setStatus('pending…');
            clearTimeout(timer);
            timer = setTimeout(() => {
              setApi(card, transform(display.value));
              setStatus('auto');
            }, CONFIG.debounceMs);
          });
          const { api } = getInputs(card);
          api.addEventListener('input', () => runValidation(card));
        },
      },
      {
        n: 10,
        chip: 'Basic',
        name: 'Update on blur only',
        desc: 'No live updates. When you leave Display Name (Tab / click away), API Name fills in once.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          setStatus('idle');
          display.addEventListener('blur', () => {
            setApi(card, transform(display.value));
            setStatus('synced on last blur');
          });
          api.addEventListener('input', () => runValidation(card));
        },
      },
      {
        n: 11,
        name: 'First-keystroke seed',
        desc: 'API Name is set from the first keystroke in Display Name — and only then. Never updates again.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          let seeded = false;
          setStatus('awaiting first keystroke');
          display.addEventListener('input', () => {
            if (!seeded) {
              setApi(card, transform(display.value));
              seeded = true;
              setStatus('seeded (no further updates)');
            }
          });
          api.addEventListener('input', () => runValidation(card));
        },
      },
      {
        n: 12,
        chip: 'Basic',
        name: 'Generate button (no auto)',
        desc: 'Nothing automatic. Press Generate to fill API Name from Display Name.',
        setup(card) {
          const { display, api } = getInputs(card);
          const setStatus = makeStatus(card);
          const genBtn = card.querySelector('.generate-btn');
          setStatus('manual');
          genBtn.addEventListener('click', () => {
            setApi(card, transform(display.value));
            setStatus('generated');
          });
          api.addEventListener('input', () => {
            runValidation(card);
            setStatus('manual');
          });
        },
      },
    ];

    // ====================================================================
    // Render
    // ====================================================================
    function renderCard(scheme, isFeatured = false) {
      const card = document.createElement('div');
      card.className = isFeatured ? 'card featured' : 'card';
      card.dataset.scheme = scheme.n;

      const lockBtnHTML = scheme.n === 8
        ? `<button class="lock-btn" type="button">🔗 Linked</button>` : '';
      const generateHTML = scheme.n === 12
        ? `<button class="generate-btn" type="button">↻ Generate</button>` : '';
      const suggestHTML = scheme.n === 7
        ? `<div class="suggest" style="display:none">Suggested: <code class="suggest-val"></code><button type="button" class="suggest-accept">Accept</button></div>` : '';

      const chipClassMap = {
        'This works': 'works-pill',
        'Also interesting': 'interesting-pill',
        'Basic': 'basic-pill',
      };
      const chipHTML = scheme.chip
        ? `<span class="${chipClassMap[scheme.chip] || 'interesting-pill'}">${scheme.chip}</span>`
        : '';
      if (!isFeatured && !scheme.chip) {
        card.classList.add('rejected');
      }
      const titleHTML = isFeatured
        ? `<span class="favorite-pill">Favorite</span>${scheme.name}`
        : `<span class="num">#${scheme.n}</span>${chipHTML}${scheme.name}`;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${titleHTML}</div>
          <div class="card-actions">
            <button class="reset-btn" type="button">Reset</button>
            <button class="hide-btn" type="button">Hide</button>
          </div>
        </div>
        <div class="card-desc">${scheme.desc}</div>
        <div class="field">
          <label>Display Name</label>
          <input type="text" class="display" autocomplete="off" />
        </div>
        <div class="field">
          <label>API Name</label>
          <div class="field-row">
            <input type="text" class="api" autocomplete="off" spellcheck="false" />
            ${generateHTML}${lockBtnHTML}
          </div>
          ${suggestHTML}
          <div class="error"></div>
        </div>
        <div class="debug">
          <span class="badge">state: <span class="status-badge">—</span></span>
          <span class="debug-line"></span>
        </div>
      `;
      scheme.setup(card);
      card.querySelector('.reset-btn').addEventListener('click', () => {
        const fresh = renderCard(scheme, isFeatured);
        card.replaceWith(fresh);
      });
      card.querySelector('.hide-btn').addEventListener('click', () => {
        card.style.display = 'none';
      });
      return card;
    }

    // ====================================================================
    // FAVORITE — combined scheme that sits above the comparison grid:
    //   • Auto-update while typing in Display Name
    //   • Display Name blur → severs the link
    //   • Editing API Name → severs the link
    //   • Clearing API Name → restores auto-update
    // ====================================================================
    const favoriteScheme = {
      n: 'fav',
      name: 'Auto until blur or manual edit; restored when API Name is cleared',
      desc: 'Live updates while you type. Blurring Display Name or editing API Name severs the link. Clearing API Name brings the link back.',
      setup(card) {
        const { display, api } = getInputs(card);
        const setStatus = makeStatus(card);
        let active = true;
        setStatus('auto');
        display.addEventListener('input', () => {
          if (active) setApi(card, transform(display.value));
        });
        display.addEventListener('blur', () => {
          if (active) { active = false; setStatus('locked (blur)'); }
        });
        api.addEventListener('input', () => {
          runValidation(card);
          if (api.value === '') {
            active = true;
            setStatus('auto (restored)');
          } else if (active) {
            active = false;
            setStatus('locked (manual edit)');
          }
        });
      },
    };

    const featuredContainer = document.getElementById('featured');
    featuredContainer.appendChild(renderCard(favoriteScheme, true));

    const main = document.getElementById('cards');
    schemes.forEach(s => main.appendChild(renderCard(s)));

    // ====================================================================
    // Page-level controls
    // ====================================================================
    document.querySelectorAll('input[name="transform"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        currentTransformStyle = e.target.value;
      });
    });
    document.getElementById('debug-toggle').addEventListener('change', (e) => {
      document.body.classList.toggle('hide-debug', !e.target.checked);
    });
    const revealBtn = document.getElementById('reveal-rejected');
    revealBtn.addEventListener('click', () => {
      const revealed = document.body.classList.toggle('reveal-rejected');
      revealBtn.textContent = revealed ? 'Hide rejected options' : 'Reveal rejected options';
    });
    document.getElementById('reset-all').addEventListener('click', () => {
      const oldFeatured = document.querySelector('#featured .card');
      if (oldFeatured) {
        oldFeatured.replaceWith(renderCard(favoriteScheme, true));
      }
      document.querySelectorAll('#cards .card').forEach((oldCard) => {
        const n = parseInt(oldCard.dataset.scheme, 10);
        const scheme = schemes.find(s => s.n === n);
        const fresh = renderCard(scheme);
        oldCard.replaceWith(fresh);
      });
    });
    const patternInput = document.getElementById('pattern-input');
    patternInput.addEventListener('input', () => {
      try {
        const re = new RegExp(patternInput.value);
        CONFIG.allowedPattern = re;
        patternInput.classList.remove('invalid');
      } catch (e) {
        patternInput.classList.add('invalid');
        return;
      }
      document.querySelectorAll('.card').forEach(card => runValidation(card));
    });
