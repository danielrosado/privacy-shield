'use strict';

import {GET_THIRD_PARTY_DOMAINS_TAB} from './utils/constants';

let popupData = {};

/**
 * Prints popup info
 */
function printPopup() {
  for (let domain of popupData.domains) {
    let p = document.createElement('p');
    p.innerText = domain;
    document.querySelector('body').appendChild(p);
  }
}

/**
 * Initializes the popup script
 */
function init() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    chrome.runtime.sendMessage(
      {
        'type': GET_THIRD_PARTY_DOMAINS_TAB,
        'tabId': tab.id,
      },
      (response) => {
        popupData.domains = response;
        printPopup();
      },
    );
  });
}


document.addEventListener('DOMContentLoaded', () => {
  init();
});
