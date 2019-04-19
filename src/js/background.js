'use strict';

import TabsManager from './classes/tabs-manager';
import {MSG_TYPE} from './utils/constants';

const tm = new TabsManager();

window.tm = tm;


/**
 * Handles the onBeforeRequest event
 * @param {WebRequestBodyDetails} details
 * @return {Object}
 */
function onBeforeRequestListener(details) {
  if (details.url.startsWith('chrome://')) {
    return;
  }
  if (details.type === 'main_frame') {
    tm.removeTab(details.tabId);
    return;
  }
  if (details.tabId < 0) {
    return {cancel: true};
  }
  if (!tm.isTabSaved(details.tabId)) {
    tm.saveTabWithURL(details.tabId, details.initiator);
  }
  const requestDomain = tm.getDomain(details.url);
  if (tm.isThirdPartyDomain(details.tabId, requestDomain)) {
    tm.addThirdPartyDomainFromTab(requestDomain, details.tabId);
  }
}

/**
 *  Starting API events listeners
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  tm.removeTab(tabId);
});

chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestListener,
    {urls: ['http://*/*', 'https://*/*']}
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const response = {};
  if (message.type === MSG_TYPE.GET_THIRD_PARTY_DOMAINS) {
    response.domains = tm.getThirdPartyDomainsByTab(message.tabId);
  }
  sendResponse(response);
});
