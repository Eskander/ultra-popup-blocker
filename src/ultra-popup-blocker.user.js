// ==UserScript==
// @name         Ultra Popup Blocker
// @description  Configurable popup blocker that blocks all popup windows by default.
// @namespace    eskander.github.io
// @author       Eskander
// @version      4.0
// @include      *
// @license      MIT
// @homepage     https://github.com/Eskander/ultra-popup-blocker
// @supportURL   https://github.com/Eskander/ultra-popup-blocker/issues/new
// @compatible   firefox Tampermonkey recommended
// @compatible   chrome Tampermonkey recommended
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// ==/UserScript==

/* ---------------------------------------------------------------- */

// Reference to page's "window" through GreaseMonkey
const global = unsafeWindow
global.upbCounter = 0 // Counter to track blocked popups

// Storing a reference to real "window.open" method in case we want it
const realWindowOpen = global.open

// Fake window object to avoid JS runtime errors when the popup originator
// page calls methods like `focus()` or `blur()`.
const FakeWindow = {
  blur () {
    return false
  },
  focus () {
    return false
  }
}

// Timeout before confirmation dialog closes automatically
let timeleft = 15 // initial time
let denyTimeoutId // timeout ID for clearing the interval

// Add domain to local storage
function addDomainToLocalStorage (domain) {
  GM_setValue(domain, true)
}

// Remove domain from local storage
function removeDomainFromLocalStorage (domain) {
  GM_deleteValue(domain)
}

// Return true if domain is trusted
function isDomainTrusted (domain) {
  return GM_getValue(domain)
}

// Return an Array of trusted domains
function getTrustedDomains () {
  return GM_listValues()
}

