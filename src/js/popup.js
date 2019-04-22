'use strict';

import {DOMAIN_STATUS, MSG_TYPE} from './utils/constants';

// **********************
// Functions declarations
// **********************

/**
 * Loads table of third-party domains
 * @param {array} domains
 */
const loadThirdPartyDomainsTable = (domains) => {
  const cardBody = document.querySelector('.card-body');
  let blockedCount = 0;
  for (const domain of domains) {
    const row = document.createElement('tr');
    const dataDomain = document.createElement('td');
    dataDomain.innerText = `${domain.subdomain}.${domain.domain}.${domain.tld}`;
    row.appendChild(dataDomain);
    const dataStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge';
    if (domain.status === DOMAIN_STATUS.BLOCKED) {
      badge.className += ' badge-danger';
      badge.innerText = 'Blocked';
      blockedCount++;
    } else {
      badge.className += ' badge-success';
      badge.innerText = 'Allowed';
    }
    dataStatus.appendChild(badge);
    row.appendChild(dataStatus);
    cardBody.querySelector('tbody').appendChild(row);
  }
  cardBody.querySelector('.card-text').innerHTML =
    `<b>${domains.length}</b> third-party domains were found at current web
site.<br><b>${blockedCount}</b> third-party domains were detected as trackers
and they were blocked.`;
  if (domains.length) {
    cardBody.querySelector('.table-responsive').style.display = 'block';
  }
};

// ************************
// Starts popup script
// ************************

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.runtime.sendMessage({
      'type': MSG_TYPE.GET_THIRD_PARTY_DOMAINS,
      'tabId': tabs[0].id,
    }, (response) => {
      loadThirdPartyDomainsTable(response.domains);
    });
  });
});
