import { apiRequest } from './api';

/**
 * Service de synchronisation bidirectionnelle
 * Gère la synchronisation entre PostgreSQL et Firebase
 */

export interface SyncStatus {
    enabled: boolean;
    last_sync?: string;
    pending_count: number;
    synced_count: number;
    error_count: number;
    next_sync?: string;
    firebase_status: 'connected' | 'disconnected' | 'error';
    database_status: 'connected' | 'disconnected' | 'error';
}

export interface SyncConflict {
    id: number;
    signalement_id: number;
    firebase_data: Record<string, unknown>;
    postgres_data: Record<string, unknown>;
    conflict_type: 'modification' | 'deletion' | 'creation';
    resolution: 'pending' | 'resolved';
    resolved_by?: string;
    resolution_timestamp?: string;
}

export interface SyncExecuteResult {
    success: boolean;
    message: string;
    synced_count?: number;
    error_count?: number;
    errors?: string[];
    timestamp?: string;
}

export interface AutoSyncConfig {
    enabled: boolean;
    interval_minutes?: number;
    start_time?: string;
    end_time?: string;
}

export interface HealthStatus {
    status: 'ok' | 'degraded' | 'error';
    postgres: {
        connected: boolean;
        response_time?: number;
    };
    firebase: {
        connected: boolean;
        response_time?: number;
    };
    timestamp: string;
}

export interface SyncStatistics {
    total_syncs: number;
    successful_syncs: number;
    failed_syncs: number;
    average_duration_ms: number;
    last_sync_duration_ms?: number;
    total_items_synced: number;
    conflicts_detected: number;
    conflicts_resolved: number;
}

export const syncService = {
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
    async getConflicts(): Promise<SyncConflict[]> {
        const response = await apiRequest<{ success: boolean; conflicts: SyncConflict[] }>('/admin/sync/conflicts', {
            method: 'GET',
        });
        return response.conflicts || [];
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
     * Vérifier le statut général de l'API
     * GET /api/health
     */
    async getGeneralHealth(): Promise<HealthStatus> {
        const response = await apiRequest<HealthStatus>('/health', {
            method: 'GET',
        });
        return response;
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
     * Résoudre un conflit de synchronisation
     * POST /api/admin/sync/conflicts/:id/resolve
     */
    async resolveConflict(conflictId: number, resolution: 'firebase' | 'postgres' | 'custom', customData?: Record<string, unknown>): Promise<SyncConflict> {
        const response = await apiRequest<{ success: boolean; data: SyncConflict }>(`/admin/sync/conflicts/${conflictId}/resolve`, {
            method: 'POST',
            body: { resolution, custom_data: customData },
        });
        return response.data;
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
     * Exporter tous les logs de synchronisation
     * GET /api/admin/sync/logs/export
     */
    async exportSyncLogs(format: 'json' | 'csv' = 'json'): Promise<Blob> {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/sync/logs/export?format=${format}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'export des logs');
        }

        return response.blob();
    },

    /**
     * Obtenir les logs de synchronisation récents
     * GET /api/admin/sync/logs
     */
    async getSyncLogs(limit: number = 50, offset: number = 0): Promise<any[]> {
        const response = await apiRequest<{ success: boolean; logs: any[] }>(`/admin/sync/logs?limit=${limit}&offset=${offset}`, {
            method: 'GET',
        });
        return response.logs || [];
    },
};
