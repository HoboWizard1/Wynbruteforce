import { debugBox } from './debug.js';

export const debugUtils = {
    logNetworkRequest: async (url, options = {}) => {
        debugBox.log(`Attempting network request to: ${url}`);
        debugBox.log(`Request method: ${options.method || 'GET'}`);
        if (options.headers) {
            debugBox.log(`Request headers: ${JSON.stringify(options.headers)}`);
        }
        
        try {
            const startTime = performance.now();
            const response = await fetch(url, options);
            const endTime = performance.now();
            
            debugBox.log(`Response status: ${response.status}`);
            debugBox.log(`Response time: ${(endTime - startTime).toFixed(2)}ms`);
            
            const responseHeaders = {};
            for (let [key, value] of response.headers) {
                responseHeaders[key] = value;
            }
            debugBox.log(`Response headers: ${JSON.stringify(responseHeaders)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            debugBox.log(`Network request failed: ${error.message}`);
            throw error;
        }
    },

    checkBrowserCompatibility: () => {
        const features = {
            'Fetch API': 'fetch' in window,
            'Promise': 'Promise' in window,
            'async/await': (async () => {})() instanceof Promise,
            'ES6 Modules': 'noModule' in document.createElement('script'),
            'localStorage': 'localStorage' in window,
            'sessionStorage': 'sessionStorage' in window
        };

        debugBox.log('Browser Compatibility Check:');
        for (const [feature, supported] of Object.entries(features)) {
            debugBox.log(`${feature}: ${supported ? 'Supported' : 'Not supported'}`);
        }
    },

    checkAPIEndpoint: async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            debugBox.log(`API endpoint (${url}) is ${response.ok ? 'reachable' : 'not reachable'}`);
            debugBox.log(`Status: ${response.status}`);
        } catch (error) {
            debugBox.log(`Error checking API endpoint: ${error.message}`);
        }
    },

    checkCORSIssues: async (url) => {
        try {
            const response = await fetch(url, { mode: 'cors' });
            debugBox.log(`CORS is ${response.ok ? 'enabled' : 'not enabled'} for ${url}`);
        } catch (error) {
            debugBox.log(`CORS issue detected with ${url}: ${error.message}`);
        }
    },

    checkLocalStorage: () => {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            debugBox.log('localStorage is working correctly');
        } catch (e) {
            debugBox.log(`localStorage error: ${e.message}`);
        }
    },

    checkInternetConnection: async () => {
        try {
            const online = navigator.onLine;
            debugBox.log(`Internet connection status: ${online ? 'Online' : 'Offline'}`);
            if (online) {
                const response = await fetch('https://www.google.com', { mode: 'no-cors' });
                debugBox.log(`Internet connectivity test: ${response.type === 'opaque' ? 'Successful' : 'Failed'}`);
            }
        } catch (error) {
            debugBox.log(`Internet connectivity test failed: ${error.message}`);
        }
    },

    logSystemInfo: () => {
        const ua = navigator.userAgent;
        const browserInfo = {
            'User Agent': ua,
            'Browser': ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [],
            'OS': ua.match(/Windows NT|Mac OS X|Linux/i) || 'Unknown OS'
        };
        debugBox.log('System Information:');
        for (const [key, value] of Object.entries(browserInfo)) {
            debugBox.log(`${key}: ${Array.isArray(value) ? value.join(' ') : value}`);
        }
    },

    runAllChecks: async (apiUrl) => {
        debugBox.log('Running all diagnostic checks...');
        debugUtils.checkBrowserCompatibility();
        await debugUtils.checkAPIEndpoint(apiUrl);
        await debugUtils.checkCORSIssues(apiUrl);
        debugUtils.checkLocalStorage();
        await debugUtils.checkInternetConnection();
        debugUtils.logSystemInfo();
        debugBox.log('All diagnostic checks completed.');
    }
};
