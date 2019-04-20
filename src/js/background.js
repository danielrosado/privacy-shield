'use strict';

import TabsManager from './classes/tabs-manager';
import {MSG_TYPE, DOMAIN_STATUS} from './utils/constants';

// ****************************
// Global variables declaration
// ****************************

const tm = new TabsManager();
let trackers;

// **********************
// Functions declarations
// **********************

/**
 * Handles the onBeforeRequest event
 * @param {WebRequestBodyDetails} details
 * @return {Object}
 */
const onBeforeRequestListener = (details) => {
  if (details.url.startsWith('chrome://')) {
    return {};
  }
  if (details.type === 'main_frame') {
    tm.removeTab(details.tabId);
    return {};
  }
  if (details.tabId < 0) {
    return {cancel: true};
  }
  if (!tm.isTabSaved(details.tabId)) {
    tm.saveTabWithURL(details.tabId, details.initiator);
  }
  const requestDomain = tm.getDomain(details.url);
  if (!tm.isThirdPartyDomain(details.tabId, requestDomain)) {
    return {};
  }
  if (trackers.has(`${requestDomain.domain}.${requestDomain.tld}`)) {
    requestDomain.status = DOMAIN_STATUS.BLOCKED;
  } else {
    requestDomain.status = DOMAIN_STATUS.ALLOWED;
  }
  tm.addThirdPartyDomainFromTab(requestDomain, details.tabId);
  if (requestDomain.status === DOMAIN_STATUS.BLOCKED) {
    return {cancel: true};
  }
  return {};
};

/**
 *  Adds API events listeners
 */
const initEventListeners = () => {
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
};

// ************************
// Starts background script
// ************************

(() => {
  // Loads the Disconnect.me simple trackers list
  fetch(chrome.runtime.getURL('data/data.json'))
      .then((response) => response.json())
      .then((response) => {
        trackers = new Set(response.trackers);
        window.tm = tm; // Debug purposes
        window.trackers = trackers; // Debug purposes
        initEventListeners();
      });
})();
