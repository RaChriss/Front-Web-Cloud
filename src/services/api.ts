const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    skipAuthRefresh?: boolean; // Pour éviter les boucles infinies
}

// Messages d'erreur personnalisés selon le code HTTP
const HTTP_ERROR_MESSAGES: Record<number, string> = {
    400: 'Données invalides',
    401: 'Session expirée. Veuillez vous reconnecter.',
    403: 'Accès refusé',
    404: 'Ressource non trouvée',
    409: 'Cette ressource existe déjà',
    429: 'Trop de tentatives, veuillez réessayer plus tard',
    500: 'Erreur serveur, veuillez réessayer',
    503: 'Service temporairement indisponible',
};

// Fonction pour rafraîchir le token
async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.token) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('auth_refresh_token', data.refresh_token);
                localStorage.setItem('auth_token_expiry', data.expires_at);
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const { method, body, headers = {}, skipAuthRefresh = false } = options;

    // Récupérer le token d'authentification
    // Le middleware backend accepte 3 formats:
    // 1. Firebase JWT (length > 100 && includes('.')) 
    // 2. Token local (startsWith('local_'))
    // 3. Firebase UID (sinon → findByFirebaseUid)
    // 
    // Notre backend génère des tokens de session qui ne correspondent à aucun format!
    // Solution: utiliser le firebase_uid de l'utilisateur stocké
    const authUser = localStorage.getItem('auth_user');
    let token: string | null = null;

    if (authUser) {
        try {
            const user = JSON.parse(authUser);
            // Utiliser firebase_uid car c'est ce que le middleware backend attend
            token = user.firebase_uid || null;
        } catch {
            token = null;
        }
    }

    // Debug: afficher le token utilisé
    console.log('[API Debug] Endpoint:', endpoint);
    console.log('[API Debug] Token (firebase_uid):', token ? `${token.substring(0, 20)}...` : 'AUCUN');

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Si erreur 401 et qu'on n'a pas encore essayé de rafraîchir
        if (response.status === 401 && !skipAuthRefresh) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                // Réessayer la requête avec le nouveau token
                const newToken = localStorage.getItem('auth_token');
                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${newToken}`,
                };
                response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Priorité: error > message > message HTTP par défaut
            const errorMessage =
                errorData.error ||
                errorData.message ||
                HTTP_ERROR_MESSAGES[response.status] ||
                `Erreur inattendue (${response.status})`;

            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion.');
        }
        throw error;
    }
}