// Show modal dialog listing trusted websites
const showTrustedDomainsModal = () => {
  let modal = document.getElementById('trusted-domains-modal')

  // If modal doesn't exist, create it
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'trusted-domains-modal'
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      width: 400px;
      border: 1px solid black;
      z-index: 100000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    `

    // Add the header
    const header = document.createElement('div')
    header.className = 'header'
    header.style.cssText = `
      background-color: black;
      padding: 30px 40px;
      color: white;
      text-align: center;
    `
    const title = document.createElement('h2')
    title.className = 'title'
    title.innerText = 'Ultra Popup Blocker'
    header.appendChild(title)
    const subtitle = document.createElement('h3')
    subtitle.className = 'subtitle'
    subtitle.innerText = 'Trusted websites:'
    subtitle.style.cssText = `
      text-align: left;
      margin-top: 10px;
    `
    header.appendChild(subtitle)
    modal.appendChild(header)

    // Add the footer
    const footer = document.createElement('div')
    footer.className = 'footer'
    footer.style.cssText = `
      background-color: black;
      padding: 5px 40px;
      color: white;
      text-align: center;
    `
    const closeModalBtn = document.createElement('button')
    closeModalBtn.innerText = 'Close'
    closeModalBtn.style.cssText = `
      background-color: gray;
      color: white;
      border: none;
      padding: 10px;
      cursor: pointer;
    `
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none' // Hide modal on close
    })
    footer.appendChild(closeModalBtn)
    modal.appendChild(footer)

    // Append modal to document body
    document.body.appendChild(modal)
  }

  // Function to refresh the list of trusted domains in the modal
  const refreshTrustedDomainsList = () => {
    const ul = document.getElementById('List')
    if (ul) ul.remove() // Remove the old list before refreshing

    const newUl = document.createElement('ul')
    newUl.id = 'List'
    newUl.style.cssText = `
      margin: 0;
      padding: 0;
      list-style-type: none;
    `

    const trustedDomains = getTrustedDomains()
    if (trustedDomains.length === 0) {
      const noDomainsMsg = document.createElement('p')
      noDomainsMsg.innerText = 'No allowed websites'
      newUl.appendChild(noDomainsMsg)
    } else {
      trustedDomains.forEach(domain => {
        const li = document.createElement('li')
        li.innerText = domain
        li.style.cssText = `
          padding: 12px 8px 12px 40px;
          font-size: 18px;
          background-color: white;
          border-bottom: 1px solid #ccc;
          position: relative;
          transition: 0.2s;
        `

        li.addEventListener('mouseover', () => {
          li.style.backgroundColor = '#ddd'
        })
        li.addEventListener('mouseout', () => {
          li.style.backgroundColor = 'white'
        })

        // Remove button
        const removeBtn = document.createElement('span')
        removeBtn.className = 'close'
        removeBtn.innerText = '×'
        removeBtn.style.cssText = `
          cursor: pointer;
          position: absolute;
          right: 0;
          top: 0;
          padding: 12px 16px;
        `
        removeBtn.addEventListener('mouseover', () => {
          removeBtn.style.backgroundColor = '#f44336'
          removeBtn.style.color = 'white'
        })
        removeBtn.addEventListener('mouseout', () => {
          removeBtn.style.backgroundColor = 'transparent'
          removeBtn.style.color = 'black'
        })
        removeBtn.addEventListener('click', () => {
          removeDomainFromLocalStorage(domain) // Remove domain from storage
          li.remove() // Remove list item from the UI
          console.log(`[UPB] Domain removed: ${domain}`)

          // Recheck domain immediately and block future popups
          patchPopupOpener()
        })
        li.appendChild(removeBtn)
        newUl.appendChild(li)
      })
    }
    modal.insertBefore(newUl, modal.querySelector('.footer'))
  }

  // Refresh the modal with current trusted domains
  refreshTrustedDomainsList()

  modal.style.display = 'block' // Show the modal
}

// Add a link to permission manager in extensions' popup menu
function attachToExtensionMenu (name, callback) {
  GM_registerMenuCommand(name, callback)
}

// Permission bar; Return permission dialog, or create it if needed.
function getLogDiv () {
  let logDiv = document.getElementById('ultra_popup_blocker')
  if (!logDiv) {
    logDiv = document.createElement('div')
    logDiv.setAttribute('id', 'ultra_popup_blocker')
    logDiv.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      z-index: 99999;
      width: 100%;
      padding: 5px;
      font: status-bar;
      background-color: black;
      color: white;
    `
    document.body.appendChild(logDiv)
  }
  return logDiv
}

// Permission bar; Hide dialog
function closeLogDiv (logDiv) {
  logDiv.style.display = 'none'
}

// Return current top domain. eg: github.com
function getCurrentTopDomain () {
  const hostnameArray = document.location.hostname.split('.')
  const topLevelDomain = hostnameArray[hostnameArray.length - 1]
  const domainName = hostnameArray[hostnameArray.length - 2]
  return `${domainName}.${topLevelDomain}`
}

// Return true if current domain has been trusted by the user
function isCurrentDomainTrusted () {
  const domain = getCurrentTopDomain()
  return isDomainTrusted(domain)
}

// Permission bar; Create a button with inner text @text executing onclick
// @clickCallback, appended as a child of @logDiv, with style @inlineStyle.
function createButton (logDiv, text, id, clickCallback, inlineStyle = '') {
  const button = document.createElement('button')
  button.innerHTML = text
  button.id = id
  button.style.cssText = `
    margin-right: 20px;
    padding: 5px;
    cursor: pointer;
    ${inlineStyle}
  `
  button.addEventListener('click', clickCallback)
  logDiv.appendChild(button)
}

// Permission bar; Create "Allow Once" button
function createOpenPopupButton (logDiv, a, b, c) {
  createButton(
    logDiv,
    '🟢 Allow Once',
    'upb_allow',
    () => {
      realWindowOpen(a, b, c) // Allow the popup once
      global.upbCounter = 0 // Reset the popup counter to 0
      closeLogDiv(logDiv) // Close the permission bar
    },
    'color: green;'
  )
}

