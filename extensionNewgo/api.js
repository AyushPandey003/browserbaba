// API service for Memory Capture Extension

const API_BASE_URL = 'https://browserbaba.vercel.app/api';

const api = {
  // Get all memories
  async getMemories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/memories${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch memories');
    }

    return response.json();
  },

  // Get single memory
  async getMemory(id) {
    const response = await fetch(`${API_BASE_URL}/memories?id=${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch memory');
    }

    return response.json();
  },

  // Create new memory
  async createMemory(data) {
    const response = await fetch(`${API_BASE_URL}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create memory: ${errorText}`);
    }

    return response.json();
  },

  // Update memory
  async updateMemory(id, data) {
    const response = await fetch(`${API_BASE_URL}/memories?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update memory');
    }

    return response.json();
  },

  // Delete memory
  async deleteMemory(id) {
    const response = await fetch(`${API_BASE_URL}/memories?id=${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete memory');
    }

    return response.json();
  },

  // Get statistics
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/memories/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    return response.json();
  },

  // Search memories
  async searchMemories(query) {
    const response = await fetch(`${API_BASE_URL}/memories/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error('Failed to search memories');
    }

    return response.json();
  }
};
