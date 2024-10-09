const API_BASE_URL = 'https://api.wynncraft.com/v3';

export function initCharacterBuild() {
    console.log('Initializing Character Build');
    const equipmentInputs = document.querySelectorAll('.equipment-input');
    equipmentInputs.forEach(input => {
        input.addEventListener('input', handleEquipmentInput);
    });
}

async function handleEquipmentInput(event) {
    const input = event.target;
    const query = input.value;
    const slot = input.dataset.slot;
    const suggestionsElement = document.getElementById(`${input.id}-suggestions`);

    if (query.length < 2) {
        suggestionsElement.innerHTML = '';
        return;
    }

    const items = await searchItems(query, slot);
    displaySuggestions(items, suggestionsElement, input);
}

function displaySuggestions(items, suggestionsElement, input) {
    suggestionsElement.innerHTML = '';
    items.slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.addEventListener('click', () => {
            input.value = item.name;
            suggestionsElement.innerHTML = '';
        });
        suggestionsElement.appendChild(li);
    });
}

async function searchItems(query, slot) {
    try {
        const response = await fetch(`${API_BASE_URL}/item/search/${query}`);
        const data = await response.json();
        return data.filter(item => item.type.toLowerCase() === slot.toLowerCase());
    } catch (error) {
        console.error('Error searching items:', error);
        return [];
    }
}

// Add more functions for character build functionality