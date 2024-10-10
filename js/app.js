import { initCharacterBuild } from './characterBuild.js';
import { debugBox } from './debug.js';

console.log('app.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    debugBox.log('Initializing application');
    initCharacterBuild();
});

