// ==UserScript==
// @name           Ultra Popup Blocker
// @description    Configurable popup blocker that blocks all popup windows by default. You can easily open the blocked popup or whitelist a domain, directly from the page.
// @namespace      https://github.com/eskander
// @author         eskander
// @version        2.1
// @include        *
// @license        MIT
// @homepage       https://github.com/eskander/ultra-popup-blocker
// @supportURL     https://github.com/eskander/ultra-popup-blocker/issues
// @compatible     firefox Tampermonkey recommended
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_openInTab
// @grant          GM_registerMenuCommand
// ==/UserScript==

(function () {

    // ============================== CONFIG =================================
    var bDisplayMessageOnPopupBlocked = true;
    var bDisplayOpenPopupLink = true;
    var bDisplayWhiteListThisDomainLink = true;
    var LOG_ID = "ultra_popup_blocker"; // HTML ID in the page

    // ============================ FUNCTIONS ================================
    var global = unsafeWindow; // reference to page's "window" through GreaseMonkey

    // Helper to create a button with inner text @text executing onclick @clickCallback,
    // appended as a child of @logDiv

    var putButton = function (logDiv, text, clickCallback, inlineStyle) {
        var button = document.createElement("button");
        button.innerHTML = text;
        button.style.cssText = "text-decoration: none;\
                                color: black;\
                                cursor: pointer;\
                                margin: 0 5px;\
                                padding: 1px 3px;\
                                background-color: rgb(255, 255, 255);\
                                border-width: 0px;\
                                border-style: outset;\
                                color: black;" + inlineStyle;
        logDiv.appendChild(button);
        button.addEventListener("click", clickCallback);
    };


    // Helper to create a button (child of @logDiv) which onclick whitelists @domain
    // in internal Firefox storage.

    var putWhitelistButton = function (logDiv, domain) {
        putButton(logDiv, "Whitelist &#128504;", function () {
            GM_setValue("whitelisted_" + domain, true);
        });
    };

    // Helper to create a text node with @text and append to @logDiv

    var putText = function (logDiv, text) {
        var node = document.createTextNode(text);
        logDiv.appendChild(node);
    };

    // Return logger div, or create it ad-hoc.

    var getLogDiv = function () {
        var logDiv = document.getElementById(LOG_ID);
        if (!logDiv) {
            logDiv = document.createElement("div");
            logDiv.setAttribute("id", LOG_ID);
            logDiv.style.cssText = "position: fixed;\
                                    bottom: 0;\
                                    left: 0;\
                                    z-index: 99999;\
                                    width: 100%;\
                                    padding: 5px 5px 5px 5px;\
                                    font: status-bar;\
                                    background-color: black;\
                                    color: white;";
            document.body.appendChild(logDiv);
        }
        return logDiv;
    };

    // Get top domain to whitelist.

    var getDomainsArray = function (documentDomain) {
        // e.g. domain = www.google.com, topDomain = google.com
        var d1 = documentDomain;
        var domainsArr = [];

        while (d1.split(".").length > 2) {
            d1 = d1.substring(d1.indexOf('.') + 1);
        }

        domainsArr.push(d1);
        return domainsArr;
    };

    // Checks if domain we're currently browsing has been whitelisted by the user
    // to display popups.

    var isCurrentDomainWhiteListed = function () {
        var domains = getDomainsArray(document.domain);
        var whitelisted = domains.some(function (d) {
            return GM_getValue("whitelisted_" + d);
        }); // if any 'd' in 'domains' was whitelisted, we return true
        return whitelisted;
    };

    // "window.open()" returns Window which might be then used by the originator page
    // to focus the popup (annoying splash popup) or blur it to retain focus in the original page
    // (pay-by-impressions popup, I don't need it to actually see it).
    // We need to return the fake window to not encounter JS runtime error when the popup originator
    // page wants to call focus() or blur().

    var FakeWindow = {
        blur: function () {
            return false;
        },
        focus: function () {
            return false;
        }
    };

    // Storing a reference to real "window.open" method in case we wanted
    // to actually open a blocked popup

    var realWindowOpen = global.open;

    // This function will be called each time a script wants to open a new window,
    // if the blocker is activated.
    // We handle the blocking & messaging logic here.

    var fakeWindowOpen = function (url) {
        if (!bDisplayMessageOnPopupBlocked) {
            return FakeWindow;
        }
        var logDiv = getLogDiv();
        logMessage(logDiv, url);

        if (bDisplayOpenPopupLink) {
            displayOpenPopupLink(logDiv, arguments);
        }
        if (bDisplayWhiteListThisDomainLink) {
            displayWhiteListThisDomainLink(logDiv);
        }
        displayCloseButton(logDiv);

        displayConfigButton(logDiv);

        return FakeWindow; // see the doc of FakeWindow
    };

    var logMessage = function (logDiv, url) {
        global.upb_counter = (global.upb_counter || 0);
        url = (url[0] == '/') ? document.domain + url : url;
        if (global.upb_counter++ == 0) {
            var msg = ["<b>[UPB]</b> Blocked <b>1</b> popup: <u>", url, "</u>"].join("");
        } else {
            var msg = ["<b>[UPB]</b> Blocked <b>", global.upb_counter, "</b> popups, last: <u>", url, "</u>"].join("");
        }
        logDiv.innerHTML = msg;
        console.log(msg);
        logDiv.style.display = "block";
    };

    var displayOpenPopupLink = function (logDiv, realArguments) {
        putButton(logDiv, "Open &#8599;", function () {
            realWindowOpen.apply(null, realArguments);
        });
    };

    var displayWhiteListThisDomainLink = function (logDiv) {
        var domainsArr = getDomainsArray(document.domain);
        putWhitelistButton(logDiv, domainsArr[0]);
    };

    var displayCloseButton = function (logDiv) {
        putButton(logDiv, "Close &#10799;", function () {
            logDiv.style.display = 'none';
        }, 'background-color: #a00;\
            color: white;\
            margin: 0 10px 0 0;\
            float: right');
    };

    var displayConfigButton = function (logDiv) {
        putButton(logDiv, "Config &#9881;", function () {
            GM_openInTab("https://eskander.github.io/ultra-popup-blocker/configure.html", false);
        }, 'float:right');
    };

    // Override browser's "window.open" with our own implementation.

    var activateBlocker = function () {
        global.open = fakeWindowOpen;
    };

    // ============================== SETTINGS PAGE =================================

    // Add configure link to Tampermonkey's menu

    GM_registerMenuCommand('Configure whitelist', function () {
        GM_openInTab("https://eskander.github.io/ultra-popup-blocker/configure.html", false);
    }, 'r');

    // Only run whitelisting mechanism on the appropriate page

    if (window.location.href === "https://eskander.github.io/ultra-popup-blocker/configure.html") {

        // Add listener to the add button

        document.getElementsByClassName("addBtn")[0].addEventListener("click", function () {
            newElement();
        });

        // Create a "close" button and append it to each list item

        var Nodelist = document.getElementsByTagName("LI");
        for (var i = 0; i < Nodelist.length; i++) {
            var span = document.createElement("SPAN");
            var txt = document.createTextNode("\u00D7");
            span.className = "close";
            span.appendChild(txt);
            span.onclick = function () {
                var div = this.parentElement;
                var domain = div.innerText.replace("\n\u00D7", "");
                GM_deleteValue("whitelisted_" + domain);
                div.style.display = "none";
                console.log('[UPB] Domain removed from whitelist: ' + domain);
            }
            Nodelist[i].appendChild(span);
        }

        // Create a new list item when clicking on the "Add" button

        var newElement = function () {
            var inputValue = document.getElementById("Input").value;

            if (inputValue === '') {
                alert("You must write a domain or subdomain to whitelist.");
            } else {
                addElement(inputValue);
            }

            document.getElementById("Input").value = "";
        }

        var addElement = function (Value) {
            var li = document.createElement("li");
            var t = document.createTextNode(Value);
            li.appendChild(t);

            document.getElementById("List").appendChild(li);
            GM_setValue("whitelisted_" + Value, true);
            console.log('[UPB] Domain added to whitelist: ' + Value);

            // Add a close button to the newly created item
            var span = document.createElement("SPAN");
            var txt = document.createTextNode("\u00D7");
            span.className = "close";
            span.appendChild(txt);
            span.onclick = function () {
                var div = this.parentElement;
                var domain = div.innerText.replace("\n\u00D7", "");
                GM_deleteValue("whitelisted_" + domain);
                div.style.display = "none";
                console.log('[UPB] Domain removed from whitelist: ' + domain);
            }
            li.appendChild(span);
        }

        // Show already stored elements in the list

        var storedWhitelist = GM_listValues();
        storedWhitelist.forEach(populate);
        console.log(storedWhitelist);

        function populate(value, index, array) {
            addElement(value.replace("whitelisted_", ""));
        }
    }

    // ============================ LET'S RUN IT ================================

    var disabled = isCurrentDomainWhiteListed();
    if (disabled) {
        console.log('[UPB] Current domain was found on a white list. UPB disabled.');
    } else {
        activateBlocker();
    }
})();