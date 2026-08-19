/* ═══════════════════════════════════════════════════════════════════
   brisa-deck.js — motor de navegacao dos decks Brisa
   Versao: 1.1.0
   Zero dependencia. Zero marca no codigo — a marca mora no HTML/CSS.

   CONTRATO DA CASCATA (herdado da /apresentacao, assets/shell.js):
   ao entrar num slide pela PRIMEIRA vez, todo .cascade-item dele tem a
   animacao rebobinada pela WAAPI (cancel + play) e revela em escada.
   Revisita entra pronta — quem volta para retomar um numero ja leu
   aquilo, e revelar de novo so faz esperar. Se a regra .cascade-item do
   CSS levar !important, o estilo inline perde e a cascata congela nos
   dois caminhos. Nunca por.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DECK_VERSION = '1.1.0';
  var secs = [], navItems = [], cur = 0;

  /* A cascata roda UMA vez por slide, na primeira visita. Revisita entra
     pronta: numa reuniao se volta para retomar um numero, e quem volta ja
     leu aquilo — revelar de novo so faz esperar.
     O rebobinar da primeira visita usa a WAAPI: `cancel()` + `play()` na
     animacao que o proprio CSS criou. O metodo antigo (zerar a propriedade
     `animation` e ler `offsetHeight`) forcava um reflow sincrono por item a
     cada tecla; fica so' como reserva para navegador sem getAnimations.    */
  function reanimate(sec) {
    if (!sec) return;
    var items = sec.querySelectorAll('.cascade-item'), i, el;

    if (sec.dataset.visto) {
      for (i = 0; i < items.length; i++) {
        items[i].style.animation = 'none';
        items[i].style.opacity = '1';   /* sem isto o .cascade-item fica no opacity:0 do CSS */
      }
      return;
    }
    sec.dataset.visto = '1';

    for (i = 0; i < items.length; i++) {
      el = items[i];
      el.style.opacity = '';
      if (el.getAnimations) {
        var anims = el.getAnimations();
        for (var j = 0; j < anims.length; j++) { anims[j].cancel(); anims[j].play(); }
      } else {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
      }
    }
  }

  /* Monta a barra lateral a partir dos proprios slides.
     Cada <section class="sec"> declara data-nav (rotulo) e, se quiser,
     data-num (numero exibido). Slide sem data-nav nao entra no indice. */
  function buildNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    nav.innerHTML = '';
    secs.forEach(function (s, i) {
      var label = s.dataset.nav;
      if (!label) { navItems.push(null); return; }
      var item = document.createElement('div');
      item.className = 'nav-sec';
      item.innerHTML = '<div class="n">' + (s.dataset.num || '') + '</div><div class="t"></div>';
      item.querySelector('.t').textContent = label;
      item.addEventListener('click', function () { show(i); });
      nav.appendChild(item);
      navItems.push(item);
    });
  }

  function show(i) {
    if (i < 0 || i >= secs.length) return;
    secs[cur].classList.remove('active');
    cur = i;
    secs[cur].classList.add('active');
    reanimate(secs[cur]);

    for (var k = 0; k < navItems.length; k++) {
      if (!navItems[k]) continue;
      navItems[k].classList.toggle('active', k === cur);
    }
    var active = navItems[cur];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });

    var pos = document.getElementById('slidePos');
    if (pos) pos.textContent = (cur + 1) + ' / ' + secs.length;

    var prev = document.getElementById('btnPrev');
    var next = document.getElementById('btnNext');
    if (prev) prev.disabled = (cur === 0);
    if (next) next.disabled = (cur === secs.length - 1);

    if (history.replaceState) history.replaceState(null, '', '#' + (cur + 1));
  }

  function wireButtons() {
    var prev = document.getElementById('btnPrev');
    var next = document.getElementById('btnNext');
    var full = document.getElementById('btnFull');
    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () { show(cur + 1); });
    if (full) full.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
  }

  function wireKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(cur + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'Home') { e.preventDefault(); show(0); }
      else if (e.key === 'End') { e.preventDefault(); show(secs.length - 1); }
      else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
    });
  }

  function init() {
    secs = Array.prototype.slice.call(document.querySelectorAll('section.sec'));
    if (!secs.length) return;
    buildNav();
    wireButtons();
    wireKeys();

    var start = 0;
    var hash = parseInt((location.hash || '').replace('#', ''), 10);
    if (hash >= 1 && hash <= secs.length) start = hash - 1;

    secs.forEach(function (s) { s.classList.remove('active'); });
    cur = start;
    secs[cur].classList.add('active');
    show(cur);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.brisaDeck = {
    version: DECK_VERSION,
    go: function (n) { show(n); },
    next: function () { show(cur + 1); },
    prev: function () { show(cur - 1); },
    current: function () { return cur; },
    count: function () { return secs.length; },
    reanimate: reanimate
  };
})();
