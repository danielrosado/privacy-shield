'use strict';

import parseDomain from 'parse-domain';

/**
 * Domain class
 */
export default class Domain {
  /**
   * Constructor
   * @param {string} url
   */
  constructor(url) {
    this._domain = parseDomain(url);
  }

  /**
   * State setter
   * @param {number} state
   */
  set state(state) {
    this._state = state;
  }

  /**
   * State getter
   * @return {number}
   */
  get state() {
    return this._state;
  }

  /**
   * Returns if a given domain belongs to a third-party
   * @param {Domain} domain
   * @return {boolean}
   */
  isThirdPartyDomain(domain) {
    return this._domain.domain !== domain._domain.domain
      || this._domain.tld !== domain._domain.tld;
  }

  /**
   * Returns if two domains are equals
   * @param {Domain} domain
   * @return {boolean}
   */
  equals(domain) {
    return this._domain.subdomain === domain._domain.subdomain
      && this._domain.domain === domain._domain.domain
      && this._domain.tld === domain._domain.tld;
  }

  /**
   * Returns the string representation of a domain
   * @param {boolean} trimSubdomain
   * @return {string}
   */
  toString(trimSubdomain=false) {
    if (trimSubdomain) {
      return `${this._domain.domain}.${this._domain.tld}`;
    }
    return `${this._domain.subdomain}.${this._domain.domain}.${this._domain.tld}`
        .replace(/^\.|\.$/g, '');
  }
}
