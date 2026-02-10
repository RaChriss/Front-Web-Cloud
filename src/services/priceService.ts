import { apiRequest } from './api';

/**
 * Service pour la gestion de la configuration des prix
 * Endpoints: /api/config/prix
 */

// ============================================
// TYPES
// ============================================

export interface PrixConfig {
    id: number;
    prix_par_m2: number;
    description: string;
    date_effet: string;
    est_actif: boolean;
    cree_par?: string;
}

// Réponse du GET /api/config/prix
export interface PrixConfigResponse {
    success: boolean;
    configured: boolean;
    prix: PrixConfig | null;
    message?: string;
}

export interface PrixHistoriqueResponse {
    success: boolean;
    data: PrixConfig[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface BudgetCalculation {
    configured: boolean;
    prix_par_m2: number;
    niveau: number;
    surface_m2: number;
    budget_calcule: number;
    formule: string;
}

// Réponse du POST /api/config/prix/calculer
export interface BudgetCalculationResponse {
    success: boolean;
    configured: boolean;
    data?: BudgetCalculation;
    budget?: number;
    message?: string;
}

export interface DelaisStatistiques {
    delai_moyen_jours: number;
    delai_minimum_jours: number;
    delai_maximum_jours: number;
    nombre_reparations_terminees: number;
}

// ============================================
// SERVICE
// ============================================

export const priceService = {
    /**
     * Récupérer le prix actuel par m²
     * GET /api/config/prix
     * Pas d'auth requise
     * Retourne configured: true/false et prix: null si pas configuré
     */
    async getCurrentPrice(): Promise<PrixConfigResponse> {
        const response = await apiRequest<PrixConfigResponse>('/config/prix', {
            method: 'GET',
        });
        return response;
    },

    /**
     * Définir un nouveau prix par m²
     * POST /api/config/prix
     * Accès: Manager uniquement (auth requise)
     * Le prix doit être >= 1 (plus de prix à 0)
     */
    async setNewPrice(prix_par_m2: number, description?: string): Promise<PrixConfig> {
        const response = await apiRequest<{ success: boolean; message: string; data: PrixConfig }>('/config/prix', {
            method: 'POST',
            body: { prix_par_m2, description },
        });
        return response.data;
    },

    /**
     * Récupérer l'historique des prix
     * GET /api/config/prix/historique?page=1&limit=20
     * Auth requise (plus besoin d'être manager)
     */
    async getPriceHistory(page: number = 1, limit: number = 20): Promise<PrixHistoriqueResponse> {
        const response = await apiRequest<PrixHistoriqueResponse>(
            `/config/prix/historique?page=${page}&limit=${limit}`,
            { method: 'GET' }
        );
        return response;
    },

    /**
     * Calculer un budget estimé
     * POST /api/config/prix/calculer
     * Pas d'auth requise
     * Retourne configured: false + budget: 0 si aucun prix configuré
     * Formule: budget = prix_par_m2 × niveau × surface_m2
     */
    async calculateBudget(niveau: number, surface_m2: number): Promise<BudgetCalculationResponse> {
        const response = await apiRequest<BudgetCalculationResponse>('/config/prix/calculer', {
            method: 'POST',
            body: { niveau, surface_m2 },
        });
        return response;
    },

    /**
     * Récupérer les statistiques des délais de traitement
     * GET /api/config/statistiques/delais
     */
    async getDelayStatistics(): Promise<DelaisStatistiques> {
        const response = await apiRequest<{ success: boolean; data: DelaisStatistiques }>(
            '/config/statistiques/delais',
            { method: 'GET' }
        );
        return response.data;
    },

    /**
     * Formatter un prix en Ariary
     */
    formatPrice(amount: number): string {
        return new Intl.NumberFormat('fr-MG', {
            style: 'currency',
            currency: 'MGA',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    },

    /**
     * Formatter un prix simplifié (sans devise)
     */
    formatPriceSimple(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
    },
};
