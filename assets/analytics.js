/* GA4 visitor measurement with a persistent opt-out in the Team tab.
 * The owner must disable Enhanced Measurement in this web stream: this file
 * explicitly controls page views and events, including avoiding form contents.
 */
(function () {
  'use strict';
  const noop = function () {};
  window.MonopileAnalytics = Object.freeze({ moduleView: noop, inquiryDraft: noop });

  const config = window.MONOPILE_X_ANALYTICS_CONFIG || {};
  const id = String(config.measurementId || '').trim();
  if (!/^G-[A-Z0-9]{6,20}$/.test(id) || location.hostname !== config.hostname ||
      !location.pathname.startsWith(config.pathname)) return;

  const privacy = document.getElementById('analytics-privacy');
  const toggle = document.getElementById('analytics-enabled');
  const status = document.getElementById('analytics-choice-status');
  if (![privacy, toggle, status].every(Boolean)) return;

  const moduleNames = Object.freeze({
    start: 'Overview',
    sandbox: 'Results', theory: 'The model', scenarios: 'Applications',
    evidence: 'Validation',
    progress: 'Roadmap', about: 'Team'
  });
  const choiceKey = 'monopile-x-analytics-choice-v1';
  const pageUrl = location.origin + config.pathname;
  let choice = 'allow';
  let loaded = false;
  let started = false;
  let currentModule = Object.hasOwn(moduleNames, location.hash.slice(1)) ? location.hash.slice(1) : 'start';
  if (['whatif', 'value', 'methods'].includes(location.hash.slice(1))) currentModule = 'scenarios';
  try { if (localStorage.getItem(choiceKey) === 'decline') choice = 'decline'; } catch (_) {}

  function referrerOrigin() {
    try { return document.referrer ? new URL(document.referrer).origin + '/' : ''; }
    catch (_) { return ''; }
  }

  function emit(name, details) {
    if (choice !== 'allow' || !started) return;
    window.gtag('event', name, Object.assign({
      send_to: id,
      page_location: pageUrl,
      page_title: 'MONOPILE X | Breakage-aware monopile installation',
      page_referrer: referrerOrigin()
    }, details || {}));
  }

  function start() {
    if (started) return;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!loaded) {
      window.gtag('consent', 'default', {
        analytics_storage: 'granted', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied'
      });
      window.gtag('js', new Date());
      window.gtag('config', id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: config.hostname,
        cookie_path: config.pathname,
        cookie_prefix: 'monopile_x',
        cookie_flags: 'SameSite=Lax;Secure',
        page_location: pageUrl,
        page_referrer: referrerOrigin()
      });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.appendChild(script);
      loaded = true;
    } else {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    started = true;
    emit('page_view');
    emit('module_view', { module_name: currentModule });
  }

  function stop() {
    started = false;
    window['ga-disable-' + id] = true;
    if (loaded) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    document.cookie.split(';').forEach(function (part) {
      const name = part.split('=')[0].trim();
      if (!name.startsWith('monopile_x_ga')) return;
      ['', '; Domain=' + config.hostname].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; Path=' + config.pathname + domain + '; SameSite=Lax; Secure';
      });
    });
  }

  function updateStatus() {
    toggle.checked = choice === 'allow';
    status.textContent = choice === 'allow' ? 'Visitor analytics are on for this browser.' :
      'Visitor analytics are off for this browser.';
  }

  function choose(value) {
    choice = value;
    try { localStorage.setItem(choiceKey, value); } catch (_) {}
    if (value === 'allow') start(); else stop();
    updateStatus();
  }

  toggle.addEventListener('change', function () {
    choose(toggle.checked ? 'allow' : 'decline');
  });
  privacy.hidden = false;
  updateStatus();
  if (choice === 'allow') start();
  else stop();

  window.MonopileAnalytics = Object.freeze({
    moduleView: function (name) {
      if (!Object.hasOwn(moduleNames, name) || name === currentModule) return;
      currentModule = name;
      emit('module_view', { module_name: name });
    },
    inquiryDraft: function () { emit('inquiry_email_draft'); }
  });
  const inquiry = document.getElementById('industry-inquiry');
  if (inquiry) inquiry.addEventListener('toggle', function () {
    if (inquiry.open) emit('inquiry_open');
  });
  ['hourly', 'extra', 'contingency', 'hours', 'lowfactor', 'highfactor'].forEach(function (name) {
    const input = document.getElementById(name);
    if (input) input.addEventListener('change', function () {
      emit('cost_scenario_change', { parameter_name: name });
    });
  });
}());
