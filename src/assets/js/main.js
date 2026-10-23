(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var cfg = window.NETPROX || {};

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function waUrl(text) {
    return 'https://wa.me/' + (cfg.wa || '') + '?text=' + encodeURIComponent(text);
  }

  // Mobile menu (full-screen panel)
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-nav');
  function setMenu(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.querySelector('.nav-close').focus();
    else toggle.focus();
  }
  if (toggle && panel) {
    toggle.addEventListener('click', function () { setMenu(true); });
    panel.querySelector('.nav-close').addEventListener('click', function () { setMenu(false); });
    // Close after choosing a link, so same-page anchors and the back button behave
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });
    // Keep keyboard focus inside the open panel
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = panel.querySelectorAll('a, button');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // Leaving phone width with the menu open (rotating a tablet) should not leave the page locked
    window.matchMedia('(min-width: 960px)').addEventListener('change', function (m) {
      if (m.matches) document.body.classList.remove('nav-open');
    });
  }

  // Desktop "Courses" dropdown: hover on mouse, click or keyboard everywhere
  var drop = document.querySelector('.has-drop');
  if (drop) {
    var dropBtn = drop.querySelector('.nav-drop-btn');
    var setDrop = function (open) {
      drop.classList.toggle('open', open);
      dropBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    dropBtn.addEventListener('click', function () { setDrop(!drop.classList.contains('open')); });
    drop.addEventListener('mouseenter', function () { dropBtn.setAttribute('aria-expanded', 'true'); });
    drop.addEventListener('mouseleave', function () { setDrop(false); });
    drop.addEventListener('focusout', function (e) { if (!drop.contains(e.relatedTarget)) setDrop(false); });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) setDrop(false); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('nav-open')) setMenu(false);
    if (drop && drop.classList.contains('open')) { drop.classList.remove('open'); drop.querySelector('.nav-drop-btn').setAttribute('aria-expanded', 'false'); drop.querySelector('.nav-drop-btn').focus(); }
  });

  // WhatsApp click tracking: every WhatsApp link carries data-wa="<course or context>"
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-wa]');
    if (!a) return;
    track('whatsapp_click', { course: a.getAttribute('data-wa'), page_path: location.pathname, link_location: a.getAttribute('data-wa-pos') || 'inline' });
  });

  // Copy a direct link to a course (for counsellors sharing on WhatsApp)
  document.querySelectorAll('.copy-link').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + btn.getAttribute('data-anchor');
      var label = btn.querySelector('span');
      var done = function () {
        btn.classList.add('done');
        label.textContent = 'Link copied';
        setTimeout(function () { btn.classList.remove('done'); label.textContent = 'Copy link'; }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link', url); });
      } else {
        window.prompt('Copy this link', url);
      }
    });
  });

  // "Register your interest" buttons preselect their programme in the form
  document.querySelectorAll('[data-programme]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('f-di-programme');
      if (sel) sel.value = a.getAttribute('data-programme');
    });
  });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Forms: post to the configured form service, or fall back to WhatsApp with the details filled in
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var started = Date.now();
    var status = form.querySelector('.form-status');
    var setStatus = function (msg, kind) { status.textContent = msg; status.className = 'form-status ' + (kind || ''); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      // Spam protection: honeypot field and minimum fill time
      if (form.querySelector('.hp input').value || Date.now() - started < 3000) {
        setStatus('Thank you. We will be in touch.', 'ok');
        return;
      }
      var data = new FormData(form);
      data.delete('website');
      var endpoint = form.getAttribute('action');
      var title = form.getAttribute('data-title');
      track('form_submit', { form: form.getAttribute('data-form') });

      if (!endpoint) {
        var lines = ['Hello, ' + title + ':'];
        data.forEach(function (v, k) { if (v && k.charAt(0) !== '_') lines.push(k + ': ' + v); });
        track('whatsapp_click', { course: title, page_path: location.pathname, link_location: 'form' });
        window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
        setStatus('WhatsApp is opening with your details. Press send to reach an adviser.', 'ok');
        return;
      }

      var btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      setStatus('Sending…');
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          setStatus(form.getAttribute('data-success'), 'ok');
        })
        .catch(function () {
          setStatus('Sorry, that did not send. Please try again or chat with us on WhatsApp.', 'err');
        })
        .then(function () { btn.disabled = false; });
    });
  });
})();
