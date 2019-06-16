'use strict';

import Domain from '../src/js/classes/domain';
import TabsManager from '../src/js/classes/tabs-manager';
import {DomainStateType} from '../src/js/utils/constants';
import {assert} from 'chai';

describe('TabsManager', function() {
  // **********************
  // Variables declarations
  // **********************

  let tabsManager;
  let tabId;
  let domain;

  // ************************
  // Testing settings
  // ************************

  beforeEach(function() {
    tabsManager = new TabsManager();
    tabId = 300;
    domain = new Domain('example.org');
    tabsManager.saveTab(tabId, domain, true);
  });

  afterEach(function() {
    tabsManager.clear();
  });

  // **********************
  // Test suite
  // **********************

  describe('isTabSaved', function() {
    it('should be saved', function() {
      assert.isTrue(tabsManager.isTabSaved(tabId), 'tab is not saved');
    });

    it('should not be saved', function() {
      assert.isFalse(tabsManager.isTabSaved(100), 'tab is saved');
    });
  });

  describe('isExtensionEnabled', function() {
    it('should be enabled', function() {
      assert.isTrue(tabsManager.isExtensionEnabled(tabId), 'tab is not enabled');
    });

    it('should not be enabled', function() {
      tabsManager.saveTab(100, new Domain('example.com'), false);
      assert.isFalse(tabsManager.isExtensionEnabled(100), 'tab is enabled');
    });
  });

  describe('isThirdPartyDomain', function() {
    it('should be a third-party domain', function() {
      assert.isTrue(tabsManager.isThirdPartyDomain(tabId, new Domain('example.com')),
          'it is not a third-party domain');
      assert.isTrue(tabsManager.isThirdPartyDomain(tabId, new Domain('www.urjc.es')),
          'it is not a third-party domain');
    });

    it('should not be a third-party domain', function() {
      assert.isFalse(tabsManager.isThirdPartyDomain(tabId, new Domain('example.org')),
          'it is a third-party domain');
      tabsManager.saveTab(100, new Domain('www.urjc.es'), true);
      assert.isFalse(tabsManager.isThirdPartyDomain(100, new Domain('gestion2.urjc.es')),
          'it is a third-party domain');
    });
  });

  describe('addThirdPartyDomainToTab', function() {
    it('should be added', function() {
      let added = tabsManager.addThirdPartyDomainToTab(tabId, new Domain('www.urjc.es'));
      assert.isTrue(added, 'domain was not added');
      let domains = tabsManager.getThirdPartyDomainsByTab(tabId);
      assert.equal(domains.length, 1, 'domain was not added');
      assert.equal(domains[0].name, 'www.urjc.es', 'domain was not added');

      added = tabsManager.addThirdPartyDomainToTab(tabId, new Domain('gestion2.urjc.es'));
      assert.isTrue(added, 'domain was not added');
      domains = tabsManager.getThirdPartyDomainsByTab(tabId);
      assert.equal(domains.length, 2, 'domain was not added');
      assert.equal(domains[0].name, 'www.urjc.es', 'domain was not added');
      assert.equal(domains[1].name, 'gestion2.urjc.es', 'domain was not added');
    });

    it('should not be added', function() {
      tabsManager.addThirdPartyDomainToTab(tabId, new Domain('www.urjc.es'));
      const added = tabsManager.addThirdPartyDomainToTab(tabId, new Domain('www.urjc.es'));
      assert.isFalse(added, 'domain was added');
      const domains = tabsManager.getThirdPartyDomainsByTab(tabId);
      assert.equal(domains.length, 1, 'domain was added');
    });
  });

  describe('getFirstPartyDomainByTab', function() {
    it('should be first-party domain', function() {
      const domain_str = tabsManager.getFirstPartyDomainByTab(tabId).toString();
      assert.isString(domain_str, 'it is not a string');
      assert.equal(domain_str, 'example.org', 'it is not first-party domain');
    });
  });

  describe('getThirdPartyDomainsByTab', function() {
    it('should be third-party domains', function() {
      tabsManager.addThirdPartyDomainToTab(tabId, new Domain('www.urjc.es'));
      tabsManager.addThirdPartyDomainToTab(tabId, new Domain('example.com'));
      const domains = tabsManager.getThirdPartyDomainsByTab(tabId);
      assert.equal(domains.length, 2, 'there should be 2 third-party domains');
      assert.equal(domains[0].name, 'www.urjc.es', 'it should be "www.urjc.es"');
      assert.equal(domains[1].name, 'example.com', 'it should be "example.com"');
    });
  });

  describe('getThirdPartyDomainsState', function() {
    it('should be third-party domain state', function() {
      const domain1 = new Domain('www.urjc.es');
      const domain2 = new Domain('example.com');
      domain1.state = DomainStateType.BLOCKED;
      domain2.state = DomainStateType.COOKIE_BLOCKED;
      tabsManager.addThirdPartyDomainToTab(tabId, domain1);
      tabsManager.addThirdPartyDomainToTab(tabId, domain2);
      const state1 = tabsManager.getThirdPartyDomainState(tabId, domain1);
      const state2 = tabsManager.getThirdPartyDomainState(tabId, domain2);
      assert.equal(state1, DomainStateType.BLOCKED);
      assert.equal(state2, DomainStateType.COOKIE_BLOCKED);
    });
  });

  describe('removeTab', function() {
    it('should be removed', function() {
      tabsManager.removeTab(tabId);
      assert.isFalse(tabsManager.isTabSaved(tabId), 'it should be false');
    });
  });

});
