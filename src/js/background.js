'use strict';

import ThirdPartyDomainsManager from './classes/third-party-domains-manager';
import {GET_THIRD_PARTY_DOMAINS_TAB} from './utils/constants';

const tpdm = new ThirdPartyDomainsManager();

/**
 * Check if request details are valid
 * @param {WebRequestBodyDetails} requestDetails
 * @return  {boolean}
 */
function validRequestDetails(requestDetails) {
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
  chrome.tabs.get(details.tabId, function(tab) {
    if (tpdm.isThirdPartyDomain(tab.url, details.url)) {
      tpdm.addThirdPartyDomainFromTab(details.url, details.tabId);
    }
  });
}

/**
 *  Starting API events listeners
 */

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url !== undefined) {
    tpdm.clearThirdPartyDomainsByTab(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  tpdm.removeTab(tabId);
});

chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestListener,
    {urls: ['http://*/*', 'https://*/*']}
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let response;
  if (message.type === GET_THIRD_PARTY_DOMAINS_TAB) {
    response = tpdm.getThirdPartyDomainsByTab(message.tabId);
  }
  sendResponse(response);
});
