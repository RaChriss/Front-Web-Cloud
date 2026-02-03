import { apiRequest } from './api';
import type { AdminUser, User } from '../types/auth.types';
import type {
    SyncStatus,
    SyncConflict,
    HealthStatus,
    SyncStatistics,
    SyncExecuteResult,
    AutoSyncConfig,
} from '../types/report.types';

// Réponse de la liste des utilisateurs
export interface UsersResponse {
    success: boolean;
    count: number;
    users: AdminUser[];
}

// Réponse pour le blocage/déblocage
export interface BlockResponse {
    success: boolean;
    message?: string;
    error?: string;
    details?: {
        tentatives_reinitialisees?: boolean;
    };
    user?: User;
}

export interface AdminParameters {
    id: string;
    type: string;
    value: unknown;
}

export const adminService = {
    /**
     * Liste tous les utilisateurs
     * GET /api/admin/users
     */
    async getUsers(): Promise<AdminUser[]> {
        const response = await apiRequest<UsersResponse>('/admin/users', {
            method: 'GET',
        });
        return response.success ? response.users : [];
    },

    /**
     * Liste les utilisateurs bloqués uniquement
     * GET /api/admin/users/blocked
     */
    async getBlockedUsers(): Promise<AdminUser[]> {
        const response = await apiRequest<UsersResponse>('/admin/users/blocked', {
            method: 'GET',
        });
        return response.success ? response.users : [];
    },

    /**
     * Bloquer un utilisateur
     * POST /api/admin/users/:id/block
     * Note: Les managers (type_user = 3) ne peuvent pas être bloqués
     */
    async blockUser(userId: number): Promise<BlockResponse> {
        return apiRequest<BlockResponse>(`/admin/users/${userId}/block`, {
            method: 'POST',
        });
    },

    /**
     * Débloquer un utilisateur et réinitialiser ses tentatives de connexion
     * POST /api/admin/users/:id/unblock
     */
    async unblockUser(userId: number): Promise<BlockResponse> {
        return apiRequest<BlockResponse>(`/admin/users/${userId}/unblock`, {
            method: 'POST',
        });
    },

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
