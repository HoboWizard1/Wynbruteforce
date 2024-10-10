export class DebugBox {
    constructor() {
        console.log('DebugBox constructor called');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createDebugBox());
        } else {
            this.createDebugBox();
        }
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
            height: 30vh;
            background-color: rgba(0, 0, 0, 0.9);
            color: white;
            font-family: monospace;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            z-index: 9999;
        `;
        document.body.appendChild(debugBox);

        const debugContent = document.createElement('div');
        debugContent.id = 'debug-content';
        debugContent.style.cssText = `
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
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

        const resizeButton = document.createElement('button');
        resizeButton.textContent = '▼';
        resizeButton.addEventListener('click', () => this.toggleDebugBoxSize());
        debugControls.appendChild(resizeButton);

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
        this.resizeButton = resizeButton;
        console.log('Debug box created and appended to body');
    }

    toggleDebugBoxSize() {
        const currentHeight = this.debugBox.style.height;
        if (currentHeight === '30vh') {
            this.debugBox.style.height = '60vh';
            this.resizeButton.textContent = '▼';
        } else if (currentHeight === '60vh') {
            this.debugBox.style.height = '30vh';
            this.resizeButton.textContent = '▲';
        } else {
            this.debugBox.style.height = '30vh';
            this.resizeButton.textContent = '▲';
        }
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

    log(message) {
        const logEntry = document.createElement('div');
        logEntry.textContent = `${new Date().toISOString()} - ${message}`;
        this.debugContent.appendChild(logEntry);
        this.debugContent.scrollTop = this.debugContent.scrollHeight;
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