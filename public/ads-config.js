/* GlobalNews ad configuration.
 * Only activate ad units created and APPROVED for globalnews-a0q.pages.dev.
 * Never reuse ad-unit tags issued for another website.
 * Adsterra: Websites > globalnews-a0q.pages.dev > GET CODE.
 */
window.GlobalNewsAdConfig = Object.freeze({
  enabled: false,
  approvedHost: 'globalnews-a0q.pages.dev',
  banner: {
    key: '', // Paste the GlobalNews-only 468x60 tag's atOptions.key.
    width: 468,
    height: 60,
    source: '' // Paste the GlobalNews-only banner script HTTPS URL.
  },
  native: {
    containerId: '', // Paste the exact GlobalNews native container id.
    source: '' // Paste the GlobalNews-only native script HTTPS URL.
  }
});
