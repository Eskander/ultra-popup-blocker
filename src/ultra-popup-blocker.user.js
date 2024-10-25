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
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.registerMenuCommand
// ==/UserScript==

/* Constants and Globals */
const CONSTANTS = {
  TIMEOUT_SECONDS: 15,
  TRUNCATE_LENGTH: 50,
  MODAL_WIDTH: '400px'
}

const STYLES = {
  modal: `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    width: ${CONSTANTS.MODAL_WIDTH};
    border: 1px solid black;
    z-index: 100000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
  `,
  modalHeader: `
    background-color: black;
    padding: 30px 40px;
    color: white;
    text-align: center;
  `,
  modalFooter: `
    background-color: black;
    padding: 5px 40px;
    color: white;
    text-align: center;
  `,
  button: `
    margin-right: 20px;
    padding: 5px;
    cursor: pointer;
  `,
  notificationBar: `
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 99999;
    width: 100%;
    padding: 5px;
    font: status-bar;
    background-color: black;
    color: white;
  `,
  listItem: `
    padding: 12px 8px 12px 40px;
    font-size: 18px;
    background-color: white;
    border-bottom: 1px solid #ccc;
    position: relative;
    transition: 0.2s;
  `,
  removeButton: `
    cursor: pointer;
    position: absolute;
    right: 0;
    top: 0;
    padding: 12px 16px;
  `
}

// Reference to page's window through GreaseMonkey
const global = unsafeWindow
global.upbCounter = 0

// Store reference to original window.open
const realWindowOpen = global.open

// Fake window object to prevent JS errors
const FakeWindow = {
  blur: () => false,
  focus: () => false
}

/* Domain Management */
class DomainManager {
  static async getCurrentTopDomain () {
    const [domainName, topLevelDomain] = document.location.hostname.split('.').slice(-2)
    return `${domainName}.${topLevelDomain}`
  }

  static async isCurrentDomainTrusted () {
    const domain = await this.getCurrentTopDomain()
    return await GM.getValue(domain)
  }

  static async addTrustedDomain (domain) {
    await GM.setValue(domain, true)
  }

  static async removeTrustedDomain (domain) {
    await GM.deleteValue(domain)
  }

  static async getTrustedDomains () {
    return await GM.listValues()
  }
}

/* UI Components */
class UIComponents {
  static createButton (text, id, clickHandler, color) {
    const button = document.createElement('button')
    button.id = `upb-${id}`
    button.innerHTML = text
    button.style.cssText = `${STYLES.button} color: ${color};`
    button.addEventListener('click', clickHandler)
    return button
  }

  static createNotificationBar () {
    const bar = document.createElement('div')
    bar.id = 'upb-notification-bar'
    bar.style.cssText = STYLES.notificationBar
    return bar
  }

  static createModalElement () {
    const modal = document.createElement('div')
    modal.id = 'upb-trusted-domains-modal'
    modal.style.cssText = STYLES.modal
    return modal
  }

  static updateDenyButtonText (button, timeLeft) {
    if (button) {
      button.innerHTML = `🔴 Deny (${timeLeft})`
    }
  }
}

/* Notification Bar */
class NotificationBar {
  constructor () {
    this.element = document.getElementById('upb-notification-bar') || this.createElement()
    this.timeLeft = CONSTANTS.TIMEOUT_SECONDS
    this.denyTimeoutId = null
    this.denyButton = null
  }

  createElement () {
    const bar = UIComponents.createNotificationBar()
    document.body.appendChild(bar)
    return bar
  }

  show (url) {
    this.element.style.display = 'block'
    this.setMessage(url)
    this.addButtons(url)
    this.startDenyTimeout()
  }

  hide () {
    this.element.style.display = 'none'
    global.upbCounter = 0
    this.clearDenyTimeout()
  }

  clearDenyTimeout () {
    if (this.denyTimeoutId) {
      clearInterval(this.denyTimeoutId)
      this.denyTimeoutId = null
    }
  }

  setMessage (url) {
    const truncatedUrl = url.length > CONSTANTS.TRUNCATE_LENGTH
      ? `${url.substring(0, CONSTANTS.TRUNCATE_LENGTH)}..`
      : url

    this.element.innerHTML = `
      Ultra Popup Blocker: This site is attempting to open <b>${global.upbCounter}</b> popup(s).
      <a href="${url}" style="color:yellow;">${truncatedUrl}</a>
    `
  }

