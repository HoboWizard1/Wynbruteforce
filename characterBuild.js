import { debugBox } from './debug.js';

const API_BASE_URL = 'https://api.wynncraft.com/v3';
let debounceTimer;
let itemDatabase = {};

export function initCharacterBuild() {
    console.log('Initializing Character Build');
    const equipmentInputs = document.querySelectorAll('.equipment-input');
    equipmentInputs.forEach(input => {
        input.addEventListener('input', handleEquipmentInput);
        input.addEventListener('keydown', handleEnterKey);
    });

    // Create debug box
    createDebugBox();

    // Fetch and cache item database
    fetchItemDatabase();
}

function createDebugBox() {
    const debugBox = document.createElement('div');
    debugBox.id = 'debug-box';
    debugBox.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 200px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        overflow-y: scroll;
        display: none;
    `;
    document.body.appendChild(debugBox);

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Debug';
    toggleButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 1000;
    `;
    toggleButton.addEventListener('click', () => {
        debugBox.style.display = debugBox.style.display === 'none' ? 'block' : 'none';
    });
    document.body.appendChild(toggleButton);
}

function logDebug(message) {
    const debugBox = document.getElementById('debug-box');
    const logEntry = document.createElement('div');
    logEntry.textContent = `${new Date().toISOString()} - ${message}`;
    debugBox.appendChild(logEntry);
    debugBox.scrollTop = debugBox.scrollHeight;
}

async function handleEquipmentInput(event) {
    const input = event.target;
    const query = input.value;
    const slot = input.dataset.slot;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        debugBox.log(`Searching for: ${query} in slot: ${slot}`);
        const items = await searchItems(query, slot);
        updateInputStatus(input, items);
        saveCharacterBuild();
    }, 300);
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const suggestionsElement = document.getElementById(`${input.id}-suggestions`);
        const firstSuggestion = suggestionsElement.querySelector('li');
        if (firstSuggestion) {
            input.value = firstSuggestion.textContent;
            suggestionsElement.innerHTML = '';
            updateInputStatus(input, [{ name: firstSuggestion.textContent }]);
            saveCharacterBuild();
        }
    }
}

function updateInputStatus(input, items) {
    if (items.some(item => item.name.toLowerCase() === input.value.toLowerCase())) {
        input.style.color = 'green';
    } else {
        input.style.color = 'red';
    }
}

async function searchItems(query, slot) {
    if (query.length < 2) return [];

    const cachedItems = itemDatabase[slot] || [];
    const filteredItems = cachedItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
    );

    debugBox.log(`Found ${filteredItems.length} items matching "${query}" for slot "${slot}"`);
    return filteredItems;
}

async function fetchItemDatabase() {
    try {
        debugBox.log('Fetching item database...');
        const response = await fetch(`${API_BASE_URL}/item/database`);
        const data = await response.json();
        itemDatabase = data.reduce((acc, item) => {
            const slot = item.type.toLowerCase();
            if (!acc[slot]) acc[slot] = [];
            acc[slot].push(item);
            return acc;
        }, {});
        debugBox.log(`Item database fetched and cached. Total items: ${Object.values(itemDatabase).flat().length}`);
    } catch (error) {
        console.error('Error fetching item database:', error);
        debugBox.log(`Error fetching item database: ${error.message}`);
    }
}

function saveCharacterBuild() {
    const build = {};
    document.querySelectorAll('.equipment-input').forEach(input => {
        build[input.id] = input.value;
    });
    localStorage.setItem('characterBuild', JSON.stringify(build));
    debugBox.log('Character build saved to local storage');
}

function loadCharacterBuild() {
    const savedBuild = localStorage.getItem('characterBuild');
    if (savedBuild) {
        const build = JSON.parse(savedBuild);
        Object.entries(build).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input) {
                input.value = value;
                updateInputStatus(input, [{ name: value }]);
            }
        });
        debugBox.log('Character build loaded from local storage');
    }
}

// Call loadCharacterBuild after DOM content is loaded
document.addEventListener('DOMContentLoaded', loadCharacterBuild);