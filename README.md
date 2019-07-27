# Ultra Popup Blocker
Ultra Popup Blocker (or UPB for short) is a lightweight Popup Blocker that aims to *radically* block **all popup windows** by default, (even good, unharmful, user-initiated ones) while giving users control to allow popups temporarily or permanently via a whitelisting mechanism.


### Why another popup blocker?

Built-in Firefox and Chrome popup blockers blocks only the popups that were created automatically via script on page load etc. When you click on a button on the page, it won't block it.
However, malicious websites can create JS code that will launch the popups whenever you click on any blank space on the page for instance.

### How does it work?
In JavaScript, functions are first-order citizens. It means you can store a function in a variable and pass it freely. You can also modify the native functions provided by the browser, like 'window.open'.
Here, we override 'window.open' with our own implementation which prompts the user to see whether he really wants to open a popup window.
#### Tests: http://www.popuptest.com/

### Install instructions
1. Get a userscript manager from your browser's addon store. I personally use [Tampermonkey on Firefox ➚][ext].
2. Add **Ultra Popup Blocker** from one of the following sources:

# [![GreasyFork][b1]][l1] [![OpenUserJS][b2]][l2] [![GitHub][b3]][l3]

  [ext]: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/

  [b1]: https://img.shields.io/badge/Install-GreasyFork-red.svg?longCache=true&style=for-the-badge&
  [b2]: https://img.shields.io/badge/Install-OpenUserJS-blue.svg?longCache=true&style=for-the-badge
  [b3]: https://img.shields.io/badge/Install-GitHub-lightgrey.svg?longCache=true&style=for-the-badge

  [l1]: https://greasyfork.org/en/scripts/387937-ultra-popup-blocker
  [l2]: https://openuserjs.org/scripts/eskander/Ultra_Popup_Blocker
  [l3]: https://github.com/Eskander/ultra-popup-blocker/raw/master/ultra-popup-blocker.user.js
