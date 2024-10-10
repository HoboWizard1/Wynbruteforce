import { debugBox } from './debug.js';
import { debugUtils } from './debugUtils.js';

const API_BASE_URL = 'https://api.wynncraft.com/v3';
let debounceTimer;
let itemDatabase = {};
let lastQuery = '';

export function initCharacterBuild() {
    debugBox.log('Initializing Character Build');
    const equipmentInputs = document.querySelectorAll('.equipment-input');
    equipmentInputs.forEach(input => {
        input.addEventListener('input', handleEquipmentInput);
        input.addEventListener('keydown', handleEnterKey);
    });

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
        if (query !== lastQuery) {
            debugBox.log(`Searching for: ${query} in slot: ${slot}`);
            const items = await searchItems(query, slot);
            updateInputStatus(input, items);
            displaySuggestions(items, input);
            saveCharacterBuild();
            lastQuery = query;
        }
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

    if (filteredItems.length > 0) {
        debugBox.log(`Found ${filteredItems.length} items matching "${query}" for slot "${slot}"`);
    }
    return filteredItems;
}

async function fetchItemDatabase(retryCount = 0) {
    try {
        debugBox.log(`Fetching item database... (Attempt ${retryCount + 1})`);
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
        
        // Provide more context about the error
        if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            debugBox.log('This appears to be a network error. Checking internet connection...');
            await debugUtils.checkInternetConnection();
        }
        
        // Retry logic
        if (retryCount < 3) {
            const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            debugBox.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => fetchItemDatabase(retryCount + 1), retryDelay);
        } else {
            debugBox.log('Max retry attempts reached. Please check your network connection and try again later.');
        }
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