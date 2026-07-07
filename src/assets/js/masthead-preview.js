(function () {
  var select = document.getElementById('masthead-context-select');
  if (!select) return;

  var storageKey = 'masthead-context-preview';

  function apply(value) {
    var root = document.documentElement;
    if (!value || value === 'live') {
      root.removeAttribute('data-masthead-context');
    } else {
      root.setAttribute('data-masthead-context', value);
    }
    try {
      sessionStorage.setItem(storageKey, value || 'live');
    } catch (e) {
      /* ignore */
    }
  }

  try {
    var saved = sessionStorage.getItem(storageKey);
    if (saved && select.querySelector('option[value="' + saved + '"]')) {
      select.value = saved;
      apply(saved);
    }
  } catch (e) {
    /* ignore */
  }

  select.addEventListener('change', function () {
    apply(select.value);
  });
})();
