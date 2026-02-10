import { apiRequest } from './api';
import type { Photo } from './photoService';

/**
 * Service pour la gestion des réparations
 * Endpoints: /api/reparations
 */

// ============================================
// TYPES
// ============================================

export type ReparationStatus = 'nouveau' | 'en_cours' | 'termine';

export interface ReparationDetail {
    id_reparation: number;
    id_signalement: number;
    surface_m2: number;
    niveau: number;
    budget: number;
    avancement_pct: number;
    date_creation: string;
    date_debut?: string;
    date_passage_en_cours?: string | null;
    date_fin_prevue?: string;
    date_fin_reelle?: string | null;
    date_termine?: string | null;
    commentaire?: string;
    description?: string;
    id_status: number;
    status_libelle: string;
    status_couleur: string;
    entreprise_nom?: string;
    entreprise_tel?: string;
    entreprise_email?: string;
    manager_nom?: string;
    prix_applique: number;
    date_prix_applique?: string;
    signalement_description?: string;
    longitude?: number;
    latitude?: number;
    date_signalement?: string;
    photos?: Photo[];
    // Compatibility
    id?: number;
    status?: ReparationStatus;
    Id_signalement?: number;
}

export interface ReparationListItem {
    id_reparation: number;
    id_signalement: number;
    surface_m2: number;
    niveau: number;
    budget: number;
    avancement_pct: number;
    date_creation: string;
    date_passage_en_cours?: string | null;
    date_termine?: string | null;
    id_status: number;
    status_libelle: string;
    status_couleur: string;
    entreprise_nom?: string;
    entreprise_tel?: string;
    manager_nom?: string;
    prix_applique: number;
    signalement_description?: string;
    longitude?: number;
    latitude?: number;
    // Compatibility with existing code
    id?: number;
    Id_signalement?: number;
    status?: ReparationStatus;
    description?: string;
}

export interface ReparationFilters {
    status?: ReparationStatus;
    niveau?: number;
    page?: number;
    limit?: number;
}

// Note: niveau est lu depuis le signalement, pas envoyé dans le body
export interface ReparationCreateData {
    surface_m2: number;
    id_entreprise?: number;
    date_debut?: string;
    date_fin_prevue?: string;
    commentaire?: string;
}

// Note: niveau est lu depuis le signalement, on ne peut pas le modifier ici
export interface ReparationUpdateData {
    surface_m2?: number;
    id_entreprise?: number;
    commentaire?: string;
}

export interface ReparationCreatedResponse {
    id_reparation: number;
    id_signalement: number;
    niveau: number;
    id_status: number;
    status_libelle: string;
    avancement_pct: number;
    budget: number;
    surface_m2: number;
    id_entreprise?: number;
    prix_applique: {
        prix_par_m2: number;
        formule: string;
    };
}

export interface DelaisStatistiquesDetail {
    delai_moyen_jours: number;
    delai_minimum_jours: number;
    delai_maximum_jours: number;
    nombre_reparations_terminees: number;
    repartition_par_niveau?: {
        niveau: number;
        delai_moyen_jours: number;
        count: number;
    }[];
}

export interface ReparationsStats {
    total: number;
    nouveau: number;
    en_cours: number;
    termine: number;
    budget_total: number;
}

export interface ReparationsListResponse {
    success: boolean;
    count: number;
    stats: ReparationsStats;
    reparations: ReparationListItem[];
}

// ============================================
// SERVICE
// ============================================

// Mapping status string vers ID pour l'API
const STATUS_ID_MAP: Record<ReparationStatus, number> = {
    'nouveau': 1,
    'en_cours': 2,
    'termine': 3,
};

