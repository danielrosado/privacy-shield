'use strict';

import parseDomain from 'parse-domain';
import TabsManager from './classes/tabs-manager';
import {MSG_TYPE, DOMAIN_STATE} from './utils/constants';

// ****************************
// Global variables declaration
// ****************************

const tm = new TabsManager();
let trackers;
let yellowList;

// **********************
// Functions declarations
// **********************

/**
 * Handles the onBeforeRequest synchronous event
 * @param {WebRequestBodyDetails} details
 * @return {BlockingResponse} blockingResponse
 */
function onBeforeRequestCallback(details) {
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
  // Set third-party domain state and BlockingResponse object
  const blockingResponse = {};
  const d = `${requestDomain.domain}.${requestDomain.tld}`;
  if (yellowList.has(d)) {
    requestDomain.state = DOMAIN_STATE.COOKIE_BLOCKED;
  } else if (trackers.has(d) ) {
    requestDomain.state = DOMAIN_STATE.BLOCKED;
    blockingResponse.cancel = true;
  } else {
    requestDomain.state = DOMAIN_STATE.ALLOWED;
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
  if (details.url.startsWith('chrome://')) {
    return {};
  }
  if (!tm.isTabSaved(details.tabId)) {
    return {};
  }
  const requestDomain = parseDomain(details.url);
  const state = tm.getThirdPartyDomainState(details.tabId, requestDomain);
  if (state === DOMAIN_STATE.COOKIE_BLOCKED) {
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
  if (details.url.startsWith('chrome://')) {
    return {};
  }
  if (!tm.isTabSaved(details.tabId)) {
    return {};
  }
  const requestDomain = parseDomain(details.url);
  const state = tm.getThirdPartyDomainState(details.tabId, requestDomain);
  if (state === DOMAIN_STATE.COOKIE_BLOCKED) {
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
function initEventListeners() {
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
      ['requestHeaders', 'extraHeaders']
  );

  chrome.webRequest.onHeadersReceived.addListener(
      onHeadersReceivedCallback,
      {urls: ['http://*/*', 'https://*/*']},
      ['responseHeaders', 'extraHeaders']
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
  // and the Privacy Badger yellow list
  fetch('data/data.json')
      .then((response) => response.json())
      .then((response) => {
        trackers = new Set(response.trackers);
        yellowList = new Set(response.yellowList);
        window.tm = tm; // Debug purposes
        window.trackers = trackers; // Debug purposes
        window.yellowList = yellowList; // Debug purposes
        initEventListeners();
      });
})();
