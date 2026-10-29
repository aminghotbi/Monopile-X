/* Industry introduction and owner-configured enquiry/booking connections. */
(function () {
  'use strict';
  const config = window.MONOPILE_X_INDUSTRY_CONFIG || {};
  const inquiry = document.getElementById('industry-inquiry');
  const form = document.getElementById('industry-inquiry-form');
  const topic = document.getElementById('inquiry-topic');
  const message = document.getElementById('inquiry-message');
  const direct = document.getElementById('industry-direct-enquiry');
  const dialog = document.getElementById('inquiry-dialog');
  if (dialog) {
    dialog.querySelector('[data-close-inquiry]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  }
  if (!inquiry || !form || !topic || !message || !direct) return;

  function publicUrl(value, hosts) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && !url.username && !url.password &&
        hosts.includes(url.hostname) ? url.href : '';
    } catch (_) { return ''; }
  }

  const enquiryUrl = publicUrl(config.enquiryFormUrl,
    ['forms.office.com', 'forms.cloud.microsoft', 'forms.microsoft.com']);
  const bookingUrl = publicUrl(config.bookingUrl,
    ['outlook.office.com', 'outlook.office365.com', 'outlook.cloud.microsoft',
      'book.ms', 'calendly.com', 'cal.com']);

  function scrollTo(element) {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  document.querySelectorAll('[data-guide-route]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const name = link.dataset.guideRoute;
      const panel = document.getElementById(name);
      if (!panel || typeof window.showTab !== 'function') return;
      event.preventDefault();
      window.showTab(name);
      panel.setAttribute('tabindex', '-1');
      panel.focus({ preventScroll: true });
      scrollTo(panel);
    });
  });

  function openEnquiry(selectedTopic, meeting) {
    if (!enquiryUrl) {
      topic.value = selectedTopic || 'Technical discussion';
      if (meeting && !message.value.trim()) {
        message.value = 'I would like to arrange a 20–30-minute research discussion.\n\nTopics of interest:\n\nSuggested times and time zone:\n';
      }
    }
    if (dialog && !dialog.open) dialog.showModal();
    inquiry.open = true;
    if (!dialog) scrollTo(inquiry);
    if (!enquiryUrl) document.getElementById('inquiry-name').focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-enquiry]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      openEnquiry(link.dataset.openEnquiry, false);
    });
  });

  document.querySelectorAll('[data-open-meeting]').forEach(function (link) {
    if (bookingUrl) {
      link.href = bookingUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Choose a meeting time';
      link.setAttribute('aria-label', 'Choose a meeting time — opens booking page in a new tab');
    } else {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        openEnquiry('Meeting request', true);
      });
    }
  });

  if (bookingUrl) {
    document.getElementById('industry-booking-title').textContent = 'Book a research discussion';
    document.getElementById('industry-booking-description').textContent =
      'Choose a time from Amin’s booking page to discuss your project, the model or a possible validation case.';
    document.getElementById('industry-booking-note').textContent =
      'Available times and meeting details are shown on the booking page.';
  }

  if (enquiryUrl) {
    form.hidden = true;
    direct.hidden = false;
    document.getElementById('industry-enquiry-description').textContent =
      'Send a technical question, suggest a validation case or discuss collaboration using the enquiry form.';
    document.getElementById('industry-enquiry-note').textContent =
      'Your response is submitted through Amin’s Microsoft Form.';
    const external = document.getElementById('industry-form-external');
    external.href = enquiryUrl;
    let loaded = false;
    function loadForm() {
      if (!inquiry.open || loaded) return;
      const frame = document.createElement('iframe');
      frame.src = enquiryUrl;
      frame.title = 'MONOPILE X industry enquiry form';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      direct.appendChild(frame);
      loaded = true;
    }
    inquiry.addEventListener('toggle', loadForm);
    loadForm();
  }
}());
