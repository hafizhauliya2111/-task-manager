const API_BASE_URL = "http://localhost/task-manager/backend/api";


async function apiRequest(endpoint, options = {}) {

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const data = await response.json();

    return {
        status: response.status,
        data: data
    };
}