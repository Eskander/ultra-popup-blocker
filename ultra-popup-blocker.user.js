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

/* ---------------------------------------------------------------- */

const PERMISSION_DIALOG_ID = 'ultra_popup_blocker'; // HTML ID in the page
const CONTROL_PANEL = 'https://eskander.github.io/ultra-popup-blocker/configure.html';

// Reference to page's "window" through GreaseMonkey
const global = unsafeWindow;
global.upb_counter = 0;

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

/* ---------------------------------------------------------------- */

// Add @domain to local storage
function addDomainToLocalStorage(domain) {
  GM_setValue(`trusted_${domain}`, true);
}

// Remove @domain from local storage
function removeDomainFromLocalStorage(domain) {
  GM_deleteValue(`trusted_${domain}`);
  GM_deleteValue(`${domain}`);
}

// Return true if @domain is trusted
function isDomainTrusted(domain) {
  return GM_getValue(`trusted_${domain}`);
}

// Return an Array of trusted domains
function getTrustedDomains() {
  return GM_listValues();
}

// Open permission manager in new tab
function openControlPanel() {
  GM_openInTab(CONTROL_PANEL, false);
}

// Add a link to permission manager in extensions' popup menu
function attachToExtensionMenu(name, callback) {
  GM_registerMenuCommand(name, callback);
}

