(function () {
  var dialog = document.getElementById('figure-lightbox');
  if (!dialog) return;

  var imgEl = document.getElementById('figure-lightbox-image');
  var captionEl = document.getElementById('figure-lightbox-caption');
  var prevBtn = document.getElementById('figure-lightbox-prev');
  var nextBtn = document.getElementById('figure-lightbox-next');

  function triggers() {
    return Array.prototype.slice.call(
      document.querySelectorAll('main figure a.figure-lightbox-trigger')
    );
  }

  function figureFor(trigger) {
    return trigger.closest('figure');
  }

  function showFigureAt(index) {
    var list = triggers();
    if (index < 0 || index >= list.length) return;
    var trigger = list[index];
    var figure = figureFor(trigger);
    var pageImg = figure ? figure.querySelector('img') : null;
    imgEl.src = trigger.getAttribute('href');
    imgEl.alt = pageImg ? (pageImg.getAttribute('alt') || '') : '';

    var cap = figure && figure.querySelector('figcaption');
    var text = cap ? cap.textContent.trim() : '';
    if (text) {
      captionEl.textContent = text;
      captionEl.hidden = false;
    } else {
      captionEl.textContent = '';
      captionEl.hidden = true;
    }

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= list.length - 1;
    dialog.dataset.index = String(index);

    if (!dialog.open) dialog.showModal();
  }

  function currentIndex() {
    return parseInt(dialog.dataset.index || '-1', 10);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('main figure a.figure-lightbox-trigger');
    if (!trigger) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    var list = triggers();
    var index = list.indexOf(trigger);
    if (index === -1) return;
    showFigureAt(index);
  });

  prevBtn.addEventListener('click', function () {
    showFigureAt(currentIndex() - 1);
  });
  nextBtn.addEventListener('click', function () {
    showFigureAt(currentIndex() + 1);
  });

  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('keydown', function (event) {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showFigureAt(currentIndex() - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showFigureAt(currentIndex() + 1);
    }
  });
})();
