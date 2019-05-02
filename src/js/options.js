/* global $ */

'use strict';

import {EXTENSION_DISABLED_DOMAINS_KEY, MessageType} from './utils/constants';

// **********************
// Functions declarations
// **********************

/**
 * Creates a new row with the given domain
 * @param {string} domain
 * @return {object} $row
 */
function createTableRow(domain) {
  const $row = $('<tr>');
  const $dataDomain = $('<td>');
  $dataDomain.text(domain);
  $row.append($dataDomain);
  const $dataAction = $('<td>');
  const $actionButton = $('<button>', {
    'class': 'btn btn-sm btn-danger btnRemove',
    'data-domain': domain,
  });
  $actionButton.append('<i class="fa fa-trash"></i> Delete');
  $dataAction.append($actionButton);
  $row.append($dataAction);
  return $row;
}

/**
 * Prints the disabled extension domains table
 */
function printDisabledExtensionDomainsTable() {
  chrome.storage.local.get(EXTENSION_DISABLED_DOMAINS_KEY, function(items) {
    const domains = items[EXTENSION_DISABLED_DOMAINS_KEY];
    if (!domains || !domains.length) {
      $('#emptyDomainsText').show();
      return;
    }
    const $table = $('.table');
    for (const domain of domains) {
      const $row = createTableRow(domain);
      $table.find('tbody').append($row);
    }
    $table.closest('.row').show();
  });
}

/**
 * Initializes DOM event listeners
 */
function initDOMEventListeners() {
  /* eslint-disable no-invalid-this */
  $('#btnAddDomain').click(function() {
    const $domain = $('#domain');
    $domain.closest('.row').show('slow');
    $domain.focus();
  });

  $('#filter').keyup(function() {
    const search = $(this).val().toLowerCase();
    $('.table tbody tr').filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(search) > -1);
    });
  });

  $('#add').click(function() {
    const domain = $('#domain').val();
    const $row = createTableRow(domain);
    const $table = $('.table');
    chrome.runtime.sendMessage({
      'type': MessageType.UPDATE_EXTENSION_ENABLEMENT,
      'enabled': false,
      'domain': domain,
    }, () => {
      $('#emptyDomainsText').hide();
      $table.find('tbody').append($row);
      $table.closest('.row').show();
    });
  });

  $('#cancel').click(function() {
    const $domain = $('#domain');
    $domain.closest('.row').hide('slow');
    $domain.val('');
  });

  $('.table').delegate('.btnRemove', 'click', function() {
    const domain = $(this).data('domain');
    chrome.runtime.sendMessage({
      'type': MessageType.UPDATE_EXTENSION_ENABLEMENT,
      'enabled': true,
      'domain': domain,
    }, () => {
      $(this).closest('tr').remove();
      if (!$('tbody').find('tr').length) {
        $('#emptyDomainsText').show();
        $('.table').closest('.row').hide();
      }
    });
  });
  /* eslint-enable no-invalid-this */
}

// ************************
// Starts options script
// ************************

$(function() {
  initDOMEventListeners();
  printDisabledExtensionDomainsTable();
});
