'use strict';

export const MessageType = Object.freeze({
  GET_TAB_DOMAINS: 0,
  EXTENSION_ENABLEMENT: 1,
  CLOSE_POPUP: 2,
});

export const DomainState = Object.freeze({
  BLOCKED: 0,
  COOKIE_BLOCKED: 1,
  ALLOWED: 2,
});

export const EXTENSION_DISABLED_DOMAINS_KEY = 'extensionsDisabledDomains';
