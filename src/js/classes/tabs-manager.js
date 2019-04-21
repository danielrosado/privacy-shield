'use strict';

import parseDomain from 'parse-domain';

/**
 * TabsManager class for managing the domains
 * found while loading a tab
 */
export default class TabsManager {
  /**
   * TabsManager constructor
   */
  constructor() {
    this.tabDomainsMap = new Map();
  }

  /**
   * Returns a domain object given an URL
   * @param {string} url
   * @return {Object}
   */
  getDomain(url) {
    return parseDomain(url);
  }

  /**
   * Returns if a tab is saved with the given ID
   * @param {number} tabId
   * @return {boolean}
   */
  isTabSaved(tabId) {
    return this.tabDomainsMap.has(tabId);
  }

  /**
   * Saves a tab with its first-party domain
   * @param {number} tabId
   * @param {string} url
   */
  saveTabWithURL(tabId, url) {
    this.tabDomainsMap.set(tabId, {firstPartyDomain: parseDomain(url)});
  }

  /**
   * Checks if a domain is a third-party domain
   * @param {number} tabId
   * @param {Object} requestDomain
   * @return {boolean}
   */
  isThirdPartyDomain(tabId, requestDomain) {
    const tabDomain = this.tabDomainsMap.get(tabId).firstPartyDomain;
    return tabDomain.domain !== requestDomain.domain ||
      tabDomain.tld !== requestDomain.tld;
  };

  /**
   * Add a third-party domain from a tab
   * @param {Object} domain
   * @param {number} tabId
   */
  addThirdPartyDomainFromTab(domain, tabId) {
    const tabDomains = this.tabDomainsMap.get(tabId);
    if (!tabDomains.hasOwnProperty('thirdPartyDomains')) {
      tabDomains.thirdPartyDomains = [];
    }
    const found = tabDomains.thirdPartyDomains.some((d) =>
      d.domain === domain.domain && d.subdomain === domain.subdomain
        && d.tld === domain.tld);
    if (!found) {
      tabDomains.thirdPartyDomains.push(domain);
    }
  }

  /**
   * Returns the list of domains found in a tab
   * @param {number} tabId
   * @return {array}
   */
  getThirdPartyDomainsByTab(tabId) {
    const tab = this.tabDomainsMap.get(tabId);
    return tab ? tab.thirdPartyDomains : [];
  }

  /**
   * Clears the domains added from a tab
   * @param {number} tabId
   */
  clearThirdPartyDomainsByTab(tabId) {
    if (this.tabDomainsMap.has(tabId)) {
      this.tabDomainsMap.get(tabId).thirdPartyDomains = [];
    }
  }

  /**
   * Removes the added tab
   * @param {number} tabId
   */
  removeTab(tabId) {
    this.tabDomainsMap.delete(tabId);
  }

  /**
   * Removes all added tabs
   */
  clear() {
    this.tabDomainsMap.clear();
  }
}
