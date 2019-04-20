'use strict';

import {MSG_TYPE, DOMAIN_STATUS} from './utils/constants';

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
    const p = document.createElement('p');
    p.innerText = `${domains.length} third-parties found at ${tab.url}`;
    body.appendChild(p);
    body.appendChild(document.createElement('hr'));
    for (const domain of domains) {
      const div = document.createElement('div');
      div.innerHTML = `${domain.subdomain}.${domain.domain}.${domain.tld}
&nbsp;&nbsp;&nbsp;&nbsp
<b>${domain.status === DOMAIN_STATUS.BLOCKED ? 'BLOCKED' : 'ALLOWED'}</b>`;
      body.appendChild(div);
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
