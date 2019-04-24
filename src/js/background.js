'use strict';

import parseDomain from 'parse-domain';
import TabsManager from './classes/tabs-manager';
import {MSG_TYPE, DOMAIN_STATE} from './utils/constants';

// ****************************
// Global variables declaration
// ****************************

const tm = new TabsManager();
let trackers;

// **********************
// Functions declarations
// **********************

/**
 * Handles the onBeforeRequest synchronous event
 * @param {WebRequestBodyDetails} details
 * @return {Object}
 */
function onBeforeRequestListener(details) {
  if (details.url.startsWith('chrome://')) {
    return {};
  }
  if (details.type === 'main_frame') {
    tm.removeTab(details.tabId);
    tm.saveTabAndDomain(details.tabId, parseDomain(details.url));
    return {};
  }
  if (details.tabId < 0) {
    return {cancel: true};
  }
  if (!tm.isTabSaved(details.tabId)) {
    return {};
  }
  const requestDomain = parseDomain(details.url);
  if (!tm.isThirdPartyDomain(details.tabId, requestDomain)) {
    return {};
  }
  // Set third-party domain state and blocking response
  const blockingResponse = {};
  if (trackers.has(`${requestDomain.domain}.${requestDomain.tld}`)) {
    requestDomain.state = DOMAIN_STATE.BLOCKED;
    blockingResponse.cancel = true;
  } else {
    requestDomain.state = DOMAIN_STATE.ALLOWED;
  }
  tm.addThirdPartyDomainToTab(details.tabId, requestDomain);
  return blockingResponse;
}

/**
 * Initializes Chrome API events listeners
 */
function initEventListeners() {
  chrome.tabs.onRemoved.addListener((tabId) => {
    tm.removeTab(tabId);
  });

  chrome.webRequest.onBeforeRequest.addListener(
      onBeforeRequestListener,
      {urls: ['http://*/*', 'https://*/*']},
      ['blocking']
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const response = {};
    if (message.type === MSG_TYPE.GET_THIRD_PARTY_DOMAINS) {
      response.domains = tm.getThirdPartyDomainsByTab(message.tabId);
    }
    sendResponse(response);
  });
}

// ************************
// Starts background script
// ************************

(function() {
  // Loads the Disconnect.me simple trackers list
  fetch('data/data.json')
      .then((response) => response.json())
      .then((response) => {
        trackers = new Set(response.trackers);
        window.tm = tm; // Debug purposes
        window.trackers = trackers; // Debug purposes
        initEventListeners();
      });
})();