// Permission bar; Create "Always Allow" button and apply changes immediately
function createTrustButton (logDiv, domain, a, b, c) {
  createButton(
    logDiv,
    '🔵 Always Allow',
    'upb_trust',
    () => {
      addDomainToLocalStorage(domain) // Trust the domain immediately
      realWindowOpen(a, b, c) // Allow the popup
      global.upbCounter = 0 // Reset the popup counter to 0

      // Update the list of trusted domains in the modal
      if (document.getElementById('trusted-domains-modal')) {
        showTrustedDomainsModal()
      }

      // Directly modify window.open behavior for the trusted domain
      global.open = realWindowOpen // Allow future popups

      closeLogDiv(logDiv) // Close the permission bar
    },
    'color: blue;'
  )
}

// Permission bar; Create close button with timeout reset
function createCloseButton (logDiv) {
  createButton(
    logDiv,
    `🔴 Deny (${timeleft})`,
    'upb_close',
    () => {
      closeLogDiv(logDiv)
      global.upbCounter = 0 // Reset the popup counter to 0
      patchPopupOpener() // Re-patch window.open after timeout or denial
    },
    'color: red;'
  )
}

// Permission bar; Create "Config" button, opening trusted sites modal.
function createConfigButton (logDiv) {
  createButton(
    logDiv,
    '🟠 Config',
    'upb_config',
    () => {
      showTrustedDomainsModal() // Open the config modal
    },
    'color: orange; float: right;' // Move config button to the far right
  )
}

// Permission bar; Create message within the logDiv
function createDialogMessage (logDiv, url) {
  let popupUrl
  const msg = `Ultra Popup Blocker: This site is attempting to open <b>${global.upbCounter}</b> popups.`

  if (url.length > 50) {
    popupUrl = `${url.substring(0, 50)}..`
  } else {
    popupUrl = url
  }

  logDiv.innerHTML = `${msg} <a href="${url}" style="color:yellow;">${popupUrl}</a>`
}

// Reset the deny timeout and restart countdown when a new popup is blocked
function resetDenyTimeout (logDiv) {
  timeleft = 15 // Reset time
  const closeButton = document.getElementById('upb_close')
  if (closeButton) {
    closeButton.innerHTML = `🔴 Deny (${timeleft})`
  }
  clearInterval(denyTimeoutId)
  denyTimeoutId = setInterval(() => {
    timeleft -= 1
    closeButton.innerHTML = `🔴 Deny (${timeleft})`
    if (timeleft <= 0) {
      clearInterval(denyTimeoutId)
      closeLogDiv(logDiv)
      patchPopupOpener() // Re-patch window.open after timeout
    }
  }, 1000)
}

// Poll the document to block popups
function patchPopupOpener () {
  if (global.open !== realWindowOpen) {
    return
  }

  // If domain is already trusted, allow popups
  if (isCurrentDomainTrusted()) {
    console.log(`[UPB] Trusted domain: ${getCurrentTopDomain()}`)
    global.open = realWindowOpen // Directly open popups if trusted
    return
  }

  // Fake window.open to block popups
  global.open = (a, b, c) => {
    global.upbCounter += 1 // Increment counter for each blocked popup
    console.log(`[UPB] Popup blocked: ${a}`)

    const logDiv = getLogDiv()
    createDialogMessage(logDiv, a)

    createOpenPopupButton(logDiv, a, b, c) // Create Allow button
    createTrustButton(logDiv, getCurrentTopDomain(), a, b, c) // Create Always Allow button
    createCloseButton(logDiv) // Create Deny button
    createConfigButton(logDiv) // Add Config button

    logDiv.style.display = 'block'

    // Reset and restart the deny timeout whenever a new popup is blocked
    resetDenyTimeout(logDiv)

    return FakeWindow // Fake window object returned
  }
}

// Patch the opener on page load
window.onload = patchPopupOpener

// Register Config menu in Tampermonkey script manager
attachToExtensionMenu('Ultra Popup Blocker: Trusted domains', showTrustedDomainsModal)
