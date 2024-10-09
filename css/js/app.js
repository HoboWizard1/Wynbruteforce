import { initCharacterBuild } from './characterBuild.js';
import { initAbilityTree } from './abilityTree.js';
import { initBruteForceOptimizer } from './bruteForceOptimizer.js';
import { debugBox } from './debug.js';

document.addEventListener('DOMContentLoaded', () => {
    initCharacterBuild();
    initAbilityTree();
    initBruteForceOptimizer();
});

// Your application code here
// You can use debugBox.log() to log messages to the debug box
// All console.log, console.error, and console.warn will also be logged automatically