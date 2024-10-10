export class DebugBox {
    constructor() {
        console.log('DebugBox constructor called');
        this.createDebugBox();
        console.log('DebugBox initialized');
    }

    createDebugBox() {
        console.log('Creating debug box');
        const debugBox = document.createElement('div');
        debugBox.id = 'debug-box';
        debugBox.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            color: white;
            font-family: monospace;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            z-index: 2147483647;
        `;
        document.body.appendChild(debugBox);

        const debugContent = document.createElement('div');
        debugContent.id = 'debug-content';
        debugContent.style.cssText = `
            height: 15vh;
            overflow-y: auto;
            padding: 10px;
            transition: height 0.3s ease;
        `;
        debugBox.appendChild(debugContent);

        const debugControls = document.createElement('div');
        debugControls.style.cssText = `
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            background-color: rgba(0, 0, 0, 0.8);
        `;
        debugBox.appendChild(debugControls);

        const resizeButtons = document.createElement('div');
        resizeButtons.style.cssText = `
            display: flex;
            gap: 5px;
        `;

        const upButton = document.createElement('button');
        upButton.textContent = '▲';
        upButton.addEventListener('click', () => this.resizeDebugBox('up'));
        resizeButtons.appendChild(upButton);

        const downButton = document.createElement('button');
        downButton.textContent = '▼';
        downButton.addEventListener('click', () => this.resizeDebugBox('down'));
        resizeButtons.appendChild(downButton);

        debugControls.appendChild(resizeButtons);

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Debug';
        copyButton.addEventListener('click', () => this.copyDebugContent());
        debugControls.appendChild(copyButton);

        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Debug';
        clearButton.addEventListener('click', () => this.clearDebugContent());
        debugControls.appendChild(clearButton);

        this.debugBox = debugBox;
        this.debugContent = debugContent;
        this.upButton = upButton;
        this.downButton = downButton;
        console.log('Debug box created and appended to body');
    }

    resizeDebugBox(direction) {
        const currentHeight = this.debugContent.style.height;

        if (direction === 'up') {
            if (currentHeight === '0px' || currentHeight === '0') {
                this.debugContent.style.height = '15vh';
            } else if (currentHeight === '15vh') {
                this.debugContent.style.height = '30vh';
            } else if (currentHeight === '30vh') {
                this.debugContent.style.height = '60vh';
            }
        } else if (direction === 'down') {
            if (currentHeight === '60vh') {
                this.debugContent.style.height = '30vh';
            } else if (currentHeight === '30vh') {
                this.debugContent.style.height = '15vh';
            } else if (currentHeight === '15vh') {
                this.debugContent.style.height = '0';
                this.debugContent.style.padding = '0';
            }
        }

        if (this.debugContent.style.height !== '0' && this.debugContent.style.height !== '0px') {
            this.debugContent.style.padding = '10px';
        }

        this.updateButtonStates();
    }

    updateButtonStates() {
        const currentHeight = this.debugContent.style.height;
        this.upButton.disabled = currentHeight === '60vh';
        this.downButton.disabled = currentHeight === '0' || currentHeight === '0px';
    }

    copyDebugContent() {
        navigator.clipboard.writeText(this.debugContent.innerText)
            .then(() => this.log('Debug content copied to clipboard'))
            .catch(err => this.log('Failed to copy debug content: ' + err));
    }

    clearDebugContent() {
        this.debugContent.innerHTML = '';
        this.log('Debug content cleared');
    }
}

console.log('Creating debugBox instance');
export const debugBox = new DebugBox();
console.log('debugBox instance created');

// Intercept console.log, console.error, and console.warn
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
    debugBox.log(`LOG: ${args.join(' ')}`);
    originalLog.apply(console, args);
};

console.error = (...args) => {
    debugBox.log(`ERROR: ${args.join(' ')}`);
    originalError.apply(console, args);
};

console.warn = (...args) => {
    debugBox.log(`WARN: ${args.join(' ')}`);
    originalWarn.apply(console, args);
};

// Intercept unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    debugBox.log(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
});

// Intercept global errors
window.addEventListener('error', (event) => {
    debugBox.log(`GLOBAL ERROR: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`);
});