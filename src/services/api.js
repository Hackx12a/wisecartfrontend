import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// MAXIMUM INCREASE - Aggressive retry configuration
const RATE_LIMIT_CONFIG = {
    maxRetries: 10,           // 10 retries maximum
    baseDelay: 500,           // 0.5 second base delay
    maxDelay: 10000,          // 10 seconds maximum delay
    burstDelay: 50,           // 50ms between burst requests
    enableQueue: false,       // DISABLE queue - let requests go through fast
    concurrentRequests: 50,   // 50 concurrent requests
};

// Store active retry toast ID
let activeRetryToastId = null;
let retryCount = 0;

// Request queue DISABLED for maximum throughput
class RequestQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.concurrentRequests = 0;
        this.maxConcurrent = RATE_LIMIT_CONFIG.concurrentRequests;
    }

    async add(requestFn) {
        // Skip queue if disabled
        if (!RATE_LIMIT_CONFIG.enableQueue) {
            return requestFn();
        }
        
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0 && this.concurrentRequests < this.maxConcurrent) {
            const { requestFn, resolve, reject } = this.queue.shift();
            this.concurrentRequests++;

            // Execute request immediately
            requestFn()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    this.concurrentRequests--;
                    this.processQueue();
                });
        }

        this.processing = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize request queue
const requestQueue = new RequestQueue();

const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
};

const isTokenExpired = (token) => {
    if (!token) return true;

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
};

const getToken = () => {
    const token = localStorage.getItem('authToken');

    if (!token || isTokenExpired(token)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        return null;
    }

    return token;
};

// Rate limit handling with MINIMAL delay
const handleRateLimit = async (response, url, options, currentRetryCount = 0) => {
    if (response.status !== 429) {
        return response;
    }

    retryCount = currentRetryCount;
    
    if (retryCount >= RATE_LIMIT_CONFIG.maxRetries) {
        if (activeRetryToastId) {
            toast.dismiss(activeRetryToastId);
            activeRetryToastId = null;
        }
        toast.error(`Rate limit exceeded. Maximum retries reached.`);
        return response;
    }

    // Get retry-after header or use MINIMAL backoff
    const retryAfter = response.headers.get('Retry-After') ||
        response.data?.retryAfter ||
        Math.min(
            RATE_LIMIT_CONFIG.baseDelay * Math.pow(1.5, retryCount), // Slower exponential
            RATE_LIMIT_CONFIG.maxDelay
        ) / 1000;

    // Show only one toast
    if (!activeRetryToastId) {
        activeRetryToastId = toast.loading(
            `Rate limited. Retrying in ${retryAfter} seconds...`,
            {
                duration: retryAfter * 1000 + 500,
                id: 'rate-limit-retry'
            }
        );
    } else {
        toast.loading(
            `Rate limited. Retrying in ${retryAfter} seconds...`,
            {
                duration: retryAfter * 1000 + 500,
                id: activeRetryToastId
            }
        );
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

    // Dismiss toast
    if (activeRetryToastId) {
        toast.dismiss(activeRetryToastId);
        activeRetryToastId = null;
    }

    // Retry the request
    return await fetchWithAuthRetry(url, options, retryCount + 1);
};

// Enhanced fetch function
const fetchWithAuthRetry = async (url, options = {}, retryCount = 0) => {
    const token = getToken();
    if (!token && !url.includes('/auth/')) {
        toast.error('Session expired. Please login again.');
        return {
            success: false,
            error: 'No valid token found',
            status: 401
        };
    }

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: defaultHeaders,
        });

        if (response.status === 429) {
            return handleRateLimit(response, url, options, retryCount);
        }

        if (activeRetryToastId && response.ok) {
            toast.dismiss(activeRetryToastId);
            activeRetryToastId = null;
        }

        return await handleResponse(response);
    } catch (error) {
        if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
            const delay = RATE_LIMIT_CONFIG.baseDelay * Math.pow(1.5, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithAuthRetry(url, options, retryCount + 1);
        }

        if (activeRetryToastId) {
            toast.dismiss(activeRetryToastId);
            activeRetryToastId = null;
        }

        toast.error('Network error. Please check your connection.');
        return {
            success: false,
            error: 'Network error',
            status: 0
        };
    }
};

// Main fetch function
const fetchWithAuth = async (url, options = {}) => {
    return requestQueue.add(() => fetchWithAuthRetry(url, options));
};

