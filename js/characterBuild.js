import { debugBox } from './debug.js';
import { debugUtils } from './debugUtils.js';

const API_BASE_URL = 'https://api.wynncraft.com/v3';
let debounceTimer;
let debugDebounceTimer;
let itemDatabase = {};
let lastQuery = '';

const SLOT_TO_CATEGORY_MAP = {
    'weapon': ['bow', 'wand', 'dagger', 'spear', 'relik'],
    'helmet': ['helmet'],
    'chestplate': ['chestplate'],
    'leggings': ['leggings'],
    'boots': ['boots'],
    'ring': ['ring'],
    'bracelet': ['bracelet'],
    'necklace': ['necklace']
};

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

async function handleEquipmentInput(event) {
    const input = event.target;
    const query = input.value;
    const slot = input.dataset.slot;

    clearTimeout(debounceTimer);
    clearTimeout(debugDebounceTimer);

    debounceTimer = setTimeout(async () => {
        if (query !== lastQuery) {
            debugDebounceTimer = setTimeout(() => {
                debugBox.log(`Searching for: ${query} in slot: ${slot}`);
            }, 1000); // Delay debug output by 1 second

            try {
                const items = await searchItems(query, slot);
                updateInputStatus(input, items);
                displaySuggestions(items, input);
                saveCharacterBuild();
                lastQuery = query;

                clearTimeout(debugDebounceTimer);
                debugBox.log(`Search complete for "${query}" in slot "${slot}". Found ${items.length} items.`);
            } catch (error) {
                clearTimeout(debugDebounceTimer);
                debugBox.log(`Error searching for items: ${error.message}`);
                displayError(input, error.message);
            }
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
        input.style.color = 'black';
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

function displayError(input, errorMessage) {
    const suggestionsElement = document.getElementById(`${input.id}-suggestions`);
    suggestionsElement.innerHTML = `<li class="error">${errorMessage}</li>`;
    input.style.color = 'red';
}

async function searchItems(query, slot) {
    if (query.length < 2) return [];

    const categories = SLOT_TO_CATEGORY_MAP[slot];
    if (!categories) {
        throw new Error(`Invalid slot: ${slot}`);
    }

    const cachedItems = categories.flatMap(category => itemDatabase[category] || []);
    
    if (cachedItems.length === 0) {
        return [];
    }

    const exactMatches = cachedItems.filter(item => 
        item.name.toLowerCase() === query.toLowerCase()
    );

    if (exactMatches.length > 0) {
        return exactMatches;
    }

    const partialMatches = cachedItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
    );

    return partialMatches;
}

async function fetchItemDatabase(retryCount = 0) {
    try {
        debugBox.log(`Fetching item database... (Attempt ${retryCount + 1})`);
        const response = await debugUtils.logNetworkRequest(`${API_BASE_URL}/item/database`);
        const data = await response.json();
        itemDatabase = data.reduce((acc, item) => {
            const category = item.type.toLowerCase();
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});
        debugBox.log(`Item database fetched and cached. Categories: ${Object.keys(itemDatabase).join(', ')}`);
        debugBox.log(`Total items: ${Object.values(itemDatabase).flat().length}`);
    } catch (error) {
        console.error('Error fetching item database:', error);
        debugBox.log(`Error fetching item database: ${error.message}`);
        debugBox.log(`Error details: ${error.stack}`);
        
        if (retryCount < 3) {
            const retryDelay = Math.pow(2, retryCount) * 1000;
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