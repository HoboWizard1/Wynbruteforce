import { debugBox } from './debug.js';
import { debugUtils } from './debugUtils.js';

const API_BASE_URL = 'https://api.wynncraft.com/v3';
let debounceTimer;
let itemDatabase = {};

export function initCharacterBuild() {
    debugBox.log('Initializing Character Build');
    const equipmentInputs = document.querySelectorAll('.equipment-input');
    equipmentInputs.forEach(input => {
        input.addEventListener('input', handleEquipmentInput);
        input.addEventListener('keydown', handleEnterKey);
    });

    // Fetch and cache item database
    fetchItemDatabase();
    loadCharacterBuild();
}

export function runDebugChecks() {
    debugUtils.runAllChecks(`${API_BASE_URL}/item/database`);
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
        displaySuggestions(items, input);
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

function displaySuggestions(items, input) {
    const suggestionsElement = document.getElementById(`${input.id}-suggestions`);
    suggestionsElement.innerHTML = '';
    items.slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.addEventListener('click', () => {
            input.value = item.name;
            suggestionsElement.innerHTML = '';
            updateInputStatus(input, [item]);
            saveCharacterBuild();
        });
        suggestionsElement.appendChild(li);
    });
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
        const response = await debugUtils.logNetworkRequest(`${API_BASE_URL}/item/database`);
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
        debugBox.log(`Error details: ${error.stack}`);
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

export function loadCharacterBuild() {
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

// Remove this event listener
// document.addEventListener('DOMContentLoaded', loadCharacterBuild);