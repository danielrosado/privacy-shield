/*
 *  Background script for intercepting and analyzing traffic
 */

"use strict";

const parseDomain = require("parse-domain");

/**
 * Handles the onBeforeRequest event
 * @param {WebRequestBodyDetails} details
 */
function onBeforeRequestListener(details) {
  // TODO
  const domain = parseDomain(details.url);
  console.log(domain);
}

/**
 * Handles the onBeforeSendHeaders event
 * @param {WebRequestHeadersDetails} details
 */
function onBeforeSendHeadersListener(details) {
  // TODO
  // console.log(details);
}

/**
 * Handles the onHeadersReceived event
 * @param {WebResponseHeadersDetails} details
 */
function onHeadersReceivedListener(details) {
  // TODO
  // console.log(details);
}

/**
 *  Starts the onBeforeRequest listener
 */
function startOnBeforeRequestListener() {
  chrome.webRequest.onBeforeRequest.addListener(
      onBeforeRequestListener,
      {urls: ["http://*/*", "https://*/*"]}
  );
}

/**
 *  Starts the onBeforeSendHeaders listener
 */
function startOnBeforeSendHeadersListener() {
  const optExtraInfoSpec = ["requestHeaders"/* , "blocking"*/];

  if (chrome.webRequest.OnBeforeSendHeadersOptions
      .hasOwnProperty("EXTRA_HEADERS")) {
    optExtraInfoSpec.push("extraHeaders");
  }

  chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeadersListener,
      {urls: ["http://*/*", "https://*/*"]},
      optExtraInfoSpec
  );
}

/**
 *  Function to start the onHeadersReceived listener
 */
function startOnHeadersReceivedListener() {
  const optExtraInfoSpec = ["responseHeaders"/* , "blocking"*/];

  if (chrome.webRequest.OnHeadersReceivedOptions
      .hasOwnProperty("EXTRA_HEADERS")) {
    optExtraInfoSpec.push("extraHeaders");
  }

  chrome.webRequest.onHeadersReceived.addListener(
      onHeadersReceivedListener,
      {urls: ["http://*/*", "https://*/*"]},
      optExtraInfoSpec
  );
}


document.addEventListener("DOMContentLoaded", function() {
  startOnBeforeRequestListener();
  startOnBeforeSendHeadersListener();
  startOnHeadersReceivedListener();
});


