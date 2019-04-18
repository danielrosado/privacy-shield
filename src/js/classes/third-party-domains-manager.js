'use strict';

import parseDomain from 'parse-domain';

/**
 * ThirdPartyDomainsManager class for managing the third-party domains
 * found while loading a tab
 */
export default class ThirdPartyDomainsManager {
  /**
   * ThirdPartyDomainsManager constructor
   */
  constructor() {
    this._tabDomainsDict = new Map();
  }

  /**
   * Check if an URL belongs to a third-party domain
   * @param {string} tabURL
   * @param {string} requestURL
   * @return {boolean}
   */
  isThirdPartyDomain(tabURL, requestURL) {
    const tabDomain = parseDomain(tabURL);
    const requestDomain = parseDomain(requestURL);
    return tabDomain.domain !== requestDomain.domain;
  };

  /**
   * Add a third-party domain from a tab
   * @param {string} url
   * @param {number} tabId
   */
  addThirdPartyDomainFromTab(url, tabId) {
    let domain = parseDomain(url);
    domain = `${domain.subdomain}.${domain.domain}.${domain.tld}`;
    if (!this._tabDomainsDict.has(tabId)) {
      this._tabDomainsDict.set(tabId, [domain]);
    } else {
      if (!this._tabDomainsDict.get(tabId).includes(domain)) {
        this._tabDomainsDict.get(tabId).push(domain);
      }
    }
  }

  /**
   * Returns the list of third-party domains found in a tab
   * @param {number} tabId
   * @return {array}
   */
  getThirdPartyDomainsByTab(tabId) {
    return this._tabDomainsDict.get(tabId);
  }

  /**
   * Clears the the third-party domains logged from a tab
   * @param {number} tabId
   */
  clearThirdPartyDomainsByTab(tabId) {
    if (this._tabDomainsDict.has(tabId)) {
      this._tabDomainsDict.set(tabId, []);
    }
  }

  /**
   * Removes the added tab
   * @param {number} tabId
   */
  removeTab(tabId) {
    if (this._tabDomainsDict.has(tabId)) {
      this._tabDomainsDict.delete(tabId);
    }
  }

  /**
   * Removes all added tabs
   */
  clear() {
    this._tabDomainsDict.clear();
  }
}