// Batch requests with minimal delay
const batchRequests = async (requests, delayBetween = 10) => { // 10ms delay
    const results = [];

    for (let i = 0; i < requests.length; i++) {
        const { endpoint, method = 'GET', data } = requests[i];
        
        try {
            const result = await fetchWithAuth(endpoint, {
                method,
                body: data ? JSON.stringify(data) : undefined,
            });
            
            results.push(result);
            
            if (i < requests.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayBetween));
            }
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }
    
    return results;
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        toast.error('Session expired. Please login again.');

        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }

        return {
            success: false,
            error: 'Session expired. Please login again.',
            status: 401
        };
    }

    if (!response.ok) {
        let errorMessage = 'Request failed';

        try {
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || 'Request failed';
            } else {
                const text = await response.text();
                if (text && text.trim()) {
                    errorMessage = text.replace(/^Error:\s*/i, '').trim();
                }
            }
        } catch (parseError) {
            errorMessage = response.statusText || 'Request failed';
        }

        toast.error(errorMessage);

        return {
            success: false,
            error: errorMessage,
            status: response.status
        };
    }

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return {
            success: true,
            data: data,
            status: response.status
        };
    }

    if (response.status === 204) {
        return {
            success: true,
            data: null,
            status: 204
        };
    }

    if (response.status === 201) {
        try {
            const data = await response.json();
            return {
                success: true,
                data: data,
                status: 201
            };
        } catch (e) {
            return {
                success: true,
                data: null,
                status: 201
            };
        }
    }

    const textData = await response.text();
    return {
        success: true,
        data: textData,
        status: response.status
    };
};

export const api = {
    // GET request
    get: (endpoint) => 
        fetchWithAuth(endpoint, { method: 'GET' }),

    // POST request
    post: (endpoint, data) =>
        fetchWithAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // PATCH request
    patch: (endpoint, data = null, config = {}) => {
        const queryParams = config.params 
            ? '?' + new URLSearchParams(config.params).toString() 
            : '';
        
        return fetchWithAuth(`${endpoint}${queryParams}`, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    // PUT request
    put: (endpoint, data) => {
        const options = {
            method: 'PUT',
            headers: {},
        };
        
        if (data !== null && data !== undefined) {
            options.body = JSON.stringify(data);
        }
        
        return fetchWithAuth(endpoint, options);
    },

    // DELETE request
    delete: (endpoint) =>
        fetchWithAuth(endpoint, { method: 'DELETE' }),

    // Batch multiple requests (FAST)
    batch: (requests, delayBetween = 10) =>
        batchRequests(requests, delayBetween),

    // Upload file
    upload: async (endpoint, formData) => {
        const token = getToken();
        if (!token) {
            toast.error('Session expired. Please login again.');
            return {
                success: false,
                error: 'No valid token found',
                status: 401
            };
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
                return {
                    success: false,
                    error: 'Session expired',
                    status: 401
                };
            }
            
            if (!response.ok) {
                let errorMessage = 'Upload failed';
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.message || 'Upload failed';
                    } else {
                        const text = await response.text();
                        if (text && text.trim()) {
                            errorMessage = text.replace(/^Error:\s*/i, '').trim();
                        }
                    }
                } catch (e) {
                    errorMessage = response.statusText || 'Upload failed';
                }
                
                toast.error(errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                    status: response.status
                };
            }
            
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            return {
                success: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            toast.error('Network error. Please check your connection.');
            return {
                success: false,
                error: 'Network error',
                status: 0
            };
        }
    },

    // Download file
    download: async (endpoint) => {
        const token = getToken();
        if (!token) {
            toast.error('Session expired. Please login again.');
            return {
                success: false,
                error: 'No valid token found',
                status: 401
            };
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
                return {
                    success: false,
                    error: 'Session expired',
                    status: 401
                };
            }
            
            if (!response.ok) {
                let errorMessage = 'Download failed';
                try {
                    const text = await response.text();
                    if (text && text.trim()) {
                        errorMessage = text.replace(/^Error:\s*/i, '').trim();
                    }
                } catch (e) {
                    errorMessage = response.statusText || 'Download failed';
                }
                
                toast.error(errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                    status: response.status
                };
            }
            
            const blob = await response.blob();
            return {
                success: true,
                data: blob,
                status: response.status
            };
        } catch (error) {
            toast.error('Network error. Please check your connection.');
            return {
                success: false,
                error: 'Network error',
                status: 0
            };
        }
    },

    // Check token validity
    checkTokenValidity: () => {
        const token = localStorage.getItem('authToken');
        return token && !isTokenExpired(token);
    },

    // Get token expiration time
    getTokenExpiration: () => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        
        const decoded = decodeJWT(token);
        return decoded ? decoded.exp : null;
    },

    // Configure rate limit settings
    configureRateLimit: (config) => {
        Object.assign(RATE_LIMIT_CONFIG, config);
    },

    // Get current rate limit config
    getRateLimitConfig: () => ({ ...RATE_LIMIT_CONFIG }),

    // Clear retry toast
    clearRetryToast: () => {
        if (activeRetryToastId) {
            toast.dismiss(activeRetryToastId);
            activeRetryToastId = null;
        }
    },

    // Get current retry count
    getRetryCount: () => retryCount,
};