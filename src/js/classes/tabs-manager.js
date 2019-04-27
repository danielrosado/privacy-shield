'use strict';

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
   * @param {object} domain
   */
  saveTabAndDomain(tabId, domain) {
    this._tabDomainsMap.set(tabId, {firstPartyDomain: domain});
  }

  /**
   * Checks if a domain is a third-party domain
   * @param {number} tabId
   * @param {Object} requestDomain
   * @return {boolean}
   */
  isThirdPartyDomain(tabId, requestDomain) {
    const tabDomain = this._tabDomainsMap.get(tabId).firstPartyDomain;
    return tabDomain.domain !== requestDomain.domain
      || tabDomain.tld !== requestDomain.tld;
  }

  /**
   * Adds a third-party domain to a given tab
   * @param {number} tabId
   * @param {Object} domain
   */
  addThirdPartyDomainToTab(tabId, domain) {
    const tabDomains = this._tabDomainsMap.get(tabId);
    if (!tabDomains.hasOwnProperty('thirdPartyDomains')) {
      tabDomains.thirdPartyDomains = [];
    }
    const found = tabDomains.thirdPartyDomains.some((d) =>
      TabsManager._equalsDomains(d, domain));
    if (!found) {
      tabDomains.thirdPartyDomains.push(domain);
    }
  }

  /**
   * Returns the first-party domain of a given tab
   * @param {number} tabId
   * @return {string|undefined}
   */
  getFirstPartyDomainByTab(tabId) {
    const tab = this._tabDomainsMap.get(tabId);
    if (tab) {
      const d = tab.firstPartyDomain;
      return `${d.subdomain}.${d.domain}.${d.tld}`.replace(/^\.|\.$/g, '');
    }
  }

  /**
   * Returns the list of third-party domains of a given tab sorted by state
   * @param {number} tabId
   * @return {array}
   */
  getThirdPartyDomainsByTab(tabId) {
    const tab = this._tabDomainsMap.get(tabId);
    if (!tab || !tab.hasOwnProperty('thirdPartyDomains')) {
      return [];
    }
    const domains = tab.thirdPartyDomains.map((d) => ({
      name: `${d.subdomain}.${d.domain}.${d.tld}`,
      state: d.state,
    }));
    return domains.sort((d1, d2) => d1.state - d2.state);
  }

  /**
   * Returns the state of a third-party domain if exists
   * @param {number} tabId
   * @param {object} domain
   * @return {string|undefined}
   */
  getThirdPartyDomainState(tabId, domain) {
    const tab = this._tabDomainsMap.get(tabId);
    if (!tab || !tab.hasOwnProperty('thirdPartyDomains')) {
      return;
    }
    let found;
    for (const d of tab.thirdPartyDomains) {
      if (TabsManager._equalsDomains(d, domain)) {
        found = d;
        break;
      }
    }
    if (found !== undefined) {
      return found.state;
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
   * Clears the domains added from a tab
   * @param {number} tabId
   */
  clearThirdPartyDomainsByTab(tabId) {
    if (this._tabDomainsMap.has(tabId)) {
      this._tabDomainsMap.get(tabId).thirdPartyDomains = [];
    }
  }

  /**
   * Removes all added tabs
   */
  clear() {
    this._tabDomainsMap.clear();
  }

  /**
   * Returns true if two domains are equals
   * @param {object} d1
   * @param {object} d2
   * @return {boolean}
   */
  static _equalsDomains(d1, d2) {
    return d1.domain === d2.domain
      && d1.subdomain === d2.subdomain
      && d1.tld === d2.tld;
  }
}
