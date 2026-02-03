import type { LoginCredentials, RegisterCredentials, AuthResponse, User, UpdateProfileData } from '../types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

// Import de apiRequest pour les autres requêtes authentifiées
import { apiRequest } from './api';

export const authService = {
    /**
     * Connexion d'un utilisateur
     * POST /api/auth/login
     * 
     * Gère les cas suivants:
     * - 200: Succès - Token + infos utilisateur
     * - 401: Mauvais identifiants
     * - 403: Compte bloqué (permanent)
     * - 429: Trop de tentatives (blocage temporaire ou automatique)
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            // Succès - stocker les tokens et l'utilisateur
            if (response.ok && data.success) {
                // Nettoyer les anciens tokens obsolètes
                localStorage.removeItem('sessionId');

                // Stocker le token de session
                const sessionToken = data.token;
                if (sessionToken) {
                    localStorage.setItem(TOKEN_KEY, sessionToken);
                }
                if (data.refresh_token) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
                }
                if (data.expires_at) {
                    localStorage.setItem(TOKEN_EXPIRY_KEY, data.expires_at);
                }
                if (data.user) {
                    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                }
                return data;
            }

            // Erreurs avec informations de blocage (403, 429)
            // On retourne les données pour permettre au composant de gérer l'affichage
            return {
                success: false,
                error: data.error || 'Erreur de connexion',
                blocked: data.blocked,
                reason: data.reason,
                details: data.details,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur réseau',
            };
        }
    },

    /**
     * Inscription d'un nouvel utilisateur
     * POST /api/auth/register
     * 
     * Erreurs possibles:
     * - 400: Données invalides
     * - 409: Email déjà utilisé
     * - 503: Mode hors ligne
     */
    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        const { confirmPassword, ...registerData } = credentials;
        const response = await apiRequest<AuthResponse>('/auth/register', {
            method: 'POST',
            body: registerData,
        });

        return response;
    },

    /**
     * Déconnexion de l'utilisateur
     * POST /api/auth/logout
     */
    async logout(): Promise<void> {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            this.clearAuthData();
        }
    },

    clearAuthData(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
    },

    /**
     * Obtenir les informations de l'utilisateur connecté
     * GET /api/auth/me
     */
    async getProfile(): Promise<User> {
        const response = await apiRequest<{ success: boolean; user: User; mode?: string }>('/auth/me', {
            method: 'GET',
        });
        // Mettre à jour le localStorage avec les données fraîches
        if (response.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
        return response.user;
    },

    async verifySession(): Promise<User | null> {
        try {
            // Vérifier si le token est expiré
            const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
            if (expiryStr) {
                const expiry = new Date(expiryStr);
                if (expiry < new Date()) {
                    // Token expiré, essayer de le rafraîchir
                    const refreshed = await this.refreshToken();
                    if (!refreshed) {
                        this.clearAuthData();
                        return null;
                    }
                }
            }

            // Utiliser getProfile pour vérifier la session et récupérer l'utilisateur
            const user = await this.getProfile();
            return user;
        } catch {
            // Session invalide, nettoyer le localStorage
            this.clearAuthData();
            return null;
        }
    },

    async refreshToken(): Promise<boolean> {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            return false;
        }

        try {
            const response = await apiRequest<{
                success: boolean;
                token: string;
                refresh_token: string;
                expires_at: string;
            }>('/auth/refresh-token', {
                method: 'POST',
                body: { refresh_token: refreshToken },
            });

            if (response.success && response.token) {
                localStorage.setItem(TOKEN_KEY, response.token);
                localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
                localStorage.setItem(TOKEN_EXPIRY_KEY, response.expires_at);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    async updateProfile(data: UpdateProfileData): Promise<User> {
        const response = await apiRequest<{ success: boolean; user: User }>('/auth/update-profile', {
            method: 'PUT',
            body: data,
        });
        if (response.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
        return response.user;
    },

    getToken(): string | null {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            return token;
        }
        // Fallback: utiliser firebase_uid de l'utilisateur stocké
        const user = this.getUser();
        if (user?.firebase_uid) {
            // Stocker le firebase_uid comme token pour les prochaines requêtes
            localStorage.setItem(TOKEN_KEY, user.firebase_uid);
            return user.firebase_uid;
        }
        return null;
    },

    getUser(): User | null {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    /**
     * Vérifier si l'utilisateur actuel est un manager
     */
    isManager(): boolean {
        const user = this.getUser();
        return user?.type_user === 3;
    },

    /**
     * Obtenir les headers d'authentification pour les requêtes
     */
    getAuthHeaders(): HeadersInit {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    },
};
