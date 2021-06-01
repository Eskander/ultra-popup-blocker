# Ultra Popup Blocker
Ultra Popup Blocker (or UPB for short) is a lightweight Popup Blocker that aims to block
**all popup windows** by default, (even good, unharmful, user-initiated ones) on a permission
model, while providing a clean [Permission manager][whtlstid] for easy configuration.

<p align="center"><img src="https://raw.githubusercontent.com/Eskander/ultra-popup-blocker/master/screenshots/bottom-bar.png"></p>

### Why another popup blocker?
Built-in Firefox and Chrome popup blockers blocks only the popups that were created automatically via scripts on page load etc. When you click on a button on the page, it won't block it.
However, malicious websites can create JS code that will launch the popups whenever you click on any blank space on the page for instance.

### How does it work?
In JavaScript, functions are first-order citizens. It means you can store a function in a variable and pass it freely. You can also modify the native functions provided by the browser, like 'window.open'.
Here, we override 'window.open' with our own implementation which prompts the user to see whether he really wants to open a popup window.

### Managing permissions
Use the permission manager provided with Ultra Popup Blocker to set which websites are trusted to open popups freely.

<p align="center"><img src="https://raw.githubusercontent.com/Eskander/ultra-popup-blocker/master/screenshots/whitelist-config.png"></p>

### Install instructions
1. Get a userscript manager from your browser's addon store. I personally use [Tampermonkey on Firefox ➚][ext].
2. Add **Ultra Popup Blocker** from one of the following sources:

# [![GreasyFork][button1]][link1] [![OpenUserJS][button2]][link2] [![GitHub][button3]][link3]

  [ext]: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/
  [whtlstid]: #managing-permissions

  [button1]: https://img.shields.io/badge/Install-GreasyFork-red.svg?longCache=true&style=for-the-badge&
  [link1]: https://greasyfork.org/en/scripts/387937-ultra-popup-blocker
  
  [button2]: https://img.shields.io/badge/Install-OpenUserJS-blue.svg?longCache=true&style=for-the-badge
  [link2]: https://openuserjs.org/scripts/eskander/Ultra_Popup_Blocker
  
  [button3]: https://img.shields.io/badge/Install-GitHub-lightgrey.svg?longCache=true&style=for-the-badge
  [link3]: https://github.com/Eskander/ultra-popup-blocker/raw/master/ultra-popup-blocker.user.js
  
