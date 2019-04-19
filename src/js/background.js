'use strict';

import DomainsManager from './classes/domains-manager';
import {MSG_TYPE} from './utils/constants';

const dm = new DomainsManager();

window.dm = dm;

/**
 * Check if request details are valid
 * @param {WebRequestBodyDetails} requestDetails
 * @return  {boolean}
 */
function validRequestDetails(requestDetails) {
  // TODO check frame
  return requestDetails.url !== undefined
    && (requestDetails.tabId !== undefined && requestDetails.tabId > 0);
}

/**
 * Handles the onBeforeRequest event
 * @param {WebRequestBodyDetails} details
 */
function onBeforeRequestListener(details) {
  if (!validRequestDetails(details)) {
    return;
  }
  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      return;
    }
    const tabDomain = dm.getDomain(tab.url);
    const requestDomain = dm.getDomain(details.url);
    if (dm.isThirdPartyDomain(tabDomain, requestDomain)) {
      dm.addDomainFromTab(requestDomain, details.tabId);
    }
  });
}

/**
 *  Starting API events listeners
 */

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url !== undefined) {
    dm.clearDomainsByTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  dm.removeTab(tabId);
});

chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestListener,
    {urls: ['http://*/*', 'https://*/*']}
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const response = {};
  if (message.type === MSG_TYPE.GET_THIRD_PARTY_DOMAINS) {
    response.domains = dm.getDomainsByTab(message.tabId);
  }
  sendResponse(response);
});
