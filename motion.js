/* 活动与相册 · 轻柔动效（2026-11-24 并入 V4）
   1. 往下滑时，活动卡片和相册格子一张张淡入；
   2. 相册照片点一下放大，可左右滑动、按键盘左右键翻看，按 Esc 或右上角关闭。
   3. 页首插画轻动效。
   单文件离线版换页后由外壳调用 window.__motionInit() 重新初始化。 */
(function () {
  var keyHandler = null;
  function init() {
    if (!document.body) return;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 淡入 ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.article > section, .culture-print, .event-shelf .sample-grid a, .album li'
    );
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add('reveal');
      /* 同一排的格子依次出现，前后相差 0.09 秒 */
      if (el.matches('.sample-grid a, .album li')) {
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = (i % 3) * 90 + 'ms';
      }
      io.observe(el);
    });
    root.classList.add('js-motion');
    /* 保险：个别手机浏览器若一直不报告“已进入屏幕”，2.5 秒后全部直接显示，不让内容藏着 */
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
      }
    }, 2500);
  }

  /* ---------- 1b. 页首插画：舞台灯亮一下、画面推近再退回 ---------- */
  var art = document.querySelector('.page-art, .art-motion');
  if (art && !reduce) {
    var playing = false;
    function play() {
      if (playing) return;
      playing = true;
      art.classList.add('stage-on');
    }
    art.addEventListener('animationend', function (e) {
      if (e.animationName !== 'stage-breath') return;
      art.classList.remove('stage-on');
      playing = false;
    });
    /* 电脑：鼠标放上去就动一次（动完再放上去还会动） */
    art.addEventListener('mouseenter', play);
    /* 手机没有鼠标：图片大半进入屏幕时动一次 */
    if ('IntersectionObserver' in window) {
      var artIo = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { play(); artIo.disconnect(); }
      }, { threshold: 0.6 });
      artIo.observe(art);
    }
  }

  /* ---------- 2. 相册放大看 ---------- */
  var buttons = document.querySelectorAll('.album button');
  if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
  document.body.style.overflow = '';
  if (!buttons.length) return;

  var items = Array.prototype.map.call(buttons, function (b) {
    var img = b.querySelector('img');
    return {
      src: b.getAttribute('data-full') || img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      title: (b.querySelector('.cap strong') || {}).textContent || '',
      note: (b.querySelector('.cap small') || {}).textContent || ''
    };
  });

  Array.prototype.forEach.call(document.querySelectorAll('.lightbox'), function (n) { n.remove(); });
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '活动相册');
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML =
    '<span class="lb-count" aria-live="polite"></span>' +
    '<button type="button" class="lb-btn lb-close" aria-label="关闭">✕</button>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="上一张">‹</button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="下一张">›</button>' +
    '<figure><img alt=""><figcaption><strong></strong><small></small></figcaption></figure>';
  document.body.appendChild(box);

  var bigImg = box.querySelector('img');
  var capTitle = box.querySelector('figcaption strong');
  var capNote = box.querySelector('figcaption small');
  var counter = box.querySelector('.lb-count');
  var current = 0;
  var opener = null;

  function show(i, animate) {
    current = (i + items.length) % items.length;
    var it = items[current];
    function fill() {
      bigImg.src = it.src;
      bigImg.alt = it.alt;
      capTitle.textContent = it.title;
      capNote.textContent = it.note;
      counter.textContent = (current + 1) + ' / ' + items.length;
      bigImg.classList.remove('swap');
    }
    if (animate && !reduce) {
      bigImg.classList.add('swap');
      setTimeout(fill, 200);
    } else {
      fill();
    }
  }

  function open(i) {
    opener = buttons[i];
    show(i, false);
    box.classList.add('open');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    box.querySelector('.lb-close').focus();
  }

  function close() {
    box.classList.remove('open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (opener) opener.focus();
  }

  Array.prototype.forEach.call(buttons, function (b, i) {
    b.addEventListener('click', function () { open(i); });
  });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1, true); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(current + 1, true); });
  /* 点黑色空白处也能关 */
  box.addEventListener('click', function (e) { if (e.target === box) close(); });

  keyHandler = function (e) {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1, true);
    else if (e.key === 'ArrowRight') show(current + 1, true);
    else if (e.key === 'Tab') {
      /* 键盘焦点留在放大框里 */
      var f = box.querySelectorAll('button');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', keyHandler);

  /* 手机上左右滑动翻看 */
  var startX = null, startY = null;
  box.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1), true);
    startX = null;
  }, { passive: true });
  }
  window.__motionInit = init;
  init();
})();
