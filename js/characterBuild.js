import { debugBox } from './debug.js';
import { debugUtils } from './debugUtils.js';

const API_BASE_URL = 'https://api.wynncraft.com/v3';
const LEGACY_API_BASE_URL = 'https://api.wynncraft.com/public_api.php?action=itemDB&category=';
let debounceTimer;
let validItemCache = new Set(); // Cache for valid item names

const SLOT_TO_CATEGORY_MAP = {
    'weapon': ['spear', 'bow', 'wand', 'dagger', 'relik'],
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
    });

    const buildButton = document.getElementById('build-button');
    buildButton.addEventListener('click', buildCharacter);

    loadCharacterBuild();
    loadValidItemCache(); // Load the valid item cache
}

async function handleEquipmentInput(event) {
    const input = event.target;
    const query = input.value.trim();
    const slot = input.dataset.slot;

    console.log(`Handling input for slot: ${slot}, query: ${query}`);
    debugBox.log(`Handling input for slot: ${slot}, query: ${query}`);

    // Clear any existing timer
    clearTimeout(debounceTimer);

    // Don't search if the query is empty
    if (query === '') {
        updateInputStatus(input, false);
        return;
    }

    // Set a new timer
    debounceTimer = setTimeout(async () => {
        try {
            console.log(`Debounce timer fired for slot: ${slot}`);
            debugBox.log(`Debounce timer fired for slot: ${slot}`);
            const categories = SLOT_TO_CATEGORY_MAP[slot];
            let isValid = false;
            for (const category of categories) {
                console.log(`Checking validity for category: ${category}`);
                debugBox.log(`Checking validity for category: ${category}`);
                if (await checkItemValidityForCategory(query, category)) {
                    isValid = true;
                    break;
                }
            }
            console.log(`Updating input status: isValid = ${isValid}`);
            debugBox.log(`Updating input status: isValid = ${isValid}`);
            updateInputStatus(input, isValid);
        } catch (error) {
            console.error(`Error in handleEquipmentInput: ${error.message}`);
            console.error(`Error stack: ${error.stack}`);
            debugBox.log(`Error in handleEquipmentInput: ${error.message}`);
            debugBox.log(`Error stack: ${error.stack}`);
            updateInputStatus(input, false);
        }
    }, 500); // Increased debounce time to 500ms
}

async function checkItemValidity(query, slot) {
    const categories = SLOT_TO_CATEGORY_MAP[slot];
    for (const category of categories) {
        try {
            const isValid = await checkItemValidityForCategory(query, category);
            if (isValid) {
                debugBox.log(`Valid ${category} item found: "${query}"`);
                return true;
            }
        } catch (error) {
            debugBox.log(`Error checking ${category} items: ${error.message}`);
        }
    }
    debugBox.log(`No valid item found for "${query}" in slot ${slot}`);
    return false;
}

async function checkItemValidityForCategory(query, category) {
    const retries = 3;
    for (let i = 0; i < retries; i++) {
        try {
            // ... existing code ...

            // If search doesn't find a match, try the database endpoint
            const databaseUrl = `${API_BASE_URL}/item/database?fullResult`;
            const databaseResponse = await fetch(databaseUrl);
            if (databaseResponse.ok) {
                const databaseData = await databaseResponse.json();
                const matchingItem = Object.values(databaseData).find(item => 
                    item.internalName.toLowerCase() === query.toLowerCase() &&
                    ((category === 'weapon' && ['bow', 'relik', 'wand', 'dagger', 'spear'].includes(item.type)) ||
                    (category === 'helmet' && item.type === 'helmet') ||
                    (category === 'chestplate' && item.type === 'chestplate') ||
                    (category === 'leggings' && item.type === 'leggings') ||
                    (category === 'boots' && item.type === 'boots') ||
                    (['ring', 'bracelet', 'necklace'].includes(category) && item.type === category))
                );
                if (matchingItem) {
                    return true;
                }
            }
            // ... existing code ...
        } catch (error) {
            // ... existing code ...
        }
    }
    return false;
}
function updateInputStatus(input, isValid) {
    input.style.color = isValid ? 'green' : 'red';
}

async function buildCharacter() {
    const build = {};
    const statBreakdown = {};
    const itemList = [];

    for (const input of document.querySelectorAll('.equipment-input')) {
        const itemName = input.value.trim();
        const slot = input.dataset.slot;
        if (itemName && input.style.color === 'green') {
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

async function fetchItemDetails(itemName) {
    if (itemCache[itemName]) {
        return itemCache[itemName];
    }

    try {
        debugBox.log(`Fetching details for item: ${itemName}`);
        const encodedItemName = encodeURIComponent(itemName);
        const url = `${API_BASE_URL}/item/${encodedItemName}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        itemCache[itemName] = data;
        return data;
    } catch (error) {
        debugBox.log(`Error fetching details for item ${itemName}: ${error.message}`);
        throw error;
    }
}

function updateStatBreakdown(statBreakdown, item) {
    // Implement stat breakdown logic here
}

function displayStatBreakdown(statBreakdown) {
    // Implement stat breakdown display logic here
}

function displayItemList(itemList) {
    // Implement item list display logic here
}

function loadCharacterBuild() {
    // Implement character build loading logic here
}

function saveCharacterBuild() {
    // Implement character build saving logic here
}

// Add these functions to save and load the valid item cache
function saveValidItemCache() {
    localStorage.setItem('validItemCache', JSON.stringify(Array.from(validItemCache)));
}

function loadValidItemCache() {
    const cachedData = localStorage.getItem('validItemCache');
    if (cachedData) {
        validItemCache = new Set(JSON.parse(cachedData));
        debugBox.log('Valid item cache loaded from local storage');
    }
}