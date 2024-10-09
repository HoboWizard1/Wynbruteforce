import { initCharacterBuild } from './characterBuild.js';
import { debugBox } from './debug.js';

document.addEventListener('DOMContentLoaded', () => {
    debugBox.log('Initializing application');
    initCharacterBuild();
});

// Your application code here
// You can use debugBox.log() to log messages to the debug box
// All console.log, console.error, and console.warn will also be logged automatically