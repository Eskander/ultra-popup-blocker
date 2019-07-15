# Ultra Popup Blocker
Ultra Popup Blocker (or UPB for short) is a lightweight Popup Blocker that aims to *radically* block **all popup windows** by default, (even good, unharmful, user-initiated ones) while giving users control to allow popups temporarily or permanently via a whitelisting mechanism.


### Why another popup blocker?

Built-in Firefox and Chrome popup blockers blocks only the popups that were created automatically via script on page load etc. When you click on a button on the page, it won't block it.
However, malicious websites can create JS code that will launch the popups whenever you click on any blank space on the page for instance.

### How does it work?
In JavaScript, functions are first-order citizens. It means you can store a function in a variable and pass it freely. You can also modify the native functions provided by the browser, like 'window.open'.
Here, we override 'window.open' with our own implementation which prompts the user to see whether he really wants to open a popup window.

#### Tests: http://www.popuptest.com/