export const reparationService = {
    /**
     * Liste des réparations avec filtres
     * GET /api/reparations
     * Filtres: ?status=1|2|3, ?niveau=1-10
     * Stats sont globales, reparations respectent les filtres
     */
    async getList(filters?: ReparationFilters): Promise<ReparationsListResponse> {
        const params = new URLSearchParams();
        // Convertir le status string en ID
        if (filters?.status) {
            const statusId = STATUS_ID_MAP[filters.status];
            if (statusId) params.append('status', statusId.toString());
        }
        if (filters?.niveau) params.append('niveau', filters.niveau.toString());
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const queryString = params.toString();
        const endpoint = `/reparations${queryString ? `?${queryString}` : ''}`;

        return apiRequest<ReparationsListResponse>(endpoint, { method: 'GET' });
    },

    /**
     * Détails d'une réparation
     * GET /api/reparations/:id
     */
    async getById(id: number | string): Promise<ReparationDetail> {
        const response = await apiRequest<{ success: boolean; data: ReparationDetail }>(
            `/reparations/${id}`,
            { method: 'GET' }
        );
        return response.data;
    },

    /**
     * Créer une réparation pour un signalement
     * POST /api/reparations/signalement/:signalementId
     * Accès: Manager uniquement
     * Note: Le niveau est lu depuis le signalement, le budget est calculé automatiquement
     * Body: { surface_m2: number, id_entreprise?: number, commentaire?: string }
     */
    async create(signalementId: number | string, data: ReparationCreateData): Promise<ReparationCreatedResponse> {
        const response = await apiRequest<{
            success: boolean;
            message: string;
            data: ReparationCreatedResponse;
        }>(`/reparations/signalement/${signalementId}`, {
            method: 'POST',
            body: data,
        });
        return response.data;
    },

    /**
     * Modifier une réparation
     * PUT /api/reparations/:id
     * Accès: Manager uniquement
     * Note: Si surface_m2 change, le budget est recalculé (niveau vient du signalement)
     */
    async update(id: number | string, data: ReparationUpdateData): Promise<ReparationDetail> {
        const response = await apiRequest<{
            success: boolean;
            message: string;
            data: ReparationDetail;
        }>(`/reparations/${id}`, {
            method: 'PUT',
            body: data,
        });
        return response.data;
    },

    /**
     * Changer le statut d'une réparation
     * PUT /api/reparations/:id/status
     * Accès: Manager uniquement
     * 
     * Avancement automatique:
     * - nouveau = 0%
     * - en_cours = 50% (enregistre date_passage_en_cours)
     * - termine = 100% (enregistre date_termine)
     */
    async updateStatus(id: number | string, status: ReparationStatus): Promise<ReparationDetail> {
        const response = await apiRequest<{
            success: boolean;
            message: string;
            data: ReparationDetail;
        }>(`/reparations/${id}/status`, {
            method: 'PUT',
            body: { status },
        });
        return response.data;
    },

    /**
     * Statistiques des délais de traitement
     * GET /api/reparations/statistiques/delais
     */
    async getDelayStatistics(): Promise<DelaisStatistiquesDetail> {
        const response = await apiRequest<{ success: boolean; data: DelaisStatistiquesDetail }>(
            '/reparations/statistiques/delais',
            { method: 'GET' }
        );
        return response.data;
    },

    /**
     * Obtenir le libellé du statut
     */
    getStatusLabel(status: ReparationStatus): string {
        const labels: Record<ReparationStatus, string> = {
            nouveau: 'Nouveau',
            en_cours: 'En cours',
            termine: 'Terminé',
        };
        return labels[status] || status;
    },

    /**
     * Obtenir la couleur du statut
     */
    getStatusColor(status: ReparationStatus): string {
        const colors: Record<ReparationStatus, string> = {
            nouveau: '#6b7280', // gris
            en_cours: '#f59e0b', // orange
            termine: '#10b981', // vert
        };
        return colors[status] || '#6b7280';
    },

    /**
     * Obtenir le libellé du niveau
     */
    getNiveauLabel(niveau: number): string {
        if (niveau <= 3) return 'Mineur';
        if (niveau <= 6) return 'Moyen';
        if (niveau <= 8) return 'Important';
        return 'Critique';
    },

    /**
     * Obtenir la couleur du niveau
     */
    getNiveauColor(niveau: number): string {
        if (niveau <= 3) return '#10b981'; // vert
        if (niveau <= 6) return '#f59e0b'; // orange
        if (niveau <= 8) return '#ef4444'; // rouge
        return '#dc2626'; // rouge foncé
    },

    /**
     * Formatter l'avancement en pourcentage
     */
    formatAvancement(avancement: number): string {
        return `${avancement}%`;
    },

    /**
     * Calculer le délai en jours
     */
    calculateDelai(dateDebut: string, dateFin?: string): number {
        const debut = new Date(dateDebut);
        const fin = dateFin ? new Date(dateFin) : new Date();
        const diffTime = Math.abs(fin.getTime() - debut.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },
};
