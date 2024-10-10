import { debugBox } from './debug.js';
import { debugUtils } from './debugUtils.js';

const API_BASE_URL = 'https://api.wynncraft.com/v3';
let debounceTimer;
let itemCache = {};
let lastSearchQuery = '';
let lastSearchResults = [];

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

    loadCharacterBuild();
    loadItemCacheFromLocalStorage();
}

async function handleEquipmentInput(event) {
    const input = event.target;
    const query = input.value.trim().toLowerCase();
    const slot = input.dataset.slot;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        if (query.length < 2) {
            displaySuggestions([], input);
            return;
        }

        try {
            const items = await searchItems(query, slot);
            updateInputStatus(input, items);
            displaySuggestions(items, input);
            saveCharacterBuild();
        } catch (error) {
            debugBox.log(`Error searching for items: ${error.message}`);
            displayError(input, error.message);
        }
    }, 300);
}

async function searchItems(query, slot) {
    if (query === lastSearchQuery) {
        return lastSearchResults;
    }

    const categories = SLOT_TO_CATEGORY_MAP[slot];
    const searchResults = [];

    for (const category of categories) {
        try {
            const response = await fetch(`${API_BASE_URL}/item/search/${category}/${query}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            searchResults.push(...data);
        } catch (error) {
            debugBox.log(`Error searching for ${category} items: ${error.message}`);
        }
    }

    lastSearchQuery = query;
    lastSearchResults = searchResults;
    return searchResults;
}

async function fetchItemDetails(itemName) {
    if (itemCache[itemName]) {
        return itemCache[itemName];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/item/${itemName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        itemCache[itemName] = data;
        saveItemCacheToLocalStorage();
        return data;
    } catch (error) {
        debugBox.log(`Error fetching details for item ${itemName}: ${error.message}`);
        throw error;
    }
}

async function buildCharacter() {
    const build = {};
    const statBreakdown = {};
    const itemList = [];

    for (const input of document.querySelectorAll('.equipment-input')) {
        const itemName = input.value.trim();
        const slot = input.dataset.slot;
        if (itemName) {
            try {
                const item = await fetchItemDetails(itemName);
                build[slot] = item;
                itemList.push(item);
                updateStatBreakdown(statBreakdown, item);
            } catch (error) {
                debugBox.log(`Error fetching details for ${itemName}: ${error.message}`);
            }
        }
    }

    displayStatBreakdown(statBreakdown);
    displayItemList(itemList);
}

function loadItemCacheFromLocalStorage() {
    const cachedData = localStorage.getItem('itemCache');
    if (cachedData) {
        itemCache = JSON.parse(cachedData);
        debugBox.log('Item cache loaded from local storage');
    }
}

function saveItemCacheToLocalStorage() {
    localStorage.setItem('itemCache', JSON.stringify(itemCache));
    debugBox.log('Item cache saved to local storage');
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