// Permission bar; Return permission dialog, or create it if needed.
function getLogDiv() {
  let logDiv = document.getElementById(PERMISSION_DIALOG_ID);
  if (!logDiv) {
    logDiv = document.createElement('div');
    logDiv.setAttribute('id', PERMISSION_DIALOG_ID);
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

// Permission bar; Hide dialog
function closeLogDiv(logDiv) {
  const currentLogDiv = logDiv;
  currentLogDiv.style.display = 'none';
}

// Return current top domain. eg: github.com
function getCurrentTopDomain() {
  const hostnameArray = document.location.hostname.split('.');
  const topLevelDomain = hostnameArray[hostnameArray.length - 1];
  const domainName = hostnameArray[hostnameArray.length - 2];
  const currentDomain = `${domainName}.${topLevelDomain}`;
  return currentDomain;
}

// Return true if current domain has been trusted by the user
function isCurrentDomainTrusted() {
  const domain = getCurrentTopDomain();
  return isDomainTrusted(domain);
}

// Permission manager; Create a button to remove domain from permissions list
function removeDomainFromPermissionList() {
  const div = this.parentElement;
  console.log(div);
  const domain = div.innerText.replace('\n\u00D7', '');
  removeDomainFromLocalStorage(domain);
  div.style.display = 'none';
  console.log(`[UPB] Domain removed from trust: ${domain}`);
}

// Permission manager; Add a new domain to permissions list
function addDomainToPermissionList(domain) {
  const domainName = domain.replace('trusted_', '');
  const li = document.createElement('li');
  const t = document.createTextNode(domainName);
  li.appendChild(t);
  document.getElementById('List').appendChild(li);
  // Add a remove button to li
  const span = document.createElement('SPAN');
  const txt = document.createTextNode('\u00D7');
  span.className = 'close';
  span.appendChild(txt);
  span.onclick = removeDomainFromPermissionList;
  li.appendChild(span);
  // Add domain to localStorage
  addDomainToLocalStorage(domainName);
  console.log(`[UPB] Domain added to trust: ${domainName}`);
}

// Permission manager; Button to add a new domain to permissions list
function addNewDomainButton() {
  document.getElementsByClassName('addBtn')[0].addEventListener(
    'click',
    () => {
      const DOMAIN = document.getElementById('Input').value;
      if (DOMAIN !== '') {
        addDomainToPermissionList(DOMAIN);
      }
      document.getElementById('Input').value = '';
    },
  );
}

// Permission bar; Create a button with inner text @text executing onclick
// @clickCallback, appended as a child of @logDiv, with style @inlineStyle.
function createButton(logDiv, text, clickCallback, inlineStyle) {
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
                          color: black;\
                          ${inlineStyle}`;
  logDiv.appendChild(button);
  button.addEventListener('click', clickCallback);
}

// Permission bar; Create a button (child of @logDiv) which onclick trusts @domain
function createTrustButton(logDiv, domain, a, b, c) {
  createButton(
    logDiv,
    'Always Allow &#128504;',
    () => {
      addDomainToLocalStorage(domain);
      realWindowOpen(a, b, c);
      closeLogDiv(logDiv);
      global.open = realWindowOpen;
    },
    '',
  );
}

// Permission bar; Create a button (child of @logDiv) which onclick opens @domain
function createOpenPopupButton(logDiv, a, b, c) {
  createButton(
    logDiv,
    'Allow &#8599;',
    () => {
      realWindowOpen(a, b, c);
      closeLogDiv(logDiv);
    },
    '',
  );
}

// Permission bar; Create a button (child of @logDiv) which onclick hides @logDiv
function createCloseButton(logDiv) {
  createButton(
    logDiv,
    'Deny &#10799;',
    () => {
      closeLogDiv(logDiv);
    },
    ' background-color: #a00;\
      color: white;',
  );
}

// Permission bar; Create a button (child of @logDiv) which onclick opens @controlPanel
function createConfigButton(logDiv) {
  createButton(
    logDiv,
    'Config &#9881;',
    () => {
      openControlPanel();
    },
    ' float:right;\
      margin: 0 10px 0 0;',
  );
}

// Permission bar; Display a permission prompt when a new popup is detected
function createDialogMessage(logDiv, url) {
  const currentLogDiv = logDiv;
  let msg;
  let popupUrl;
  global.upb_counter += 1;

  if (url[0] === '/') {
    popupUrl = document.domain + url;
  } else {
    popupUrl = url;
  }

  if (global.upb_counter === 1) {
    msg = `<b>[UPB]</b> Blocked <b>1</b> popup: <u>${popupUrl}</u>`;
  } else {
    msg = `<b>[UPB]</b> Blocked <b>${global.upb_counter}</b> popups, last: <u>${popupUrl}</u>`;
  }

  currentLogDiv.innerHTML = msg;
  console.log(msg);
  currentLogDiv.style.display = 'block';
}

// This function will be called each time a script wants to open a new window
function fakeWindowOpen(a, b, c) {
  const domain = getCurrentTopDomain();
  const popupURL = a;
  const logDiv = getLogDiv();
  console.log(a, b, c);
  createDialogMessage(logDiv, popupURL);
  createOpenPopupButton(logDiv, a, b, c);
  createTrustButton(logDiv, domain, a, b, c);
  createCloseButton(logDiv);
  createConfigButton(logDiv);
  return FakeWindow;
}

// Override browser's "window.open" with our own implementation.
function activateBlocker() {
  const TRUSTED = isCurrentDomainTrusted();
  if (!TRUSTED) {
    global.open = fakeWindowOpen;
    console.log('[UPB] Current domain Not trusted.');
  } else {
    console.log('[UPB] Current domain Trusted. UPB disabled.');
  }
}

function activateControlPanel() {
  if (window.location.href === CONTROL_PANEL) {
    // Add listener to the add button
    addNewDomainButton();
    // Show already stored elements in the list
    const storedTrust = getTrustedDomains();
    storedTrust.forEach(addDomainToPermissionList);
    console.log(storedTrust);
  }
}

function activateExtensionMenu() {
  attachToExtensionMenu(
    'Configure popup permissions',
    () => {
      openControlPanel();
    },
  );
}

/* ---------------------------------------------------------------- */

// Add configure link to Tampermonkey's menu
activateExtensionMenu();

// Initiate Control Panel logic
activateControlPanel();

// Start Popup Blocker
activateBlocker();
