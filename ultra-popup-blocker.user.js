/* eslint-disable no-param-reassign */
/* eslint-disable no-alert */
/* eslint-disable no-console */
/* eslint-disable no-multi-str */

// ==UserScript==
// @name         Ultra Popup Blocker
// @description  Configurable popup blocker that blocks all popup windows by default.
// @namespace    https://github.com/eskander
// @author       eskander
// @version      2.99
// @include      *
// @license      MIT
// @homepage     https://github.com/eskander/ultra-popup-blocker
// @supportURL   https://github.com/eskander/ultra-popup-blocker/issues
// @compatible   firefox Tampermonkey recommended
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// ==/UserScript==

// ============================== CONFIG =================================

const LOG_ID = 'ultra_popup_blocker'; // HTML ID in the page
const controlPanel = 'https://eskander.github.io/ultra-popup-blocker/configure.html';

// reference to page's "window" through GreaseMonkey
const global = unsafeWindow;

// Storing a reference to real "window.open" method in case we wanted it
const realWindowOpen = global.open;

// We need to return the fake window to not encounter JS runtime error when the popup originator
// page wants to call focus() or blur().
const FakeWindow = {
  blur() {
    return false;
  },
  focus() {
    return false;
  },
};

// ============================ FUNCTIONS ================================

// Helper to create a button with inner text @text executing onclick @clickCallback,
// appended as a child of @logDiv
function putButton(logDiv, text, clickCallback, inlineStyle) {
  const button = document.createElement('button');
  button.innerHTML = text;
  button.style.cssText = `text-decoration: none;\
                          color: black;\
                          cursor: pointer;\
                          margin: 0 5px;\
                          padding: 1px 3px;\
                          background-color: rgb(255, 255, 255);\
                          border-width: 0px;\
                          border-radius: 5px;\
                          color: black; ${inlineStyle}`;
  logDiv.appendChild(button);
  button.addEventListener('click', clickCallback);
}

// Helper to create a button (child of @logDiv) which onclick whitelists @domain
// in internal Firefox storage.
function putWhitelistButton(logDiv, domain) {
  putButton(
    logDiv,
    'Whitelist &#128504;',
    () => {
      GM_setValue(`whitelisted_${domain}`, true);
    },
  );
}

// Return logger div, or create it ad-hoc.
function getLogDiv() {
  let logDiv = document.getElementById(LOG_ID);
  if (!logDiv) {
    logDiv = document.createElement('div');
    logDiv.setAttribute('id', LOG_ID);
    logDiv.style.cssText = 'position: fixed;\
                            bottom: 0;\
                            left: 0;\
                            z-index: 99999;\
                            width: 100%;\
                            padding: 5px 5px 5px 5px;\
                            font: status-bar;\
                            background-color: black;\
                            color: white;';
    document.body.appendChild(logDiv);
  }
  return logDiv;
}

// Get top domain to whitelist.
function getDomainsArray(documentDomain) {
  // e.g. domain = www.google.com, topDomain = google.com
  let d1 = documentDomain;
  const domainsArr = [];
  while (d1.split('.').length > 2) {
    d1 = d1.substring(d1.indexOf('.') + 1);
  }
  domainsArr.push(d1);
  return domainsArr;
}

// Checks if domain we're currently browsing has been whitelisted by the user
// to display popups.
function isCurrentDomainWhiteListed() {
  const domains = getDomainsArray(document.domain);
  // if any 'd' in 'domains' was whitelisted, we return true
  const whitelisted = domains.some(
    (d) => GM_getValue(`whitelisted_${d}`),
  );
  return whitelisted;
}

// This function will be called each time a script wants to open a new window,
// if the blocker is activated.
// We handle the blocking & messaging logic here.

function logMessage(logDiv, url) {
  let msg;
  global.upb_counter = (global.upb_counter || 0) + 1;
  const Url = (url[0] === '/') ? document.domain + url : url;
  if (global.upb_counter === 0) {
    msg = `<b>[UPB]</b> Blocked <b>1</b> popup: <u>${Url}</u>`;
  } else {
    msg = `<b>[UPB]</b> Blocked <b>${global.upb_counter}</b> popups, last: <u>${Url}</u>`;
  }
  logDiv.innerHTML = msg;
  console.log(msg);
  logDiv.style.display = 'block';
}

function displayOpenPopupLink(logDiv, args) {
  putButton(
    logDiv,
    'Open &#8599;',
    () => {
      realWindowOpen(...args);
    },
  );
}

function displayWhiteListThisDomainLink(logDiv) {
  const domainsArr = getDomainsArray(document.domain);
  putWhitelistButton(logDiv, domainsArr[0]);
}

function displayCloseButton(logDiv) {
  putButton(
    logDiv,
    'Close &#10799;',
    () => {
      logDiv.style.display = 'none';
    },
    ' background-color: #a00;\
      color: white;\
      margin: 0 10px 0 0;\
      float: right',
  );
}

function displayConfigButton(logDiv) {
  putButton(
    logDiv,
    'Config &#9881;',
    () => {
      GM_openInTab(controlPanel, false);
    },
    'float:right',
  );
}

function fakeWindowOpen(...args) {
  const logDiv = getLogDiv();
  const url = args[0];
  console.log(...args);
  logMessage(logDiv, url);
  displayOpenPopupLink(logDiv, args);
  displayWhiteListThisDomainLink(logDiv);
  displayCloseButton(logDiv);
  displayConfigButton(logDiv);
  return FakeWindow;
}

// Override browser's "window.open" with our own implementation.
function activateBlocker() {
  global.open = fakeWindowOpen;
}

// ============================== CONTROL PANEL =================================

// Add configure link to Tampermonkey's menu
GM_registerMenuCommand(
  'Configure whitelist',
  () => { GM_openInTab(controlPanel, false); },
  'r',
);

// Create a new list item when clicking on the "Add" button

function addElement(Value) {
  const li = document.createElement('li');
  const t = document.createTextNode(Value);
  li.appendChild(t);

  document.getElementById('List').appendChild(li);

  GM_setValue(`whitelisted_${Value}`, true);
  console.log(`[UPB] Domain added to whitelist: ${Value}`);

  // Add a close button to the newly created item
  const span = document.createElement('SPAN');
  const txt = document.createTextNode('\u00D7');
  span.className = 'close';
  span.appendChild(txt);
  span.onclick = function close() {
    const div = this.parentElement;
    console.log(div);
    const domain = div.innerText.replace('\n\u00D7', '');
    GM_deleteValue(`whitelisted_${domain}`);
    div.style.display = 'none';
    console.log(`[UPB] Domain removed from whitelist: ${domain}`);
  };
  li.appendChild(span);
}

function newElement() {
  const inputValue = document.getElementById('Input').value;
  if (inputValue === '') {
    alert('You must write a domain or subdomain to whitelist.');
  } else {
    addElement(inputValue);
  }
  document.getElementById('Input').value = '';
}

function populate(value) {
  addElement(value.replace('whitelisted_', ''));
}

// Only run whitelisting mechanism on the appropriate page
if (window.location.href === controlPanel) {
  // Add listener to the add button
  document.getElementsByClassName('addBtn')[0].addEventListener(
    'click',
    () => { newElement(); },
  );

  // Show already stored elements in the list
  const storedWhitelist = GM_listValues();
  storedWhitelist.forEach(populate);
  console.log(storedWhitelist);
}

// ============================ LET'S RUN IT ================================

const disabled = isCurrentDomainWhiteListed();
if (disabled) {
  console.log('[UPB] Current domain was found on a white list. UPB disabled.');
} else {
  activateBlocker();
}
