'use strict';

import {MSG_TYPE} from './utils/constants';

/**
 * Initializes the popup script
 */
function init() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.runtime.sendMessage({
      'type': MSG_TYPE.GET_THIRD_PARTY_DOMAINS,
      'tabId': tabs[0].id,
    }, (response) => {
    // Loading domains
      for (const domain of response.domains) {
        const p = document.createElement('p');
        p.innerText = domain;
        document.querySelector('body').appendChild(p);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
