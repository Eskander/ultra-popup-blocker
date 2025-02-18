# **Ultra Popup Blocker**  

Ultra Popup Blocker (**UPB**) is a lightweight popup blocker designed to **block all popup windows by default**—even user-initiated ones—unless explicitly allowed. It provides a simple yet effective [Permission Manager][whtlstid] to manage exceptions.  

<p align="center"><img src="https://raw.githubusercontent.com/Eskander/ultra-popup-blocker/main/img/bottom-bar.png"></p>  

> [!Note]
> This project is in maintenance mode—no new features are planned.  

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)  

## **Why Another Popup Blocker?**  

Default popup blockers in Firefox and Chrome only block popups triggered automatically (e.g., on page load). However, some websites abuse popups by attaching them to any user interaction, including clicks on seemingly empty areas. **UPB** blocks these aggressive popups, giving you full control.  

## **How It Works**  

In JavaScript, functions are *first-class citizens*, meaning they can be stored in variables and modified. **UPB** takes advantage of this by overriding `window.open` with a custom implementation that prompts the user for confirmation before opening any popups.  

**Note:** This is not a foolproof solution. For comprehensive protection, use **uBlock Origin** with the appropriate filter lists.  

## **Managing Permissions**  

The built-in **Permission Manager** allows you to whitelist websites that should be allowed to open popups freely.  

<p align="center"><img width="400px" src="https://raw.githubusercontent.com/Eskander/ultra-popup-blocker/main/img/whitelist-config.png"></p>  

## **Installation Instructions**  

1. Install a **userscript manager** for your browser:  
   - **Firefox**: [Violentmonkey][ff_ext1] or [Tampermonkey][ff_ext2]  
   - **Chrome**: [Violentmonkey][cr_ext1] or [Tampermonkey][cr_ext2]  

2. Add **Ultra Popup Blocker** from one of the sources below:  

[![GreasyFork][button1]][link1] [![OpenUserJS][button2]][link2] [![GitHub][button3]][link3]  

[whtlstid]: #managing-permissions  
[ff_ext1]: https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/  
[ff_ext2]: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/  
[cr_ext1]: https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag  
[cr_ext2]: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo  

[button1]: https://img.shields.io/badge/Install-GreasyFork-red.svg?longCache=true&style=for-the-badge  
[link1]: https://greasyfork.org/en/scripts/387937-ultra-popup-blocker  

[button2]: https://img.shields.io/badge/Install-OpenUserJS-blue.svg?longCache=true&style=for-the-badge  
[link2]: https://openuserjs.org/scripts/eskander/Ultra_Popup_Blocker  

[button3]: https://img.shields.io/badge/Install-GitHub-lightgrey.svg?longCache=true&style=for-the-badge  
[link3]: https://github.com/Eskander/ultra-popup-blocker/raw/main/src/ultra-popup-blocker.user.js  
