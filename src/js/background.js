'use strict';

import TabsManager from './classes/tabs-manager';
import Domain from './classes/domain';
import {
  MessageType,
  DomainStateType,
  EXTENSION_DISABLED_DOMAINS_KEY,
} from './utils/constants';

// ****************************
// Global variables declaration
// ****************************

const tm = new TabsManager();
let extensionDisabledDomains;
let trackers;
let yellowList;

// **********************
// Functions declarations
// **********************

/**
 * Handles the onBeforeRequest synchronous event
 * @param {WebRequestDetails} details
 * @return {BlockingResponse} blockingResponse
 */
function onBeforeRequestCallback(details) {
  if (details.url.startsWith('chrome://') || details.tabId === -1) {
    return {};
  }
  const requestDomain = new Domain(details.url);
  if (details.type === 'main_frame') {
    tm.removeTab(details.tabId);
    const enabled = !extensionDisabledDomains.has(requestDomain.toString());
    tm.saveTabAndDomain(details.tabId, requestDomain, enabled);
    return {};
  }
  if (!tm.isTabSaved(details.tabId) || !tm.isExtensionEnabled(details.tabId)
    || !tm.isThirdPartyDomain(details.tabId, requestDomain)) {
    return {};
  }
  // Set third-party domain state and return BlockingResponse object
  const blockingResponse = {};
  const requestDomainStr = requestDomain.toString(true);
  if (trackers.has(requestDomainStr) ) {
    requestDomain.state = DomainStateType.BLOCKED;
    blockingResponse.cancel = true;
  } else if (yellowList.has(requestDomainStr)) {
    requestDomain.state = DomainStateType.COOKIE_BLOCKED;
  } else {
    requestDomain.state = DomainStateType.ALLOWED;
  }
  const added = tm.addThirdPartyDomainToTab(details.tabId, requestDomain);
  if (added && requestDomain.state === DomainStateType.BLOCKED) {
    tm.updateBlockedDomainCount(details.tabId);
    tm.updateBadge(details.tabId);
  }
  return blockingResponse;
}

/**
 * Handles the onBeforeSendHeaders synchronous event
 * @param {WebRequestHeadersDetails} details
 * @return {BlockingResponse} blockingResponse
 */
function onBeforeSendHeadersCallback(details) {
  if (!tm.isTabSaved(details.tabId) || !tm.isExtensionEnabled(details.tabId)) {
    return {};
  }
  const requestDomain = new Domain(details.url);
  const state = tm.getThirdPartyDomainState(details.tabId, requestDomain);
  if (state === DomainStateType.COOKIE_BLOCKED) {
    const requestHeaders = details.requestHeaders.filter((header) => {
      const headerName = header.name.toLowerCase();
      return headerName !== 'cookie' && headerName !== 'referer';
    });
    return {requestHeaders: requestHeaders};
  }
  return {};
}

/**
 * Handles the onBeforeSendHeaders synchronous event
 * @param {WebResponseHeadersDetails} details
 * @return {BlockingResponse} blockingResponse
 */
function onHeadersReceivedCallback(details) {
  if (!tm.isTabSaved(details.tabId) || !tm.isExtensionEnabled(details.tabId)) {
    return {};
  }
  const requestDomain = new Domain(details.url);
  const state = tm.getThirdPartyDomainState(details.tabId, requestDomain);
  if (state === DomainStateType.COOKIE_BLOCKED) {
    const responseHeaders = details.responseHeaders.filter((header) =>
      header.name.toLowerCase() !== 'set-cookie'
    );
    return {responseHeaders: responseHeaders};
  }
  return {};
}

/**
 * Enables or disables the extension on a web site
 * @param {object} message
 */
function updateExtensionEnablement(message) {
  if (!message.hasOwnProperty('domain')) { // from popup switch
    if (tm.isTabSaved(message.tabId)) {
      message.domain = tm.getFirstPartyDomainByTab(message.tabId);
    } else {
      message.domain = new Domain(message.tabURL).toString();
    }
  }
  if (message.enabled && message.domain) {
    extensionDisabledDomains.delete(message.domain);
  } else {
    extensionDisabledDomains.add(message.domain);
  }
  const items = {
    [EXTENSION_DISABLED_DOMAINS_KEY]: Array.from(extensionDisabledDomains),
  };
  chrome.storage.local.set(items, () => {
    if (tm.isTabSaved(message.tabId)) {
      tm.reloadDomainTabs(message.domain);
    } else {
      chrome.tabs.reload(message.tabId);
    }
    chrome.runtime.sendMessage({type: MessageType.CLOSE_POPUP});
  });
}

/**
 * Gets the information of the tab
 * @param {object} message
 * @return {object} response
 */
function getTabData(message) {
  const response = {};
  if (tm.isTabSaved(message.tabId)) {
    response.firstPartyDomain = tm.getFirstPartyDomainByTab(message.tabId);
    response.extensionEnabled = tm.isExtensionEnabled(message.tabId);
  } else {
    if (message.tabURL.startsWith('chrome://')) {
      response.extensionEnabled = false;
    } else {
      response.firstPartyDomain = new Domain(message.tabURL).toString();
      response.extensionEnabled = !extensionDisabledDomains
          .has(response.firstPartyDomain);
    }
  }
  response.thirdPartyDomains = tm.getThirdPartyDomainsByTab(message.tabId);
  return response;
}

/**
 * Initializes Chrome API events listeners
 */
function initChromeEventListeners() {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.storage.local.set({[EXTENSION_DISABLED_DOMAINS_KEY]: []});
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    tm.removeTab(tabId);
  });

  chrome.webRequest.onBeforeRequest.addListener(
      onBeforeRequestCallback,
      {urls: ['http://*/*', 'https://*/*']},
      ['blocking']
  );

  chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeadersCallback,
      {urls: ['http://*/*', 'https://*/*']},
      ['blocking', 'requestHeaders', 'extraHeaders']
  );

  chrome.webRequest.onHeadersReceived.addListener(
      onHeadersReceivedCallback,
      {urls: ['http://*/*', 'https://*/*']},
      ['blocking', 'responseHeaders', 'extraHeaders']
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case MessageType.GET_TAB_DATA:
        sendResponse(getTabData(message));
        break;
      case MessageType.UPDATE_EXTENSION_ENABLEMENT:
        updateExtensionEnablement(message);
    }
  });
}

// ************************
// Starts background script
// ************************

(function() {
  // Load storaged settings
  chrome.storage.local.get(EXTENSION_DISABLED_DOMAINS_KEY, (items) => {
    extensionDisabledDomains = new Set(items[EXTENSION_DISABLED_DOMAINS_KEY]);
    // Loads the Disconnect.me simple trackers list
    // and the Privacy Badger yellow list
    fetch('data/data.json')
        .then((response) => response.json())
        .then((response) => {
          trackers = new Set(response.trackers);
          yellowList = new Set(response.yellowList);
          initChromeEventListeners();
        });
  });
})();
