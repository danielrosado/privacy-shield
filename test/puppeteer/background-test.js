'use strict';

const puppeteer = require('puppeteer');
const path = require('path');

describe('Background Script testing', function() {
  this.timeout(20000); // default is 2 seconds and that may not be enough to boot browsers and pages.
  let browser;
  let backgroundPage;

  before(async function() {
    const extensionPath = path.resolve(__dirname, '../../dist');
    browser = await puppeteer.launch({
      headless: false, // extension are allowed only in head-full mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    const targets = await browser.targets();
    const backgroundPageTarget = targets.find((target) => target.type() === 'background_page');
    backgroundPage = await backgroundPageTarget.page();
  });

  after(async function() {
    await browser.close();
  });

  // TODO: Background script testing
});
