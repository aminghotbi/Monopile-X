# MONOPILE X visitor analytics

## Current state

The Google Analytics 4 integration is configured with the owner-supplied
Measurement ID **G-91DH9E788L** in `assets/analytics-config.js`. The Google
Analytics script loads only after the visitor chooses to allow analytics.
Statistics are viewed in the owner's Google Analytics account, not exposed on
the public website. The owner should confirm that Enhanced Measurement is off
and verify incoming visits in Realtime after deployment.

## Property setup and verification

1. In Google Analytics, create or select a property named **MONOPILE X**.
   Set the reporting time zone to **Australia/Melbourne** and currency to **AUD**.
2. Add a **Web** data stream for `https://aminghotbi.github.io/Monopile-X/`.
3. **Turn off Enhanced Measurement for this stream.** This is required because
   this integration sends its own page views and selected events. It avoids
   duplicate history-based page views and automatic form/outbound-link tracking.
4. Copy the stream's Measurement ID (beginning `G-`) into `measurementId` in
   `assets/analytics-config.js`. Commit the change and wait for GitHub Pages.
   The Measurement ID is public; never put account passwords, API secrets or
   service-account credentials in the repository.
5. Leave Google signals, advertising features, user-provided data collection
   and User-ID collection off. They are not needed for this research site.
6. Open the site, allow optional analytics, and check the **Realtime** report.
   A browser/ad blocker or declined consent can prevent a visit from appearing.

## Reports and events

- Users and sessions: visitor and visit estimates, from activation onward.
- User attributes: approximate country, region and city inferred by Google.
- Traffic acquisition: available referral sources. Referrers sent by this code
  include only the origin, and page URLs omit query strings and free-form hashes.
- Pages and screens: the single MONOPILE X web page.
- `module_view`: module opened; register `module_name` as an event-scoped custom
  dimension to compare the seven modules in reports.
- `inquiry_open`: inquiry form expanded.
- `inquiry_email_draft`: a valid form was used to open an email draft. This is
  **not evidence that an email was sent or that a lead was received**.
- `cost_scenario_change`: a calculator input changed. Only the input's name is
  included, not its value. Register `parameter_name` if needed.

The custom events do not read or send names, email addresses, organisations,
inquiry messages or calculator values. Advertising consent remains denied.
The tracker runs only on the configured GitHub Pages hostname and path. No
historical traffic can be reconstructed, and counts are not exact headcounts.
Visitor geography is approximate and may be affected by VPNs or network routing.

## Visitor choices

The banner appears only after a valid owner ID is configured. Both Allow and
Decline are available. The choice is stored in this browser. Visitors can change
it under **About → Privacy and analytics → Analytics preferences**. Declining
stops subsequent analytics events and removes this integration's GA cookies.

## Google Search

- Verification file: `googleed95234caed49a98.html`; keep it in place.
- URL-prefix property: `https://aminghotbi.github.io/Monopile-X/`.
- Sitemap: `https://aminghotbi.github.io/Monopile-X/sitemap.xml`.
- Inspect the homepage in Search Console to check Google's actual index status.
  A public `site:` search is not a definitive index-status test.

Official setup: https://support.google.com/analytics/answer/9304153
