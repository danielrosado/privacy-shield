'use strict';

import Domain from '../src/js/classes/domain';
import {assert} from 'chai';

describe('Domain', function() {
  // **********************
  // Variables declarations
  // **********************

  let foo;
  let example_com;
  let example_org;
  let www_urjc_es;
  let gestion2_urjc_es;
  let chrome_extensions;

  // ************************
  // Testing settings
  // ************************

  before(function() {
    example_com = new Domain('example.com');
    example_org = new Domain('example.org');
    www_urjc_es = new Domain('www.urjc.es');
    gestion2_urjc_es = new Domain('gestion2.urjc.es');
    chrome_extensions = new Domain('chrome://extensions');
    foo = new Domain('foo');
  });

  // **********************
  // Test suite
  // **********************

  describe('is null', function() {
    it('should be null', function() {
      assert.isNull(chrome_extensions._domain, 'it is not null');
    });

    it('should not be null', function() {
      assert.isNotNull(example_com._domain, 'it is null');
    });
  });

  describe('equals', function() {
    it('should be equals', function() {
      const new_foo = new Domain('foo');
      const new_example_com = new Domain('example.com');
      const new_www_urjc_es = new Domain('www.urjc.es');
      assert.isTrue(foo.equals(new_foo), 'the domains are not equals');
      assert.isTrue(example_com.equals(new_example_com), 'the domains are not equals');
      assert.isTrue(www_urjc_es.equals(new_www_urjc_es), 'the domains are not equals');
    });

    it('should not be equals', function() {
      assert.isFalse(example_com.equals(example_org), 'the domains are equals');
      assert.isFalse(example_org.equals(www_urjc_es), 'the domains are equals');
    });
  });

  describe('isThirdPartyDomain', function() {
    it('should be a third-party domain', function() {
      assert.isTrue(example_com.isThirdPartyDomain(example_org), 'it is not a third-party domain');
      assert.isTrue(example_com.isThirdPartyDomain(www_urjc_es), 'it is not a third-party domain');
    });

    it('should not be a third-party domain', function() {
      assert.isFalse(www_urjc_es.isThirdPartyDomain(gestion2_urjc_es), 'it is a third-party domain');
    });
  });

  describe('toString', function() {
    it('should not be a string', function() {
      const chrome_extensions_str = chrome_extensions.toString();
      assert.isUndefined(chrome_extensions_str, 'it is a string');
    });

    it('should be a string', function() {
      const example_com_str = example_com.toString();
      const www_urjc_es_str = www_urjc_es.toString();
      const urjc_es_str = www_urjc_es.toString(true);
      const foo_str = foo.toString();
      assert.isString(example_com_str, 'it is not a string');
      assert.equal(example_com_str, 'example.com', 'string is not "example.com"');
      assert.isString(www_urjc_es_str, 'it is not a string');
      assert.equal(www_urjc_es_str, 'www.urjc.es', 'string is not "www.urjc.es"');
      assert.isString(www_urjc_es_str, 'it is not a string');
      assert.equal(urjc_es_str, 'urjc.es', 'string is not "urjc.es"');
      assert.isString(foo_str, 'it is not a string');
      assert.equal(foo_str, 'foo', 'string is not "foo"');
    });
  });
});
