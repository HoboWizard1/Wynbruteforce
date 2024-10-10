const API_BASE_URL = 'https://api.wynncraft.com/v3';

export function initAbilityTree() {
    console.log('Initializing Ability Tree');
    // TODO: Implement ability tree interface
}

async function fetchAbilityTree() {
    try {
        const response = await fetch(`${API_BASE_URL}/ability/tree`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ability tree:', error);
    }
}

async function fetchAbilityMap() {
    try {
        const response = await fetch(`${API_BASE_URL}/ability/map`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ability map:', error);
    }
}

async function fetchAspects() {
    try {
        const response = await fetch(`${API_BASE_URL}/ability/aspects`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching aspects:', error);
    }
}

// Add more functions for ability tree functionality