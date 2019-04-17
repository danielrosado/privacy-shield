'use strict';


import ThirdPartiesManager from './classes/ThirdPartiesManager';


const tpm = new ThirdPartiesManager();
// debug
window.tpm = tpm;

/**
 * Handles the onBeforeRequest event
 * @param {WebRequestBodyDetails} details
 */
function onBeforeRequestListener(details) {
  if (details.tabId === -1) {
    return;
  }
  chrome.tabs.get(details.tabId, function(tab) {
    if (tpm.isThirdParty(tab.url, details.url)) {
      tpm.addThirdPartyFromTab(details.url, details.tabId);
    }
  });
}


/**
 *  Start the tabs API event listeners
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url !== undefined) {
    tpm.clearTabDomains(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  tpm.removeThirdPartiesFromTab(tabId);
});

/**
 *  Start the webrequest API event listeners
 */
chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestListener,
    {urls: ['http://*/*', 'https://*/*']}
);
