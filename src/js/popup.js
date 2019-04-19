'use strict';

import {MSG_TYPE} from './utils/constants';

/**
 * Initializes the popup script
 */
function init() {
  /**
   * Print third-party domains
   * @param {array} domains
   * @param {Tab} tab
   */
  function printThirdPartyDomains(domains, tab) {
    const body = document.querySelector('body');
    let p = document.createElement('p');
    p.innerText = `${domains.length} third-parties found at ${tab.url}`;
    body.appendChild(p);
    body.appendChild(document.createElement('hr'));
    for (const domain of domains) {
      p = document.createElement('p');
      p.innerText = `${domain.subdomain}.${domain.domain}.${domain.tld}`;
      body.appendChild(p);
    }
  }

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.runtime.sendMessage({
      'type': MSG_TYPE.GET_THIRD_PARTY_DOMAINS,
      'tabId': tabs[0].id,
    }, (response) => {
      printThirdPartyDomains(response.domains, tabs[0]);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
