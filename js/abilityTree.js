const API_BASE_URL = 'https://api.wynncraft.com/v3';

export function initAbilityTree() {
    console.log('Initializing Ability Tree');
    // TODO: Implement ability tree interface
}

async function fetchAbilityTree(tree) {
    try {
        const response = await fetch(`${API_BASE_URL}/ability/tree/${tree}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ability tree:', error);
    }
}

async function fetchAspects(tree) {
    try {
        const response = await fetch(`${API_BASE_URL}/aspects/${tree}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching aspects:', error);
    }
}

// Add more functions for ability tree functionality