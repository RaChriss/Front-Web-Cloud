import { apiRequest } from './api';
import type {
    Report,
    ReportSummary,
    ReportFormData,
    ReportUpdateData,
    StatusUpdateData,
    ReparationFormData,
    Reparation,
    HistoriqueEntry,
    StatusConfig,
    EntrepriseConfig,
    AssignEntrepriseData,
    BudgetData,
    SurfaceData,
    GestionCompleteData,
    ManagerReportUpdateData,
    EntrepriseFormData,
} from '../types/report.types';
import { mapApiToReport } from '../types/report.types';

export interface ReportFilters {
    status?: number; // id_status (1: nouveau, 2: en cours, 3: terminé)
    date_debut?: string;
    date_fin?: string;
    page?: number;
    limit?: number;
}

export interface SyncResult {
    success: boolean;
    message: string;
    count?: number;
    errors?: string[];
}

// Réponses API
interface ApiSignalementsResponse {
    success: boolean;
    signalements: any[];
    count?: number;
    total?: number;
}

interface ApiSignalementResponse {
    success: boolean;
    signalement: any;
}

interface ApiStatsResponse {
    success: boolean;
    stats: {
        total: number;
        nouveau: number;
        en_cours: number;
        termine: number;
        surface_totale: number;
        budget_total: number;
    };
}

interface ApiStatusListResponse {
    success: boolean;
    statuts: StatusConfig[];
}

interface ApiEntreprisesResponse {
    success: boolean;
    entreprises: EntrepriseConfig[];
}

interface ApiHistoriqueResponse {
    success: boolean;
    historique: HistoriqueEntry[];
}

interface ApiReparationResponse {
    success: boolean;
    reparation: Reparation;
}

interface ApiEntrepriseResponse {
    success: boolean;
    entreprise: EntrepriseConfig;
}

interface ApiMessageResponse {
    success: boolean;
    message: string;
}

