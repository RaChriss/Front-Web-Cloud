import { apiRequest } from './api';
import type { AdminUser } from '../types/auth.types';
import type {
    SyncStatus,
    SyncConflict,
    HealthStatus,
    SyncStatistics,
    SyncExecuteResult,
    AutoSyncConfig,
} from '../types/report.types';

// Réponse de la liste des utilisateurs avec pagination
export interface UsersListResponse {
    success: boolean;
    data: AdminUser[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// Réponse de recherche rapide
export interface UsersSearchResponse {
    success: boolean;
    results: AdminUser[];
}

// Réponse pour un utilisateur unique
export interface UserResponse {
    success: boolean;
    data: AdminUser;
    message?: string;
}

// Paramètres de création/modification d'utilisateur
export interface CreateUserDTO {
    email: string;
    password: string;
    display_name: string;
    type_user: 1 | 2 | 3;
}

export interface UpdateUserDTO {
    email?: string;
    password?: string;
    display_name?: string;
    type_user?: 1 | 2 | 3;
}

// Réponse pour le blocage/déblocage
export interface BlockResponse {
    success: boolean;
    message?: string;
    error?: string;
}

// Statistiques des utilisateurs
export interface UserStatsResponse {
    success: boolean;
    data: {
        total_users: number;
        blocked_users: number;
        visitors: number;
        regular_users: number;
        managers: number;
    };
}

export interface AdminParameters {
    id: string;
    type: string;
    value: unknown;
}

export const adminService = {
    // ============================================
    // GESTION DES UTILISATEURS - ENDPOINTS /api/users
    // ============================================

    /**
     * Lister tous les utilisateurs avec pagination, filtre et recherche
     * GET /api/users
     */
    async getUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        type_user?: number;
        est_bloque?: boolean;
        sort_by?: 'date_creation' | 'email' | 'display_name';
        order?: 'ASC' | 'DESC';
    }): Promise<UsersListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.type_user !== undefined) queryParams.append('type_user', params.type_user.toString());
        if (params?.est_bloque !== undefined) queryParams.append('est_bloque', params.est_bloque.toString());
        if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params?.order) queryParams.append('order', params.order);

        const queryString = queryParams.toString();
        const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

        return apiRequest<UsersListResponse>(endpoint, {
            method: 'GET',
        });
    },

    /**
     * Recherche rapide d'utilisateurs
     * GET /api/users/search
     */
    async searchUsers(query: string, limit: number = 5): Promise<UsersSearchResponse> {
        return apiRequest<UsersSearchResponse>(
            `/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,
            {
                method: 'GET',
            },
        );
    },

    /**
     * Récupérer un utilisateur par ID
     * GET /api/users/:id
     */
    async getUserById(userId: number): Promise<UserResponse> {
        return apiRequest<UserResponse>(`/users/${userId}`, {
            method: 'GET',
        });
    },

    /**
     * Créer un nouvel utilisateur
     * POST /api/users
     */
    async createUser(userData: CreateUserDTO): Promise<UserResponse> {
        return apiRequest<UserResponse>('/users', {
            method: 'POST',
            body: userData,
        });
    },

    /**
     * Modifier un utilisateur
     * PUT /api/users/:id
     */
    async updateUser(userId: number, userData: UpdateUserDTO): Promise<UserResponse> {
        return apiRequest<UserResponse>(`/users/${userId}`, {
            method: 'PUT',
            body: userData,
        });
    },

    /**
     * Supprimer un utilisateur
     * DELETE /api/users/:id
     */
    async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
        return apiRequest<{ success: boolean; message: string }>(`/users/${userId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Bloquer un utilisateur
     * POST /api/users/:id/block
     */
    async blockUser(userId: number): Promise<BlockResponse> {
        return apiRequest<BlockResponse>(`/users/${userId}/block`, {
            method: 'POST',
        });
    },

    /**
     * Débloquer un utilisateur
     * POST /api/users/:id/unblock
     */
    async unblockUser(userId: number): Promise<BlockResponse> {
        return apiRequest<BlockResponse>(`/users/${userId}/unblock`, {
            method: 'POST',
        });
    },

    /**
     * Envoyer les identifiants de connexion par email
     * POST /api/users/:id/send-credentials
     */
    async sendUserCredentials(userId: number): Promise<{ success: boolean; message: string }> {
        return apiRequest<{ success: boolean; message: string }>(`/users/${userId}/send-credentials`, {
            method: 'POST',
        });
    },

    /**
     * Obtenir les statistiques des utilisateurs
     * GET /api/users/stats/summary
     */
    async getUserStats(): Promise<UserStatsResponse> {
        return apiRequest<UserStatsResponse>('/users/stats/summary', {
            method: 'GET',
        });
    },

    /**
     * Liste les utilisateurs bloqués (pour compatibilité)
     */
    async getBlockedUsers(params?: { page?: number; limit?: number }): Promise<UsersListResponse> {
        return this.getUsers({
            ...params,
            est_bloque: true,
        });
    },

    // ============================================
    // PARAMÈTRES DE CONFIGURATION
    // ============================================

    // Paramètres de configuration
    async getParameters(): Promise<AdminParameters[]> {
        const response = await apiRequest<{ parameters: AdminParameters[] }>('/admin/parameters', {
            method: 'GET',
        });
        return response.parameters;
    },

    // Modifier un paramètre
    async updateParameter(typeUserId: string, value: unknown): Promise<AdminParameters> {
        const response = await apiRequest<{ parameter: AdminParameters }>(`/admin/parameters/${typeUserId}`, {
            method: 'PUT',
            body: { value },
        });
        return response.parameter;
    },

    // ============================================
    // GESTION DE LA SYNCHRONISATION
    // ============================================

    /**
     * Obtenir le statut de synchronisation
     * GET /api/admin/sync/status
     */
    async getSyncStatus(): Promise<SyncStatus> {
        const response = await apiRequest<{ success: boolean; data: SyncStatus }>('/admin/sync/status', {
            method: 'GET',
        });
        return response.data;
    },

    /**
     * Déclencher une synchronisation manuelle complète
     * POST /api/admin/sync/execute
     */
    async executeSyncManual(): Promise<SyncExecuteResult> {
        const response = await apiRequest<SyncExecuteResult>('/admin/sync/execute', {
            method: 'POST',
        });
        return response;
    },

    /**
     * Obtenir la liste des conflits de synchronisation
     * GET /api/admin/sync/conflicts
     */
    async getSyncConflicts(): Promise<SyncConflict[]> {
        const response = await apiRequest<{ success: boolean; conflicts: SyncConflict[] }>('/admin/sync/conflicts', {
            method: 'GET',
        });
        return response.conflicts || [];
    },

    /**
     * Résoudre un conflit de synchronisation
     * POST /api/admin/sync/conflicts/:id/resolve
     */
    async resolveSyncConflict(
        conflictId: number,
        resolution: 'firebase' | 'postgres' | 'custom',
        customData?: Record<string, unknown>,
    ): Promise<SyncConflict> {
        const response = await apiRequest<{ success: boolean; data: SyncConflict }>(
            `/admin/sync/conflicts/${conflictId}/resolve`,
            {
                method: 'POST',
                body: { resolution, custom_data: customData },
            },
        );
        return response.data;
    },

    /**
     * Activer ou désactiver la synchronisation automatique
     * POST /api/admin/sync/auto
     */
    async setAutoSyncEnabled(enabled: boolean): Promise<AutoSyncConfig> {
        const response = await apiRequest<{ success: boolean; data: AutoSyncConfig }>('/admin/sync/auto', {
            method: 'POST',
            body: { enabled },
        });
        return response.data;
    },

    /**
     * Configurer les paramètres de synchronisation automatique
     * POST /api/admin/sync/auto-config
     */
    async setAutoSyncConfig(config: Partial<AutoSyncConfig>): Promise<AutoSyncConfig> {
        const response = await apiRequest<{ success: boolean; data: AutoSyncConfig }>('/admin/sync/auto-config', {
            method: 'POST',
            body: config,
        });
        return response.data;
    },

    /**
     * Obtenir les statistiques de synchronisation
     * GET /api/admin/sync/statistics
     */
    async getSyncStatistics(days?: number): Promise<SyncStatistics> {
        const params = new URLSearchParams();
        if (days) params.append('days', days.toString());

        const queryString = params.toString();
        const endpoint = `/admin/sync/statistics${queryString ? `?${queryString}` : ''}`;

        const response = await apiRequest<{ success: boolean; data: SyncStatistics }>(endpoint, {
            method: 'GET',
        });
        return response.data;
    },

    /**
     * Vérifier le statut Firebase
     * GET /api/health/firebase
     */
    async getFirebaseHealth(): Promise<HealthStatus> {
        const response = await apiRequest<HealthStatus>('/health/firebase', {
            method: 'GET',
        });
        return response;
    },

    /**
     * Vérifier la santé générale du système
     * GET /api/health
     */
    async getSystemHealth(): Promise<HealthStatus> {
        const response = await apiRequest<HealthStatus>('/health', {
            method: 'GET',
        });
        return response;
    },

    /**
     * Nettoyer les anciens logs de synchronisation
     * POST /api/admin/sync/cleanup-logs
     */
    async cleanupSyncLogs(days: number = 30): Promise<{ success: boolean; deleted_count: number }> {
        const response = await apiRequest<{ success: boolean; deleted_count: number }>('/admin/sync/cleanup-logs', {
            method: 'POST',
            body: { days },
        });
        return response;
    },

    /**
     * Réinitialiser la synchronisation (état initial)
     * POST /api/admin/sync/reset
     */
    async resetSync(): Promise<{ success: boolean; message: string }> {
        const response = await apiRequest<{ success: boolean; message: string }>('/admin/sync/reset', {
            method: 'POST',
        });
        return response;
    },

    /**
     * Obtenir les logs de synchronisation récents
     * GET /api/admin/sync/logs
     */
    async getSyncLogs(limit: number = 50, offset: number = 0): Promise<any[]> {
        const response = await apiRequest<{ success: boolean; logs: any[] }>(
            `/admin/sync/logs?limit=${limit}&offset=${offset}`,
            {
                method: 'GET',
            },
        );
        return response.logs || [];
    },

    /**
     * Exporter les logs de synchronisation
     * GET /api/admin/sync/logs/export
     */
    async exportSyncLogs(format: 'json' | 'csv' = 'json'): Promise<Blob> {
        const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/sync/logs/export?format=${format}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
                },
            },
        );

        if (!response.ok) {
            throw new Error('Erreur lors de l\'export des logs');
        }

        return response.blob();
    },
};