  async addButtons (url) {
    const currentDomain = await DomainManager.getCurrentTopDomain()

    // Allow Once
    this.element.appendChild(
      UIComponents.createButton('🟢 Allow Once', 'allow', () => {
        realWindowOpen(url)
        this.hide()
      }, 'green')
    )

    // Always Allow
    this.element.appendChild(
      UIComponents.createButton('🔵 Always Allow', 'trust', async () => {
        await DomainManager.addTrustedDomain(currentDomain)
        realWindowOpen(url)
        this.hide()
        global.open = realWindowOpen
      }, 'blue')
    )

    // Deny
    this.denyButton = UIComponents.createButton('🔴 Deny (15)', 'deny', () => {
      this.hide()
      PopupBlocker.initialize()
    }, 'red')
    this.element.appendChild(this.denyButton)

    // Config
    const configButton = UIComponents.createButton('🟠 Config', 'config', () => {
      new TrustedDomainsModal().show()
    }, 'orange')
    configButton.style.float = 'right'
    this.element.appendChild(configButton)
  }

  startDenyTimeout () {
    this.timeLeft = CONSTANTS.TIMEOUT_SECONDS
    this.clearDenyTimeout()

    // Initial update
    UIComponents.updateDenyButtonText(this.denyButton, this.timeLeft)

    this.denyTimeoutId = setInterval(() => {
      this.timeLeft--
      UIComponents.updateDenyButtonText(this.denyButton, this.timeLeft)

      if (this.timeLeft <= 0) {
        this.clearDenyTimeout()
        this.hide()
        PopupBlocker.initialize()
      }
    }, 1000)
  }

  resetTimeout () {
    if (this.element.style.display === 'block') {
      this.startDenyTimeout()
    }
  }
}

/* Trusted Domains Modal */
class TrustedDomainsModal {
  constructor () {
    this.element = document.getElementById('upb-trusted-domains-modal') || this.createElement()
  }

  createElement () {
    const modal = UIComponents.createModalElement()

    const header = document.createElement('div')
    header.style.cssText = STYLES.modalHeader
    header.innerHTML = `
      <h2>Ultra Popup Blocker</h2>
      <h3 style="text-align:left;margin-top:10px;">Trusted websites:</h3>
    `
    modal.appendChild(header)

    const footer = document.createElement('div')
    footer.style.cssText = STYLES.modalFooter

    const closeButton = document.createElement('button')
    closeButton.innerText = 'Close'
    closeButton.style.cssText = `
      background-color: gray;
      color: white;
      border: none;
      padding: 10px;
      cursor: pointer;
    `
    closeButton.onclick = () => this.hide()

    footer.appendChild(closeButton)
    modal.appendChild(footer)

    document.body.appendChild(modal)
    return modal
  }

  show () {
    this.refreshDomainsList()
    this.element.style.display = 'block'
  }

  hide () {
    this.element.style.display = 'none'
  }

  async refreshDomainsList () {
    const existingList = document.getElementById('upb-domains-list')
    if (existingList) existingList.remove()

    const list = document.createElement('ul')
    list.id = 'upb-domains-list'
    list.style.cssText = 'margin:0;padding:0;list-style-type:none;'

    const trustedDomains = await DomainManager.getTrustedDomains()

    if (trustedDomains.length === 0) {
      const message = document.createElement('p')
      message.style.padding = '20px'
      message.innerText = 'No allowed websites'
      list.appendChild(message)
    } else {
      for (const domain of trustedDomains) {
        await this.addDomainListItem(list, domain)
      }
    }

    this.element.insertBefore(list, this.element.querySelector('div:last-child'))
  }

  async addDomainListItem (list, domain) {
    const item = document.createElement('li')
    item.style.cssText = STYLES.listItem
    item.innerText = domain

    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#ddd'
    })
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = 'white'
    })

    const removeButton = document.createElement('span')
    removeButton.style.cssText = STYLES.removeButton
    removeButton.innerText = '×'

    removeButton.addEventListener('mouseover', () => {
      removeButton.style.backgroundColor = '#f44336'
      removeButton.style.color = 'white'
    })
    removeButton.addEventListener('mouseout', () => {
      removeButton.style.backgroundColor = 'transparent'
      removeButton.style.color = 'black'
    })
    removeButton.addEventListener('click', async () => {
      await DomainManager.removeTrustedDomain(domain)
      item.remove()
      PopupBlocker.initialize()
    })

    item.appendChild(removeButton)
    list.appendChild(item)
  }
}

/* Popup Blocker */
class PopupBlocker {
  static async initialize () {
    if (global.open !== realWindowOpen) return

    if (await DomainManager.isCurrentDomainTrusted()) {
      const domain = await DomainManager.getCurrentTopDomain()
      console.log(`[UPB] Trusted domain: ${domain}`)
      global.open = realWindowOpen
      return
    }

    const notificationBar = new NotificationBar()

    global.open = (url, target, features) => {
      global.upbCounter++
      console.log(`[UPB] Popup blocked: ${url}`)

      if (notificationBar.element.style.display === 'block') {
        notificationBar.resetTimeout()
      }
      notificationBar.show(url)

      return FakeWindow
    }
  }
}

/* Initialize */
window.addEventListener('load', () => PopupBlocker.initialize())
GM.registerMenuCommand('Ultra Popup Blocker: Trusted domains', () => new TrustedDomainsModal().show())
