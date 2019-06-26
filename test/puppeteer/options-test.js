'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const {assert} = require('chai');
const extensionName = 'Privacyst';

describe('Options UI testing', function() {
  // **********************
  // Variables declarations
  // **********************

  let browser;
  let page;

  // ************************
  // Testing settings
  // ************************

  this.timeout(20000); // default is 2 seconds and that may not be enough to boot browsers and pages.

  before(async function() {
    const extensionPath = path.resolve(__dirname, '../../dist');
    browser = await puppeteer.launch({
      headless: false, // extension are allowed only in head-full mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    page = await browser.newPage();
    await page.waitFor(2000); // arbitrary wait time
    const targets = await browser.targets();
    const extensionTarget = targets.find(({_targetInfo}) => {
      return _targetInfo.title === extensionName && _targetInfo.type === 'background_page';
    });
    const extensionUrl = extensionTarget._targetInfo.url || '';
    const extensionID = extensionUrl.split('/')[2];
    await page.goto(`chrome-extension://${extensionID}/options.html`);
  });

  beforeEach(async function() {
    await page.evaluate(() => {
      document.querySelector('#domain').value = '';
      let buttons = document.querySelectorAll('.btn-remove-domain');
      for (let button of buttons) {
        button.click();
      }
    });
    await page.waitForFunction(() => !document.querySelectorAll('tbody tr').length)
  });

  afterEach(async function() {
    // await page.evaluate(() => {
    //   document.querySelector('#cancel').click()
    // });
    // await page.waitFor(2000);
  });

  after(async function() {
    await browser.close();
  });

  // **********************
  // Test suite
  // **********************

  it('should show a message when domains table is empty', async function() {
    const $rows = await page.$$('tbody tr');
    const emptyTableInfoDisplayValue = await page.$eval('#empty-table-info', (el) => el.style.display);

    assert.equal($rows.length, 0, 'table is not empty');
    assert.notEqual(emptyTableInfoDisplayValue, 'none', 'message is not shown');
  });

  it('should add a domain', async function() {
    const domain = 'example.org';
    await page.click('#add-domain');
    await page.type('#domain', domain);
    await page.click('#add');
    const $row = await page.waitForSelector('tbody tr');
    const [domainText, buttonDataDomainAttrValue] = await page.evaluate((row) =>
      [row.childNodes[0].textContent, row.childNodes[1].childNodes[0].getAttribute('data-domain')], $row);
    const emptyTableInfoDisplayValue = await page.$eval('#empty-table-info', (el) => el.style.display);

    assert.equal((await page.$$('tbody tr')).length, 1, 'domain was added');
    assert.equal(domainText, domain, 'domains do not match');
    assert.equal(buttonDataDomainAttrValue, domain, 'button\'s data attribute does not match');
    assert.equal(emptyTableInfoDisplayValue, 'none', 'message is shown');
  });

  it('should add a new domain', async function() {
    await page.click('#add-domain');
    await page.type('#domain', 'example.org');
    await page.click('#add');
    await page.waitForSelector('tbody tr');
    const domain = 'www.urjc.es';
    await page.type('#domain', domain);
    await page.click('#add');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 2);
    const $rows = await page.$$('tbody tr');
    const [domainText, buttonDataDomainAttrValue] = await page.evaluate((row) =>
      [row.childNodes[0].textContent, row.childNodes[1].childNodes[0].getAttribute('data-domain')], $rows[$rows.length - 1]);

    assert.equal($rows.length, 2, 'domain was not added');
    assert.equal(domainText, domain, 'domains do not match');
    assert.equal(buttonDataDomainAttrValue, domain, 'button\'s data attribute does not match');
  });

  it('should not add duplicated domain', async function() {
    const domain = 'example.org';
    await page.click('#add-domain');
    await page.type('#domain', domain);
    await page.click('#add');
    await page.waitForSelector('tbody tr');
    await page.type('#domain', domain);
    await page.click('#add');
    const $error = await page.waitForSelector('.invalid-feedback', {visible: true});
    const [errorMessage, errorDisplay] = await page.evaluate(
      (el) => [el.textContent, el.style.display], $error);
    const domainInputClasses = await page.$eval('#domain', (el) => el.className.split(' '));
    const $rows = await page.$$('tbody tr');

    assert.equal($rows.length, 1, 'duplicated domain was added');
    assert.equal(errorMessage, 'The domain was already added', 'message does not match');
    assert.notEqual(errorDisplay, 'none', 'message is not shown');
    assert.equal(domainInputClasses.length, 2, 'domain was not validated');
    assert.equal(domainInputClasses[1], 'is-invalid', 'domain was not validated');
  });

  it('should not add empty domain', async function() {
    await page.click('#add-domain');
    await page.waitFor(500); // wait for animation
    await page.click('#add');
    const $error = await page.waitForSelector('.invalid-feedback', {visible: true});
    const [errorMessage, errorDisplay] = await page.evaluate(
      (el) => [el.textContent, el.style.display], $error);
    const domainInputClasses = await page.$eval('#domain', (el) => el.className.split(' '));
    const $rows = await page.$$('tbody tr');

    assert.equal($rows.length, 0, 'empty domain was added');
    assert.equal(errorMessage, 'The domain is empty', 'message does not match');
    assert.notEqual(errorDisplay, 'none', 'message is not shown');
    assert.equal(domainInputClasses.length, 2, 'domain was not validated');
    assert.equal(domainInputClasses[1], 'is-invalid', 'domain was not validated');
  });

  it('should not add invalid domain', async function() {
    await page.click('#add-domain');
    await page.type('#domain', 'invalid-domain');
    await page.click('#add');
    const $error = await page.waitForSelector('.invalid-feedback', {visible: true});
    const [errorMessage, errorDisplay] = await page.evaluate(
      (el) => [el.textContent, el.style.display], $error);
    const domainInputClasses = await page.$eval('#domain', (el) => el.className.split(' '));
    const $rows = await page.$$('tbody tr');

    assert.equal($rows.length, 0, 'empty domain was added');
    assert.equal(errorMessage, 'The domain is not a valid URL', 'message does not match');
    assert.notEqual(errorDisplay, 'none', 'message is not shown');
    assert.equal(domainInputClasses.length, 2, 'domain was not validated');
    assert.equal(domainInputClasses[1], 'is-invalid', 'domain was not validated');
  });

  it('should remove a domain', async function() {
    await page.click('#add-domain');
    await page.type('#domain', 'example.org');
    await page.click('#add');
    await page.waitForSelector('.btn-remove-domain');
    await page.click('.btn-remove-domain');
    await page.waitForFunction(() => !document.querySelectorAll('.btn-remove-domain').length);
    const $rows = await page.$$('tbody tr');
    const emptyTableInfoDisplayValue = await page.$eval('#empty-table-info', (el) => el.style.display);

    assert.equal($rows.length, 0, 'table is not empty');
    assert.notEqual(emptyTableInfoDisplayValue, 'none', 'message is not shown');
  });

  it('should cancel adding a domain', async function() {
    await page.click('#add-domain');
    await page.type('#domain', 'example.org');
    await page.click('#cancel');
    const $rows = await page.$$('tbody tr');
    const emptyTableInfoDisplayValue = await page.$eval('#empty-table-info', (el) => el.style.display);

    assert.equal($rows.length, 0, 'table is not empty');
    assert.notEqual(emptyTableInfoDisplayValue, 'none', 'message is not shown');
  });

  it('should filter domains', async function() {
    await page.click('#add-domain');
    await page.type('#domain', 'example.org');
    await page.click('#add');
    await page.type('#domain', 'www.urjc.es');
    await page.click('#add');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 2);
    await page.type('#filter', 'urjc', {delay: 200});
    const [displayValue1, displayValue2] = await page.$$eval('tbody tr',
      (els) => [els[0].style.display, els[1].style.display]);

    assert.equal(displayValue1, 'none', 'example.org is shown');
    assert.notEqual(displayValue2, 'none', 'example.org is not shown');
  });

});
