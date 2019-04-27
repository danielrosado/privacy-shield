/* global $ */

'use strict';

import {DomainState, MessageType} from './utils/constants';

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
 * Shows the information and the table of third-party domains
 * when the extension is enabled for that domain
 * @param {Object} response
 */
function showExtensionEnabledCard(response) {
  const $cardBody = $('.card-body');
  let blockedCount = 0;
  // Builds third-party domains table
  for (const domain of response.thirdPartyDomains) {
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
  const $text = $cardBody.find('#extensionEnabledCardText');
  if (response.firstPartyDomain) {
    $text.find('.domainName').html(`<b>${response.firstPartyDomain}</b>`);
  }
  $text.find('#numTrackers').html(`<b>${blockedCount}</b>`);
  $text.show();
  if (response.thirdPartyDomains.length) {
    $cardBody.find('#tableDomains').show();
  }
}

/**
 * Shows the information when the extension is disabled at that domain
 * @param {object} response
 */
function showExtensionDisabledCard(response) {
  const $cardBody = $('.card-body');
  const $text = $cardBody.find('#extensionDisabledCardText');
  $text.find('.domainName').html(`<b>${response.firstPartyDomain}</b>`);
  const $cardHeader = $('.card-header');
  $cardHeader.find('#enablementSwitch').prop('checked', false);
  $cardHeader.find('#enablementState').text('disabled');
  $text.show();
}

/**
 * Sends a message from popup
 * @param {object} message
 * @param {function} responseCallback
 */
function sendMessageFromPopup(message, responseCallback=undefined) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    message.tabId = tabs[0].id;
    if (responseCallback !== undefined) {
      chrome.runtime.sendMessage(message, responseCallback);
    } else {
      chrome.runtime.sendMessage(message);
    }
  });
}

/**
 * Initialiazes Chrome API event listeners
 */
function initChromeEventListeners() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MessageType.CLOSE_POPUP) {
      window.close();
    }
  });
}

/**
 * Initialiazes DOM event Listeners
 */
function initDOMEventListeners() {
  $('#btnInfo').click(function() {
    createOrActiveTab(chrome.runtime.getURL('information.html'));
  });
  $('#enablementSwitch').change(function() {
    const enabled = this.checked;
    sendMessageFromPopup({
      'type': MessageType.EXTENSION_ENABLEMENT,
      'enabled': enabled,
    });
  });
}

// ************************
// Starts popup script
// ************************

$(function() {
  initChromeEventListeners();
  initDOMEventListeners();
  $('[data-toggle="tooltip"]').tooltip();
  sendMessageFromPopup({'type': MessageType.GET_TAB_DOMAINS}, (response) => {
    if (response.extensionEnabled) {
      showExtensionEnabledCard(response);
    } else {
      showExtensionDisabledCard(response);
    }
  });
});
