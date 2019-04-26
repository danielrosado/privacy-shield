/* global $ */

'use strict';

import {DOMAIN_STATE, MSG_TYPE} from './utils/constants';

// **********************
// Functions declarations
// **********************

/**
 * Loads table of third-party domains
 * @param {array} domains
 */
function loadThirdPartyDomainsTable(domains) {
  const $cardBody = $('.card-body');
  let blockedCount = 0;
  for (const domain of domains) {
    // Add new row
    const $row = $('<tr>');
    const $dataDomain = $('<td>');
    $dataDomain.text(domain.name);
    $row.append($dataDomain);
    const $dataState = $('<td>');
    const $badge = $('<span>', {class: 'badge'});
    switch (domain.state) {
      case DOMAIN_STATE.BLOCKED:
        $badge.addClass('badge-danger');
        $badge.append('<i class="fa fa-ban"></i> Blocked');
        blockedCount++;
        break;
      case DOMAIN_STATE.COOKIE_BLOCKED:
        $badge.addClass('badge-warning');
        $badge.append('<i class="fa fa-warning"></i> Cookies');
        break;
      default:
        $badge.addClass('badge-success');
        $badge.append('<i class="fa fa-check"></i> Allowed');
    }
    $dataState.append($badge);
    $row.append($dataState);
    $cardBody.find('tbody').append($row);
  }
  // Add info and show it
  const $text = $cardBody.find('.card-text');
  $text.find('#num-domains').html(`<b>${domains.length}</b>`);
  $text.find('#num-trackers').html(`<b>${blockedCount}</b>`);
  $text.show();
  if (domains.length) {
    $cardBody.find('#table-domains').show();
  }
}

/**
 * Opens or actives a new tab with the given URL
 * @param {string} url
 */
function createOrActiveTab(url) {
  chrome.tabs.query({}, (tabs) => {
    let tabId;
    for (const tab of tabs) {
      if (tab.url === url) {
        tabId = tab.id;
        break;
      }
    }
    if (tabId !== undefined) {
      chrome.tabs.update(tabId, {selected: true});
    } else {
      chrome.tabs.create({url: url, active: true});
    }
  });
}

/**
 * Initialiazes DOM event Listeners
 */
function initEventListeners() {
  $('#btn-info').click(function() {
    createOrActiveTab(chrome.runtime.getURL('information.html'));
  });
}

// ************************
// Starts popup script
// ************************

$(function() {
  $('[data-toggle="tooltip"]').tooltip();
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.runtime.sendMessage({
      'type': MSG_TYPE.GET_THIRD_PARTY_DOMAINS,
      'tabId': tabs[0].id,
    }, (response) => {
      loadThirdPartyDomainsTable(response.domains);
      initEventListeners();
    });
  });
});
