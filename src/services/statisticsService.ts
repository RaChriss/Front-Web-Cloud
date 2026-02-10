import { apiRequest } from './api';

/**
 * Service pour les statistiques unifiées
 * Endpoint: /api/config/statistiques
 */

// ============================================
// TYPES
// ============================================

export type StatisticsPeriod = 'semaine' | 'mois' | 'trimestre' | 'annee' | 'tout';

export interface DelaisStats {
    moyen_jours: number;
    min_jours: number;
    max_jours: number;
    total_termines: number;
}

export interface ReparationsStats {
    total: number;
    nouveau: number;
    en_cours: number;
    termine: number;
    budget_total: number;
    budget_moyen: number;
    surface_totale: number;
    avancement_moyen: number;
}

export interface SignalementsStats {
    total: number;
    nouveau: number;
    en_cours: number;
    termine: number;
    avec_niveau: number;
}

export interface RepartitionStatus {
    status: string;
    count: number;
    pourcentage: number;
}

export interface PrixInfo {
    prix_par_m2: number;
    description?: string;
    date_modification?: string;
}

export interface EvolutionHebdo {
    semaine: string;
    date_debut: string;
    date_fin: string;
    nouveaux: number;
    termines: number;
}

export interface EntrepriseStats {
    id: number;
    nom: string;
    reparations_total: number;
    reparations_terminees: number;
    budget_total: number;
}

export interface RepartitionNiveau {
    niveau: number;
    count: number;
    delai_moyen_jours: number;
}

export interface StatistiquesData {
    delais: DelaisStats;
    reparations: ReparationsStats;
    signalements: SignalementsStats;
    repartition_status?: RepartitionStatus[];
    repartition_par_niveau?: RepartitionNiveau[];
    prix?: PrixInfo;
    evolution_hebdomadaire?: EvolutionHebdo[];
    entreprises?: EntrepriseStats[];
}

export interface StatistiquesResponse {
    success: boolean;
    periode: StatisticsPeriod;
    statistiques: StatistiquesData;
}

export interface DelaisStatsResponse {
    success: boolean;
    data: {
        delai_moyen_jours: number;
        delai_minimum_jours: number;
        delai_maximum_jours: number;
        nombre_reparations_terminees: number;
        repartition_par_niveau?: RepartitionNiveau[];
    };
}

// ============================================
// SERVICE
// ============================================

export const statisticsService = {
    /**
     * Récupérer toutes les statistiques (endpoint unifié)
     * GET /api/config/statistiques
     * @param periode - Filtre par période (semaine|mois|trimestre|annee|tout)
     */
    async getAll(periode: StatisticsPeriod = 'tout'): Promise<StatistiquesResponse> {
        const endpoint = `/config/statistiques${periode !== 'tout' ? `?periode=${periode}` : ''}`;
        return apiRequest<StatistiquesResponse>(endpoint, { method: 'GET' });
    },

    /**
     * Récupérer uniquement les statistiques de délais
     * GET /api/config/statistiques/delais
     */
    async getDelaisStats(): Promise<DelaisStatsResponse> {
        return apiRequest<DelaisStatsResponse>('/config/statistiques/delais', { method: 'GET' });
    },

    /**
     * Récupérer le récapitulatif des signalements
     * GET /api/signalements/stats/recapitulatif
     */
    async getSignalementsRecap(): Promise<{ success: boolean; data: SignalementsStats }> {
        return apiRequest<{ success: boolean; data: SignalementsStats }>(
            '/signalements/stats/recapitulatif',
            { method: 'GET' }
        );
    },

    /**
     * Formater un nombre en format monétaire Ariary
     */
    formatBudget(amount: number): string {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)} M Ar`;
        }
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)} K Ar`;
        }
        return `${amount.toLocaleString('fr-FR')} Ar`;
    },

    /**
     * Obtenir le libellé de la période
     */
    getPeriodLabel(periode: StatisticsPeriod): string {
        const labels: Record<StatisticsPeriod, string> = {
            semaine: 'Cette semaine',
            mois: 'Ce mois',
            trimestre: 'Ce trimestre',
            annee: 'Cette année',
            tout: 'Toutes périodes',
        };
        return labels[periode];
    },
};
