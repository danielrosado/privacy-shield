'use strict';

import parseDomain from 'parse-domain';

/**
 *  ThirdPartiesManager class for managing the third party sites
 *  found in a tab
 */
export default class ThirdPartiesManager {
  /**
   * ThirdPartiesManager constructor
   */
  constructor() {
    this.thirdPartiesTabDict = {};
  }

  /**
   * Check if an URL belongs to a third-party domain
   * @param {string} urlFirstParty
   * @param {string} urlThirdParty
   * @return {boolean}
   */
  isThirdParty(urlFirstParty, urlThirdParty) {
    const fpDomain = parseDomain(urlFirstParty);
    const tpDomain = parseDomain(urlThirdParty);
    return fpDomain.domain !== tpDomain.domain;
  };

  /**
   *  Add a third-party domain from a tab
   *  @param {string} url
   *  @param {number} tabId
   */
  addThirdPartyFromTab(url, tabId) {
    let domain = parseDomain(url);
    console.log(`Logging ${domain} from tab: ${tabId}`);

    domain = `${domain.subdomain}.${domain.domain}.${domain.tld}`;
    if (!this.thirdPartiesTabDict[tabId]) {
      this.thirdPartiesTabDict[tabId] = [domain];
    } else {
      if (!this.thirdPartiesTabDict[tabId].includes(domain)) {
        this.thirdPartiesTabDict[tabId].push(domain);
      }
    }

    this.print();
  }

  /**
   *  Clears the domains logged from a tab
   *  @param {number} tabId
   */
  clearTabDomains(tabId) {
    console.log(`Clearing third parties from tab: ${tabId}`);

    if (this.thirdPartiesTabDict[tabId]) {
      this.thirdPartiesTabDict[tabId] = [];
    }

    this.print();
  }

  /**
   *  Removes a tab
   * @param {number} tabId
   */
  removeThirdPartiesFromTab(tabId) {
    console.log(`Deleting tab: ${tabId}`);

    if (this.thirdPartiesTabDict[tabId]) {
      delete this.thirdPartiesTabDict[tabId];
    }

    this.print();
  }

  /**
   *  Removes all logged tabs
   */
  clear() {
    this.thirdPartiesTabDict = {};
  }

  /**
   *  Prints the info
   */
  print() {
    console.log(this.thirdPartiesTabDict);
  }
}
