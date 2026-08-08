const API_BASE_URL = 'http://localhost:8000/api/v1';

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

export const lifestyleService = {
    async getHistory() {
        const response = await fetch(`${API_BASE_URL}/lifestyle/history`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch lifestyle history');
        return response.json();
    },

    async getLatest() {
        const response = await fetch(`${API_BASE_URL}/lifestyle/latest`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to fetch latest lifestyle log');
        }
        return response.json();
    },

    async createLog(data: any) {
        const response = await fetch(`${API_BASE_URL}/lifestyle/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to create lifestyle log';
            try {
                const errData = await response.json();
                if (errData.detail) {
                    if (Array.isArray(errData.detail)) {
                        errorMessage = errData.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join(', ');
                    } else {
                        errorMessage = errData.detail;
                    }
                }
            } catch (e) {}
            throw new Error(errorMessage);
        }
        
        return response.json();
    }
};
