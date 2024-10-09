import { initCharacterBuild } from './characterBuild.js';
import { debugBox } from './debug.js';

console.log('app.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    debugBox.log('Initializing application');
    initCharacterBuild();
});

// Your application code here
// You can use debugBox.log() to log messages to the debug box
// All console.log, console.error, and console.warn will also be logged automatically