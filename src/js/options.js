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
  const $anchor = $('<a>', {
    'href': `http://${domain}`,
    'target': '_blank',
  });
  $anchor.text(domain);
  $dataDomain.append($anchor);
  $row.append($dataDomain);
  const $dataAction = $('<td>');
  const $actionButton = $('<button>', {
    'class': 'btn btn-danger btn-xs btnRemove',
    'data-domain': domain,
  });
  $actionButton.append('<i class="fa fa-trash"></i> Remove');
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

  /**
   * Validates a domain
   * @param {string} domain
   * @return {object} response
   */
  function validate(domain) {
    const response = {valid: true};
    if (domain === '') {
      response.message = 'The domain is empty';
      response.valid = false;
      return response;
    }
    // https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
    // eslint-disable-next-line max-len
    const expression = /[-a-zA-Z0-9@:%_+.~#?&/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&/=]*)?/gi;
    const regex = new RegExp(expression);
    if (!domain.match(regex) || domain.startsWith('chrome://')) {
      response.message = 'The domain is not a valid URL';
      response.valid = false;
      return response;
    }
    $('.btnRemove').each(function() {
      if (domain === $(this).data('domain')) {
        response.message = 'The domain was already added';
        return response.valid = false;
      }
    });
    return response;
  }

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

  $(document).keyup(function(e) {
    if (e.keyCode === 27) { // ESC
      $('#cancel').trigger('click');
    }
  });

  $('#domain').keypress(function(e) {
    if (e.which === 13) { // ENTER
      $('#add').trigger('click');
    }
  });

  $('#add').click(function() {
    const $domain = $('#domain');
    const $error = $domain.closest('.input-group').find('.invalid-feedback');
    const validateResponse = validate($domain.val());
    if (!validateResponse.valid) {
      $domain.addClass('is-invalid');
      $error.text(validateResponse.message).show();
      return;
    }
    const $row = createTableRow($domain.val());
    const $table = $('.table');
    chrome.runtime.sendMessage({
      'type': MessageType.UPDATE_EXTENSION_ENABLEMENT,
      'enabled': false,
      'domain': $domain.val(),
    }, () => {
      $('#emptyDomainsText').hide();
      $domain.val('');
      $domain.removeClass('is-invalid');
      $error.text('').hide();
      $table.find('tbody').append($row);
      $table.closest('.row').show();
    });
  });

  $('#cancel').click(function() {
    const $domain = $('#domain');
    const $error = $domain.closest('.input-group').find('.invalid-feedback');
    $domain.removeClass('is-invalid');
    $domain.val('');
    $domain.closest('.row').hide('slow');
    $error.text('').hide();
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
