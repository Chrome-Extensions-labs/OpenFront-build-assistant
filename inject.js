/**
 * OpenFront Hardware Macro Payload
 * 
 * Executes entirely within the target page's context. 
 * Manages stateful keystroke tracking and dispatches high-frequency 
 * synthetic events to emulate realistic user interactions.
 */

(function() {
    const pressedKeys = new Set();
    let loopActive = false;
    let targetX = 0;
    let targetY = 0;
    let buildInterval = null;
    
    // State registry for the currently active building hotkey
    let activeKey = '1';
    let activeCode = 'Digit1';
    let activeKeyCode = 49;

    // Movement threshold (in pixels) to trigger sequence abortion
    const MOUSE_MOVE_THRESHOLD = 50;
    
    // Execution polling rate. Defines the ms delay between synthetic macro steps.
    // Optimal stability at 75ms (approx. 13 operations per second).
    const BUILD_SPEED = 75; 

    /**
     * Hardware input listeners (Capture Phase)
     */
    window.addEventListener('keydown', (e) => {
        // Filter out synthetic events dispatched by this payload to prevent recursive feedback loops
        if (!e.isTrusted) return; 
        pressedKeys.add(e.code);
    }, true);

    window.addEventListener('keyup', (e) => {
        if (!e.isTrusted) return; 
        
        pressedKeys.delete(e.code);
        
        // Terminate the sequence if primary modifier or the active building digit is released
        if (e.code === 'KeyZ' || e.code === activeCode) {
            stopLoop();
        }
    }, true);

    // Purge hardware state registry on context loss to prevent phantom input locks
    window.addEventListener('blur', () => {
        pressedKeys.clear();
        stopLoop();
    });

    /**
     * Macro Sequence Initialization
     */
    window.addEventListener('mousedown', (e) => {
        // Validate composite trigger: Primary Modifier (Z) + Mouse 0
        if (pressedKeys.has('KeyZ') && e.button === 0 && !loopActive) {
            
            // Scan state registry for the secondary modifier (Digits 1-9) dictating the target entity index
            let foundDigit = null;
            for (let i = 1; i <= 9; i++) {
                if (pressedKeys.has(`Digit${i}`)) {
                    foundDigit = i;
                    break;
                }
            }

            // Resolve operational parameters and allocate sequence
            if (foundDigit !== null) {
                activeKey = foundDigit.toString();
                activeCode = `Digit${foundDigit}`;
                activeKeyCode = 48 + foundDigit; // Map to ASCII baseline (48 = '0')

                loopActive = true;
                targetX = e.clientX;
                targetY = e.clientY;
                startLoop();
            }
        }
    }, true);

    /**
     * Positional Variance Monitor
     */
    window.addEventListener('mousemove', (e) => {
        if (loopActive) {
            // Calculate euclidean distance delta
            const dist = Math.sqrt(Math.pow(e.clientX - targetX, 2) + Math.pow(e.clientY - targetY, 2));
            if (dist > MOUSE_MOVE_THRESHOLD) {
                stopLoop();
            }
        }
    }, true);

    /**
     * Execution Controller
     */
    function startLoop() {
        if (buildInterval) clearInterval(buildInterval);
        
        executeStep(); // Dispatch immediate first frame
        
        buildInterval = setInterval(() => {
            if (!loopActive) {
                stopLoop();
                return;
            }
            executeStep();
        }, BUILD_SPEED);
    }

    function stopLoop() {
        loopActive = false;
        if (buildInterval) {
            clearInterval(buildInterval);
            buildInterval = null;
        }
    }

    /**
     * Synthetic Event Dispatcher
     */
    function executeStep() {
        // 1. Dispatch synthetic keystroke sequence targeting the engine's global input handler
        const keyEventDown = new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true,
            key: activeKey, code: activeCode, keyCode: activeKeyCode, which: activeKeyCode
        });
        document.dispatchEvent(keyEventDown);

        const keyEventUp = new KeyboardEvent('keyup', {
            bubbles: true, cancelable: true,
            key: activeKey, code: activeCode, keyCode: activeKeyCode, which: activeKeyCode
        });
        document.dispatchEvent(keyEventUp);

        // 2. Resolve the underlying DOM node (typically the primary canvas)
        const targetElement = document.elementFromPoint(targetX, targetY) || document.body;
        
        // 3. Dispatch a full synthetic pointer lifecycle
        const mouseEvents = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        
        mouseEvents.forEach(eventType => {
            const mouseEvent = new MouseEvent(eventType, {
                bubbles: true, cancelable: true, view: window,
                clientX: targetX, clientY: targetY,
                button: 0, buttons: eventType.includes('down') || eventType === 'click' ? 1 : 0
            });
            targetElement.dispatchEvent(mouseEvent);
        });
    }
})();