'use strict';

export const MessageType = Object.freeze({
  GET_THIRD_PARTY_DOMAINS: 0,
});

export const DomainState = Object.freeze({
  ALLOWED: 0,
  BLOCKED: 1,
  COOKIE_BLOCKED: 2,
});
