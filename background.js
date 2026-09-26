/**
 * Chrome DevTools Protocol (CDP) Controller
 * [DEPRECATED in favor of Page Context Injection]
 */

let buildInterval = null;
let attachedTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!sender || !sender.tab || !sender.tab.id) return;
    const tabId = sender.tab.id;

    if (message.action === "start") {
        if (attachedTabId !== tabId) {
            chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
                if (chrome.runtime.lastError) {
                    console.error("Debugger attachment failed:", chrome.runtime.lastError.message);
                    return;
                }
                attachedTabId = tabId;
                startLoop(tabId, message.x, message.y);
            });
        } else {
            startLoop(tabId, message.x, message.y);
        }
        sendResponse({status: "started"});
    } else if (message.action === "stop") {
        stopLoop();
        sendResponse({status: "stopped"});
    }
    return true; // Keep message channel open for async response
});

function startLoop(tabId, x, y) {
    if (buildInterval) clearInterval(buildInterval);
    
    executeMacroStep(tabId, x, y);
    
    buildInterval = setInterval(() => {
        executeMacroStep(tabId, x, y);
    }, 300);
}

function stopLoop() {
    if (buildInterval) {
        clearInterval(buildInterval);
        buildInterval = null;
    }
    if (attachedTabId) {
        chrome.debugger.detach({ tabId: attachedTabId }, () => {
            if (chrome.runtime.lastError) {} // Silently consume detachment errors
        });
        attachedTabId = null;
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executeMacroStep(tabId, x, y) {
    // Terminate sequence if the CDP session has been abruptly detached
    if (attachedTabId !== tabId) return;
    
    const debuggee = { tabId: tabId };
    
    try {
        await chrome.debugger.sendCommand(debuggee, "Input.dispatchKeyEvent", {
            type: "keyDown",
            windowsVirtualKeyCode: 49,
            text: "1"
        });
        
        await sleep(20);
        if (attachedTabId !== tabId) return;
        
        await chrome.debugger.sendCommand(debuggee, "Input.dispatchKeyEvent", {
            type: "keyUp",
            windowsVirtualKeyCode: 49
        });

        await sleep(50);
        if (attachedTabId !== tabId) return;

        await chrome.debugger.sendCommand(debuggee, "Input.dispatchMouseEvent", {
            type: "mouseMoved",
            x: x,
            y: y
        });
        
        await sleep(20);
        if (attachedTabId !== tabId) return;

        await chrome.debugger.sendCommand(debuggee, "Input.dispatchMouseEvent", {
            type: "mousePressed",
            x: x,
            y: y,
            button: "left",
            clickCount: 1
        });
        
        await sleep(20);
        if (attachedTabId !== tabId) return;
        
        await chrome.debugger.sendCommand(debuggee, "Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x: x,
            y: y,
            button: "left",
            clickCount: 1
        });

    } catch (e) {
        // Silently consume expected detachment exceptions to prevent unhandled promise rejections
        if (e.message.includes("Detached")) {
            return;
        }
        console.error("CDP execution pipeline failed:", e);
        stopLoop();
    }
}