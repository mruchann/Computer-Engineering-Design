import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_ENDPOINTS } from '../constants/api';
import '../types/electron.d';  // Import the type definitions
import { fetchAndStoreCurrentUser, clearCurrentUser } from '../utils/userUtils';

// Safe way to check if we're in Electron
const isElectron = () => {
    try {
        return window && window.process && window.process.type === 'renderer';
    } catch {
        return false;
    }
};

interface AuthTokens {
    access: string;
    refresh: string;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    login: (tokens: AuthTokens) => void;
    logout: () => void;
    updateAccessToken: (token: string) => void;
    setInitialized: (initialized: boolean) => void;
}

// Function to check if token is expired
function isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isInitialized: false,
            login: (tokens: AuthTokens) => {
                // Send tokens to main process
                window.electron.ipcRenderer.send('auth:token-updated', tokens.access);
                window.electron.ipcRenderer.send('auth:refresh-token-updated', tokens.refresh);
                window.electron.ipcRenderer.send('shared-join');
                window.electron.ipcRenderer.send('connect-websocket');
                
                // Store tokens in state
                set({
                    accessToken: tokens.access,
                    refreshToken: tokens.refresh,
                    isAuthenticated: true,
                });
                
                // Fetch and store current user information
                fetchAndStoreCurrentUser().catch(error => {
                    console.error('Failed to fetch user details after login:', error);
                });
            },
            logout: () => {
                const accessToken = useAuthStore.getState().accessToken;
                if (accessToken && !isTokenExpired(accessToken)) {
                    api
                      .fetch(API_ENDPOINTS.SHARED_LEAVE)
                      .then(async (response) => {
                        const data = await response.json();
                        console.log(data);
                      })
                      .catch((error) => {
                        console.error('Couldn\'t leave.', error);
                      });
                }
                // Clear tokens in main process
                window.electron.ipcRenderer.send('auth:token-updated', null);
                window.electron.ipcRenderer.send('auth:refresh-token-updated', null);
                
                // Clear user data
                clearCurrentUser();
                
                set({
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },
            updateAccessToken: (token: string) => {
                // Send updated token to main process
                window.electron.ipcRenderer.send('auth:token-updated', token);
                set({ 
                    accessToken: token,
                    isAuthenticated: Boolean(token)  // Update authentication state
                });
            },
            setInitialized: (initialized: boolean) =>
                set({
                    isInitialized: initialized,
                }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setInitialized(true);
                    // Check if token is expired on rehydration
                    if (isTokenExpired(state.accessToken)) {
                        state.logout();
                        return;
                    }
                    state.isAuthenticated = Boolean(state.accessToken);
                    // Restore tokens in main process
                    if (state.isAuthenticated) {
                        window.electron.ipcRenderer.send('auth:token-updated', state.accessToken);
                        window.electron.ipcRenderer.send('auth:refresh-token-updated', state.refreshToken);
                        
                        // Refresh user data when tokens are rehydrated
                        fetchAndStoreCurrentUser().catch(error => {
                            console.error('Failed to refresh user details on rehydration:', error);
                        });
                    }
                }
            },
        }
    )
);

// Only add IPC listener if in Electron
if (isElectron()) {
    window.electron.ipcRenderer.on('sync-token', (_event: any, token: string) => {
        useAuthStore.setState({ accessToken: token });
    });
}

// Create an axios instance with interceptors
export const api = {
    async refreshAccessToken() {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
            useAuthStore.getState().logout();
        }

        try {
            const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!response.ok) {
                useAuthStore.getState().logout();
            }

            const data = await response.json();
            useAuthStore.getState().updateAccessToken(data.access);
            window.electron.ipcRenderer.send('auth:token-updated', data.access);
            return data.access;
        } catch (error) {
            useAuthStore.getState().logout();
        }
    },

    async fetch(url: string, options: RequestInit = {}) {
        const accessToken = useAuthStore.getState().accessToken;

        if (isTokenExpired(accessToken)) {
            useAuthStore.getState().logout();
        }

        if (!accessToken) {
            useAuthStore.getState().logout();
        }

        const headers = {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        };

        try {
            const response = await fetch(url, { ...options, headers });

            if (response.status === 401) {
                try {
                    const newAccessToken = await this.refreshAccessToken();
                    const newHeaders = {
                        ...options.headers,
                        Authorization: `Bearer ${newAccessToken}`,
                    };
                    return fetch(url, { ...options, headers: newHeaders });
                } catch (error) {
                    useAuthStore.getState().logout();
                }
            }

            return response;
        } catch (error) {
            if (error instanceof Error && error.message.includes('token')) {
                useAuthStore.getState().logout();
            }
            throw error;
        }
    },
};
