'use strict';

import $ from 'jquery';
import {MSG_TYPE, DOMAIN_STATUS} from './utils/constants';

// **********************
// Functions declarations
// **********************

/**
 * Loads table of third-party domains
 * @param {array} domains
 */
const loadThirdPartyDomainsTable = (domains) => {
  const $cardBody = $('.card-body');
  let blockedCount = 0;
  for (const domain of domains) {
    const $tr = $('<tr>');
    const $tdDomain = $('<td>');
    $tdDomain.text(`${domain.subdomain}.${domain.domain}.${domain.tld}`);
    $tr.append($tdDomain);
    const $tdStatus = $('<td>');
    const $badge = $('<span>', {'class': 'badge'});
    if (domain.status === DOMAIN_STATUS.BLOCKED) {
      $badge.addClass('badge-danger');
      $badge.text('Blocked');
      blockedCount++;
    } else {
      $badge.addClass('badge-success');
      $badge.text('Allowed');
    }
    $tdStatus.append($badge);
    $tr.append($tdStatus);
    $cardBody.find('tbody').append($tr);
  }
  const message = `<b>${domains.length}</b> third-party
 domains were found at current web site.<br><b>${blockedCount}</b> third-party
 domains were detected as trackers and they were blocked.`;
  $cardBody.find('.card-text').html(message);
  if (domains.length) {
    $cardBody.find('.table-responsive').show();
  }
};

// ************************
// Starts popup script
// ************************

$(function() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.runtime.sendMessage({
      'type': MSG_TYPE.GET_THIRD_PARTY_DOMAINS,
      'tabId': tabs[0].id,
    }, (response) => {
      loadThirdPartyDomainsTable(response.domains);
    });
  });
});
