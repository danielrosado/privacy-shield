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
    this._tabDomainsMap = new Map();
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
    return this._tabDomainsMap.has(tabId);
  }

  /**
   * Saves a tab with its first-party domain
   * @param {number} tabId
   * @param {string} url
   */
  saveTabWithURL(tabId, url) {
    this._tabDomainsMap.set(tabId, {firstPartyDomain: parseDomain(url)});
  }

  /**
   * Checks if a domain is a third-party domain
   * @param {number} tabId
   * @param {Object} requestDomain
   * @return {boolean}
   */
  isThirdPartyDomain(tabId, requestDomain) {
    const tabDomain = this._tabDomainsMap.get(tabId).firstPartyDomain;
    return tabDomain.tld !== requestDomain.tld ||
      tabDomain.domain !== requestDomain.domain;
  };

  /**
   * Add a third-party domain from a tab
   * @param {Object} domain
   * @param {number} tabId
   */
  addThirdPartyDomainFromTab(domain, tabId) {
    if (!this._tabDomainsMap.get(tabId).hasOwnProperty('thirdPartyDomains')) {
      this._tabDomainsMap.get(tabId).thirdPartyDomains = [];
    }
    const found = this._tabDomainsMap.get(tabId).thirdPartyDomains.some((d) => {
      return d.domain === domain.domain && d.subdomain === domain.subdomain
        && d.tld === domain.tld;
    });
    if (!found) {
      this._tabDomainsMap.get(tabId).thirdPartyDomains.push(domain);
    }
  }

  /**
   * Returns the list of domains found in a tab
   * @param {number} tabId
   * @return {array}
   */
  getThirdPartyDomainsByTab(tabId) {
    let domains = this._tabDomainsMap.get(tabId).thirdPartyDomains;
    domains = domains.sort((d1, d2) => d1.domain.localeCompare(d2.domain));
    return domains;
  }

  /**
   * Clears the domains added from a tab
   * @param {number} tabId
   */
  clearThirdPartyDomainsByTab(tabId) {
    if (this._tabDomainsMap.has(tabId)) {
      this._tabDomainsMap.get(tabId).thirdPartyDomains = [];
    }
  }

  /**
   * Removes the added tab
   * @param {number} tabId
   */
  removeTab(tabId) {
    this._tabDomainsMap.delete(tabId);
  }

  /**
   * Removes all added tabs
   */
  clear() {
    this._tabDomainsMap.clear();
  }

  /**
   * Prints info
   */
  print() {
    const map = new Map();
    for (const entry of this._tabDomainsMap) {
      const key = entry[0];
      const tpd = [];
      for (const d of entry[1].thirdPartyDomains) {
        tpd.push({
          subdomain: d.subdomain,
          domain: d.domain,
          tld: d.tld,
        });
      }
      const value = {
        firstPartyDomain: {
          subdomain: entry[1].firstPartyDomain.subdomain,
          domain: entry[1].firstPartyDomain.domain,
          tld: entry[1].firstPartyDomain.tld,
        },
        thirdPartyDomains: tpd,
      };
      map.set(key, value);
    }
    console.log(map);
  }
}
