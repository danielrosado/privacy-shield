'use strict';

import $ from 'jquery';
import {MSG_TYPE, DOMAIN_STATUS} from './utils/constants';

// **********************
// Functions declarations
// **********************

/**
 * Print third-party domains
 * @param {array} domains
 * @param {Tab} tab
 */
const printThirdPartyDomains = (domains, tab) => {
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
  $cardBody.find('.card-text').html(`<b>${domains.length}</b> third-parties
 where found at current web site.<br><b>${blockedCount}</b> where blocked.`);
  $('.card').show();
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
      printThirdPartyDomains(response.domains, tabs[0]);
    });
  });
});
