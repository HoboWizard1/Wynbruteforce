import { initCharacterBuild } from './characterBuild.js';
import { initAbilityTree } from './abilityTree.js';
import { initBruteForceOptimizer } from './bruteForceOptimizer.js';

document.addEventListener('DOMContentLoaded', () => {
    initCharacterBuild();
    initAbilityTree();
    initBruteForceOptimizer();
});