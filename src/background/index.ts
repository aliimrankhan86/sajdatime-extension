/**
 * The service worker exists from the first build so the manifest is honest, but it does
 * nothing yet. Alarms, notifications and the badge arrive in the background step; until
 * then the popup works out everything it shows from storage on open.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});
