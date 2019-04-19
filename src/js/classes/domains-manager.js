'use strict';

import parseDomain from 'parse-domain';

/**
 * DomainsManager class for managing the third-party domains
 * found while loading a tab
 */
export default class DomainsManager {
  /**
   * DomainsManager constructor
   */
  constructor() {
    this._tabDomainsDict = new Map();
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
   * Checks if a domain is a third-party domain
   * @param {Object} tabDomain
   * @param {Object} requestDomain
   * @return {boolean}
   */
  isThirdPartyDomain(tabDomain, requestDomain) {
    return tabDomain.tld !== requestDomain.tld ||
      tabDomain.domain !== requestDomain.domain;
  };

  /**
   * Add a domain from a tab
   * @param {Object} domain
   * @param {number} tabId
   */
  addDomainFromTab(domain, tabId) {
    if (!this._tabDomainsDict.has(tabId)) {
      this._tabDomainsDict.set(tabId, [domain]);
    } else {
      const domains = this._tabDomainsDict.get(tabId);
      const found = domains.some((d) => {
        return d.domain === domain.domain && d.subdomain === domain.subdomain
          && d.tld === domain.tld;
      });
      if (!found) {
        this._tabDomainsDict.get(tabId).push(domain);
      }
    }
  }

  /**
   * Returns the list of domains found in a tab
   * @param {number} tabId
   * @return {array}
   */
  getDomainsByTab(tabId) {
    let domains = this._tabDomainsDict.get(tabId);
    domains = domains.sort((d1, d2) => d1.domain.localeCompare(d2.domain));
    return domains;
  }

  /**
   * Clears the domains added from a tab
   * @param {number} tabId
   */
  clearDomainsByTab(tabId) {
    if (this._tabDomainsDict.has(tabId)) {
      this._tabDomainsDict.set(tabId, []);
    }
  }

  /**
   * Removes the added tab
   * @param {number} tabId
   */
  removeTab(tabId) {
    this._tabDomainsDict.delete(tabId);
  }

  /**
   * Removes all added tabs
   */
  clear() {
    this._tabDomainsDict.clear();
  }
}
