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
    this._tabDataMap = new Map();
  }

  /**
   * Saves a tab with its first-party domain and its enablement status
   * @param {number} tabId
   * @param {Domain} domain
   * @param {boolean} extensionEnabled
   */
  saveTabAndDomain(tabId, domain, extensionEnabled) {
    this._tabDataMap.set(tabId, {
      firstPartyDomain: domain,
      extensionEnabled: extensionEnabled,
    });
  }

  /**
   * Returns if a tab is saved with the given ID
   * @param {number} tabId
   * @return {boolean}
   */
  isTabSaved(tabId) {
    return this._tabDataMap.has(tabId);
  }

  /**
   * Returns true if extension is enabled at this tab
   * @param {number} tabId
   * @return {boolean}
   */
  isExtensionEnabled(tabId) {
    const tab = this._tabDataMap.get(tabId);
    if (!tab) {
      return false;
    }
    return tab.extensionEnabled;
  }

  /**
   * Checks if a domain is a third-party domain
   * @param {number} tabId
   * @param {Domain} requestDomain
   * @return {boolean}
   */
  isThirdPartyDomain(tabId, requestDomain) {
    const tabDomain = this._tabDataMap.get(tabId).firstPartyDomain;
    return tabDomain.isThirdPartyDomain(requestDomain);
  }

  /**
   * Adds a third-party domain to a given tab
   * @param {number} tabId
   * @param {Domain} domain
   */
  addThirdPartyDomainToTab(tabId, domain) {
    const tabDomains = this._tabDataMap.get(tabId);
    if (!tabDomains.hasOwnProperty('thirdPartyDomains')) {
      tabDomains.thirdPartyDomains = [domain];
      return;
    }
    const found = tabDomains.thirdPartyDomains.some((d) => d.equals(domain));
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
    const tab = this._tabDataMap.get(tabId);
    if (tab) {
      return tab.firstPartyDomain.toString();
    }
  }

  /**
   * Returns the list of third-party domains of a given tab sorted by state
   * @param {number} tabId
   * @return {array}
   */
  getThirdPartyDomainsByTab(tabId) {
    const tab = this._tabDataMap.get(tabId);
    if (!tab || !tab.hasOwnProperty('thirdPartyDomains')) {
      return [];
    }
    const domains = tab.thirdPartyDomains.map((domain) => ({
      name: domain.toString(),
      state: domain.state,
    }));
    return domains.sort((d1, d2) => d1.state - d2.state);
  }

  /**
   * Returns the state of a third-party domain if exists
   * @param {number} tabId
   * @param {Domain} domain
   * @return {string|undefined}
   */
  getThirdPartyDomainState(tabId, domain) {
    const tab = this._tabDataMap.get(tabId);
    if (!tab || !tab.hasOwnProperty('thirdPartyDomains')) {
      return;
    }
    let found;
    for (const d of tab.thirdPartyDomains) {
      if (d.equals(domain)) {
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
    this._tabDataMap.delete(tabId);
  }

  /**
   * Clear all saved tabs
   */
  clear() {
    this._tabDataMap.clear();
  }

  /**
   * Reloads all tabs of the given domain
   * @param {string} domainStr
   */
  reloadDomainTabs(domainStr) {
    for (const [tabId, tabData] of this._tabDataMap) {
      if (tabData.firstPartyDomain.toString() === domainStr) {
        chrome.tabs.reload(tabId);
      }
    }
  }
}
