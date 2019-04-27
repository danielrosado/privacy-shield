/* global $ */

'use strict';

import {MessageType, DomainState} from './utils/constants';

// **********************
// Functions declarations
// **********************

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
 * Loads table of third-party domains
 * @param {Object} domains
 */
function showTabDomainsCard(domains) {
  const $cardBody = $('.card-body');
  let blockedCount = 0;
  for (const domain of domains.thirdPartyDomains) {
    // Add new row
    const $row = $('<tr>');
    const $dataDomain = $('<td>');
    $dataDomain.text(domain.name);
    $row.append($dataDomain);
    const $dataState = $('<td>');
    const $badge = $('<span>', {class: 'badge'});
    switch (domain.state) {
      case DomainState.BLOCKED:
        $badge.addClass('badge-danger');
        $badge.append('<i class="fa fa-ban"></i> Blocked');
        blockedCount++;
        break;
      case DomainState.COOKIE_BLOCKED:
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
  if (domains.firstPartyDomain) {
    $text.find('#fp-domain').html(`<b>${domains.firstPartyDomain}</b>`);
  }
  $text.find('#num-trackers').html(`<b>${blockedCount}</b>`);
  $text.show();
  if (domains.thirdPartyDomains.length) {
    $cardBody.find('#table-domains').show();
  }
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
      'type': MessageType.GET_TAB_DOMAINS,
      'tabId': tabs[0].id,
    }, (response) => {
      showTabDomainsCard(response);
      initEventListeners();
    });
  });
});