export const reportService = {
    // ============================================
    // ROUTES PUBLIQUES (Visiteurs)
    // ============================================

    // Liste de tous les signalements avec filtres optionnels
    async getReports(filters?: ReportFilters): Promise<{ reports: Report[]; total: number }> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status.toString());
        if (filters?.date_debut) params.append('date_debut', filters.date_debut);
        if (filters?.date_fin) params.append('date_fin', filters.date_fin);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const endpoint = `/signalements${queryString ? `?${queryString}` : ''}`;

        const response = await apiRequest<ApiSignalementsResponse>(endpoint, {
            method: 'GET',
        });

        const signalements = response.signalements || [];
        return {
            reports: signalements.map(mapApiToReport),
            total: response.count || response.total || signalements.length,
        };
    },

    // Statistiques récapitulatives
    async getSummary(): Promise<ReportSummary> {
        const response = await apiRequest<ApiStatsResponse>('/signalements/stats/recapitulatif', {
            method: 'GET',
        });

        const stats = response.stats;
        const total = stats.total || 1; // Éviter division par zéro

        return {
            totalReports: stats.total,
            totalSurface: stats.surface_totale,
            totalBudget: stats.budget_total,
            progressPercentage: Math.round((stats.termine / total) * 100),
            newCount: stats.nouveau,
            inProgressCount: stats.en_cours,
            completedCount: stats.termine,
        };
    },

    // Liste des statuts disponibles
    async getStatuts(): Promise<StatusConfig[]> {
        const response = await apiRequest<ApiStatusListResponse>('/signalements/config/statuts', {
            method: 'GET',
        });
        return response.statuts;
    },

    // Liste des entreprises disponibles
    async getEntreprises(): Promise<EntrepriseConfig[]> {
        const response = await apiRequest<ApiEntreprisesResponse>('/signalements/config/entreprises', {
            method: 'GET',
        });
        return response.entreprises;
    },

    // Détails d'un signalement par ID
    async getReport(id: number | string): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/${id}`, {
            method: 'GET',
        });
        return mapApiToReport(response.signalement);
    },

    // ============================================
    // ROUTES UTILISATEUR CONNECTÉ
    // ============================================

    // Créer un nouveau signalement
    async createReport(data: ReportFormData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>('/signalements', {
            method: 'POST',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Liste de mes signalements
    async getMyReports(): Promise<{ reports: Report[]; total: number }> {
        const response = await apiRequest<ApiSignalementsResponse>('/signalements/user/mes-signalements', {
            method: 'GET',
        });

        const signalements = response.signalements || [];
        return {
            reports: signalements.map(mapApiToReport),
            total: response.total || signalements.length,
        };
    },

    // Modifier un signalement (utilisateur propriétaire)
    async updateReport(id: number | string, data: ReportUpdateData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/${id}`, {
            method: 'PUT',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Supprimer un signalement (utilisateur propriétaire)
    async deleteReport(id: number | string): Promise<void> {
        await apiRequest(`/signalements/${id}`, {
            method: 'DELETE',
        });
    },

    // Historique des modifications d'un signalement
    async getHistorique(id: number | string): Promise<HistoriqueEntry[]> {
        const response = await apiRequest<ApiHistoriqueResponse>(`/signalements/${id}/historique`, {
            method: 'GET',
        });
        return response.historique;
    },

    // ============================================
    // ROUTES MANAGER
    // ============================================

    // Liste des signalements pour gestion (manager)
    async getManagerReports(): Promise<{ reports: Report[]; total: number }> {
        const response = await apiRequest<ApiSignalementsResponse>('/signalements/manager/list', {
            method: 'GET',
        });

        const signalements = response.signalements || [];
        return {
            reports: signalements.map(mapApiToReport),
            total: response.total || response.count || signalements.length,
        };
    },

    // Liste des signalements non synchronisés
    async getPendingSync(): Promise<{ reports: Report[]; total: number }> {
        const response = await apiRequest<ApiSignalementsResponse>('/signalements/manager/pending-sync', {
            method: 'GET',
        });

        const signalements = response.signalements || [];
        return {
            reports: signalements.map(mapApiToReport),
            total: response.total || signalements.length,
        };
    },

    // Synchroniser les signalements en attente avec Firebase
    async syncToFirebase(): Promise<SyncResult> {
        const response = await apiRequest<SyncResult>('/signalements/manager/sync', {
            method: 'POST',
        });
        return response;
    },

    // Créer/Modifier une réparation pour un signalement
    async upsertReparation(signalementId: number | string, data: ReparationFormData): Promise<Reparation> {
        const response = await apiRequest<ApiReparationResponse>(`/signalements/${signalementId}/reparation`, {
            method: 'POST',
            body: data,
        });
        return response.reparation;
    },

    // Modifier le statut d'un signalement (manager)
    async updateStatus(id: number | string, data: StatusUpdateData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/${id}/status`, {
            method: 'PUT',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Assigner une entreprise responsable à un signalement
    async assignEntreprise(id: number | string, data: AssignEntrepriseData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/manager/${id}/assigner-entreprise`, {
            method: 'PUT',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Définir ou modifier le budget d'un signalement (en Ariary)
    async updateBudget(id: number | string, data: BudgetData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/manager/${id}/budget`, {
            method: 'PUT',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Définir ou modifier la surface en m² d'un signalement
    async updateSurface(id: number | string, data: SurfaceData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/manager/${id}/surface`, {
            method: 'PUT',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Gestion complète d'un signalement (tout en un)
    async gestionComplete(id: number | string, data: GestionCompleteData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/manager/${id}/gestion-complete`, {
            method: 'PUT',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Modifier un signalement (manager - même si non créateur)
    async managerUpdateReport(id: number | string, data: ManagerReportUpdateData): Promise<Report> {
        const response = await apiRequest<ApiSignalementResponse>(`/signalements/manager/${id}/modifier`, {
            method: 'PUT',
            body: data,
        });
        return mapApiToReport(response.signalement);
    },

    // Supprimer un signalement (manager - quel que soit son statut)
    async managerDeleteReport(id: number | string): Promise<void> {
        await apiRequest<ApiMessageResponse>(`/signalements/manager/${id}/supprimer`, {
            method: 'DELETE',
        });
    },

    // ============================================
    // GESTION DES ENTREPRISES (MANAGER)
    // ============================================

    // Créer une nouvelle entreprise
    async createEntreprise(data: EntrepriseFormData): Promise<EntrepriseConfig> {
        const response = await apiRequest<ApiEntrepriseResponse>('/signalements/manager/entreprises', {
            method: 'POST',
            body: data,
        });
        return response.entreprise;
    },

    // Modifier une entreprise
    async updateEntreprise(id: number | string, data: EntrepriseFormData): Promise<EntrepriseConfig> {
        const response = await apiRequest<ApiEntrepriseResponse>(`/signalements/manager/entreprises/${id}`, {
            method: 'PUT',
            body: data,
        });
        return response.entreprise;
    },

    // Supprimer une entreprise (si non utilisée)
    async deleteEntreprise(id: number | string): Promise<void> {
        await apiRequest<ApiMessageResponse>(`/signalements/manager/entreprises/${id}`, {
            method: 'DELETE',
        });
    },

    // ============================================
    // SYNCHRONISATION (compatibilité)
    // ============================================

    async syncFromFirebase(): Promise<SyncResult> {
        // Import depuis Firebase vers PostgreSQL
        const response = await apiRequest<SyncResult>('/signalements/manager/sync', {
            method: 'POST',
        });
        return response;
    },

    async fullSync(): Promise<{ import: SyncResult; export: SyncResult }> {
        const syncResult = await this.syncToFirebase();
        return {
            import: syncResult,
            export: syncResult,
        };
    },
};

