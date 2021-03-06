'use strict';

import {DomainStateType, MessageType} from './utils/constants';

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
 * Sends a message from popup
 * @param {object} message
 * @param {function} responseCallback
 */
function sendMessageFromPopup(message, responseCallback) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    message.tabId = tabs[0].id;
    message.tabURL = tabs[0].url;
    if (responseCallback === undefined) {
      chrome.runtime.sendMessage(message);
    } else {
      chrome.runtime.sendMessage(message, responseCallback);
    }
  });
}

/**
 * Creates a new row with the given domain
 * @param {object} domain
 * @return {object} $row
 */
function createTableRow(domain) {
  const $row = $('<tr>');
  const $dataDomain = $('<td>');
  $dataDomain.text(domain.name);
  $row.append($dataDomain);
  const $dataState = $('<td>');
  const $badge = $('<span>', {class: 'badge'});
  switch (domain.state) {
    case DomainStateType.BLOCKED:
      $badge.addClass('badge-danger');
      $badge.append('<i class="fa fa-ban"></i> Blocked');
      break;
    case DomainStateType.COOKIE_BLOCKED:
      $badge.addClass('badge-warning');
      $badge.append('<i class="fa fa-warning"></i> Cookies');
      break;
    default:
      $badge.addClass('badge-success');
      $badge.append('<i class="fa fa-check"></i> Allowed');
  }
  $dataState.append($badge);
  $row.append($dataState);
  return $row;
}

/**
 * Prints the popup with the information and the table of third-party domains
 * found at that tab when the extension is enabled or disabled for that domain
 * @param {Object} tabData
 */
function printPopup(tabData) {
  const $cardBody = $('.card-body');
  if (tabData.extensionEnabled) {
    // Builds third-party domains table
    if (tabData.thirdPartyDomains.length) {
      const $tbody = $cardBody.find('tbody');
      for (const domain of tabData.thirdPartyDomains) {
        $tbody.append(createTableRow(domain));
      }
      $cardBody.find('#domains').show();
    }
    // Add info and show it
    const $text = $cardBody.find('#extension-enabled-info');
    $text.find('.domain-name').html(`<b>${tabData.firstPartyDomain}</b>`);
    $text.find('#num-trackers').html(`<b>${$('.badge-danger').length}</b>`);
    $text.show();
  } else { // disabled
    const $text = $cardBody.find('#extension-disabled-info');
    const $cardHeader = $('.card-header');
    if (tabData.firstPartyDomain.startsWith('chrome')) {
      $cardHeader.find('#enablement-toggle').prop('disabled', true);
    } else {
      $text.find('.domain-name').html(`<b>${tabData.firstPartyDomain}</b>`);
    }
    $cardHeader.find('#enablement-toggle').prop('checked', false);
    $cardHeader.find('#enablement-state').text('disabled');
    $text.show();
  }
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
 * Initialiazes DOM event listeners
 */
function initDOMEventListeners() {
  /* eslint-disable no-invalid-this */
  $('#info').click(function() {
    createOrActiveTab(chrome.runtime.getURL('information.html'));
  });

  $('#options').click(function() {
    chrome.runtime.openOptionsPage();
  });

  $('#enablement-toggle').change(function() {
    const enabled = this.checked;
    sendMessageFromPopup({
      'type': MessageType.UPDATE_EXTENSION_ENABLEMENT,
      'enabled': enabled,
    });
  });
  /* eslint-enable no-invalid-this */
}

// ************************
// Starts popup script
// ************************

$(function() {
  initChromeEventListeners();
  initDOMEventListeners();
  $('[data-toggle="tooltip"]').tooltip();
  sendMessageFromPopup({'type': MessageType.GET_TAB_DATA}, (response) => {
    printPopup(response);
  });
});
