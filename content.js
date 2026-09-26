/**
 * Content Script Bootstrapper
 * 
 * Injects the core payload directly into the host page's execution context.
 * This bypasses Chrome's isolated world restrictions, granting the payload
 * direct access to the target engine's global variables and native DOM events.
 */

const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    // Clean up the DOM footprint after successful execution
    this.remove();
};
(document.head || document.documentElement).appendChild(script);