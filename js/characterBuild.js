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

    const buildButton = document.getElementById('build-button');
    buildButton.addEventListener('click', buildCharacter);

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
        
        // Check API endpoint
        await debugUtils.checkAPIEndpoint(`${API_BASE_URL}/item/database`);
        
        // Check for CORS issues
        await debugUtils.checkCORSIssues(`${API_BASE_URL}/item/database`);
        
        const response = await debugUtils.logNetworkRequest(`${API_BASE_URL}/item/database?fullResult`);
        const data = await response.json();
        itemDatabase = Object.entries(data).reduce((acc, [itemName, item]) => {
            const category = item.type.toLowerCase();
            if (!acc[category]) acc[category] = [];
            acc[category].push({ ...item, name: itemName });
            return acc;
        }, {});
        debugBox.log(`Item database fetched and cached. Categories: ${Object.keys(itemDatabase).join(', ')}`);
        debugBox.log(`Total items: ${Object.values(itemDatabase).flat().length}`);
    } catch (error) {
        console.error('Error fetching item database:', error);
        debugBox.log(`Error fetching item database: ${error.message}`);
        debugBox.log(`Error details: ${error.stack}`);
        
        if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            debugBox.log('This appears to be a network error. Checking internet connection...');
            await debugUtils.checkInternetConnection();
            debugBox.log('Checking if the API endpoint is blocked...');
            await debugUtils.checkAPIEndpoint(`${API_BASE_URL}/item/database`);
        }
        
        if (retryCount < 3) {
            const retryDelay = Math.pow(2, retryCount) * 1000;
            debugBox.log(`Retrying in ${retryDelay / 1000} seconds...`);
            setTimeout(() => fetchItemDatabase(retryCount + 1), retryDelay);
        } else {
            debugBox.log('Max retry attempts reached. Please check your network connection and try again later.');
            debugBox.log('If the issue persists, please try the following:');
            debugBox.log('1. Check if the API endpoint is accessible in your browser');
            debugBox.log('2. Ensure there are no browser extensions blocking the request');
            debugBox.log('3. If running locally, try using a CORS proxy or disable CORS in your browser for testing');
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

function buildCharacter() {
    const build = {};
    const statBreakdown = {};
    const itemList = [];

    document.querySelectorAll('.equipment-input').forEach(input => {
        const itemName = input.value;
        const slot = input.dataset.slot;
        if (itemName) {
            const item = findItem(itemName, slot);
            if (item) {
                build[slot] = item;
                itemList.push(item);
                updateStatBreakdown(statBreakdown, item);
            }
        }
    });

    displayStatBreakdown(statBreakdown);
    displayItemList(itemList);
}

function findItem(itemName, slot) {
    const categories = SLOT_TO_CATEGORY_MAP[slot];
    for (const category of categories) {
        const items = itemDatabase[category] || [];
        const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (item) return item;
    }
    return null;
}

function updateStatBreakdown(statBreakdown, item) {
    Object.entries(item).forEach(([stat, value]) => {
        if (typeof value === 'number') {
            statBreakdown[stat] = (statBreakdown[stat] || 0) + value;
        }
    });
}

function displayStatBreakdown(statBreakdown) {
    const statBreakdownElement = document.getElementById('stat-breakdown');
    statBreakdownElement.innerHTML = '<h3>Stat Breakdown</h3>';
    Object.entries(statBreakdown).forEach(([stat, value]) => {
        const statElement = document.createElement('p');
        statElement.textContent = `${stat}: ${value}`;
        statBreakdownElement.appendChild(statElement);
    });
}

function displayItemList(itemList) {
    const itemListElement = document.getElementById('item-list');
    itemListElement.innerHTML = '<h3>Item List</h3>';
    itemList.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        
        const itemHeader = document.createElement('h4');
        itemHeader.innerHTML = `${item.name} <span class="toggle-details">▼</span>`;
        itemElement.appendChild(itemHeader);

        const itemDetails = document.createElement('div');
        itemDetails.className = 'item-details hidden';
        Object.entries(item).forEach(([stat, value]) => {
            if (stat !== 'name') {
                const statElement = document.createElement('p');
                statElement.textContent = `${stat}: ${value}`;
                itemDetails.appendChild(statElement);
            }
        });
        itemElement.appendChild(itemDetails);

        itemHeader.addEventListener('click', () => {
            itemDetails.classList.toggle('hidden');
            itemHeader.querySelector('.toggle-details').textContent = 
                itemDetails.classList.contains('hidden') ? '▼' : '▲';
        });

        itemListElement.appendChild(itemElement);
    });
}