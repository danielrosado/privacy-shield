'use strict';

import parseDomain from 'parse-domain';
import TabsManager from './classes/tabs-manager';
import {
  DomainStateType,
  EXTENSION_DISABLED_DOMAINS_KEY,
  MessageType,
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
 * Returns the string representation of a domain
 * @param {object} domain
 * @return {string}
 */
function domainToString(domain) {
  if (domain) {
    return `${domain.subdomain}.${domain.domain}.${domain.tld}`
        .replace(/^\.|\.$/g, '');
  }
}

/**
 * Return if extension is enabled at given domain or not
 * @param {object} domain
 * @return {boolean}
 */
function isExtensionEnabledAtDomain(domain) {
  return !extensionDisabledDomains.has(domainToString(domain));
}

/**
 * Enables or disables the extension given tab
 * @param {string} domain
 * @param {boolean} enabled
 */
function updateExtensionEnablement(domain, enabled) {
  if (!domain) {
    return;
  }
  if (enabled) {
    extensionDisabledDomains.delete(domain);
  } else {
    extensionDisabledDomains.add(domain);
  }
  const items = {
    [EXTENSION_DISABLED_DOMAINS_KEY]: Array.from(extensionDisabledDomains),
  };
  chrome.storage.local.set(items, () => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        const d = parseDomain(tab.url);
        if (domainToString(d) === domain) {
          chrome.tabs.reload(tab.id, () => {
            chrome.runtime.sendMessage({type: MessageType.CLOSE_POPUP});
          });
        }
      }
    });
  });
}

/**
 * Handles the onBeforeRequest synchronous event
 * @param {WebRequestDetails} details
 * @return {BlockingResponse} blockingResponse
 */
function onBeforeRequestCallback(details) {
  if (details.url.startsWith('chrome://') || details.tabId < 0) {
    return {};
  }
  if (details.type === 'main_frame') {
    const domain = parseDomain(details.url);
    tm.removeTab(details.tabId);
    const enabled = isExtensionEnabledAtDomain(domain);
    tm.saveTabAndDomain(details.tabId, domain, enabled);
    return {};
  }
  if (!tm.isTabSaved(details.tabId) || !tm.isExtensionEnabledAtTab(details.tabId)) {
    return {};
  }
  const requestDomain = parseDomain(details.url);
  if (!tm.isThirdPartyDomain(details.tabId, requestDomain)) {
    return {};
  }
  // Set third-party domain state and BlockingResponse object
  const blockingResponse = {};
  const d = `${requestDomain.domain}.${requestDomain.tld}`;
  if (trackers.has(d) ) {
    requestDomain.state = DomainStateType.BLOCKED;
    blockingResponse.cancel = true;
  } else if (yellowList.has(d)) {
    requestDomain.state = DomainStateType.COOKIE_BLOCKED;
  } else {
    requestDomain.state = DomainStateType.ALLOWED;
  }
  tm.addThirdPartyDomainToTab(details.tabId, requestDomain);
  return blockingResponse;
}

/**
 * Handles the onBeforeSendHeaders synchronous event
 * @param {WebRequestHeadersDetails} details
 * @return {BlockingResponse} blockingResponse
 */
function onBeforeSendHeadersCallback(details) {
  if (!tm.isTabSaved(details.tabId) || !tm.isExtensionEnabledAtTab(details.tabId)) {
    return {};
  }
  const requestDomain = parseDomain(details.url);
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
  if (!tm.isTabSaved(details.tabId) || !tm.isExtensionEnabledAtTab(details.tabId)) {
    return {};
  }
  const requestDomain = parseDomain(details.url);
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
    const response = {};
    switch (message.type) {
      case MessageType.GET_TAB_DATA:
        response.firstPartyDomain = tm.getFirstPartyDomainByTab(message.tabId);
        response.thirdPartyDomains = tm.getThirdPartyDomainsByTab(message.tabId);
        response.extensionEnabled = tm.isExtensionEnabledAtTab(message.tabId);
        break;
      case MessageType.UPDATE_EXTENSION_ENABLEMENT:
        let domain;
        if (message.hasOwnProperty('domain')) {
          domain = message.domain;
        } else {
          domain = tm.getFirstPartyDomainByTab(message.tabId);
        }
        updateExtensionEnablement(domain, message.enabled);
    }
    sendResponse(response);
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
