// Types pour les signalements routiers
// Correspondance avec l'API backend

export type ReportStatus = 'new' | 'in_progress' | 'completed';

// Localisation d'un signalement
export interface Location {
    latitude: number;
    longitude: number;
}

// Statut d'un signalement depuis l'API
export interface StatusInfo {
    id: number;
    libelle: string;
    couleur: string;
}

// Utilisateur qui a signalé
export interface SignalePar {
    display_name: string;
    email: string;
}

// Statut depuis l'API (table statut_signalement) - pour les listes de configuration
export interface StatusConfig {
    id: number;
    libelle: string;
}

// Entreprise depuis l'API (table entreprise)
export interface EntrepriseConfig {
    id: number;
    nom: string;
    contact?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
}

// Réparation associée à un signalement
export interface Reparation {
    id: number;
    id_signalement: number;
    niveau?: number; // Niveau de gravité 1-10 (vient du signalement)
    surface_m2: number;
    budget: number;
    id_entreprise: number;
    entreprise_nom?: string;
    date_debut?: string;
    date_fin_prevue?: string;
    date_fin_reelle?: string;
    commentaire?: string;
    status?: string; // 'nouveau' | 'en_cours' | 'termine'
    avancement_pct?: number;
    created_at: string;
    updated_at: string;
}

// Données pour créer/modifier une réparation
export interface ReparationFormData {
    surface_m2: number;
    budget: number;
    id_entreprise: number;
    date_debut?: string;
    date_fin_prevue?: string;
    commentaire?: string;
}

// Historique des modifications d'un signalement
export interface HistoriqueEntry {
    id: number;
    id_signalement: number;
    id_user: number;
    user_name?: string;
    ancien_statut?: string;
    nouveau_statut?: string;
    commentaire?: string;
    date_modification: string;
}

// Données pour le popup d'un signalement (endpoint optimisé)
export interface PopupReparation {
    id: number;
    surface_m2: number;
    budget: number;
    niveau: number;
    avancement_pct: number;
    date_creation: string;
    date_passage_en_cours: string | null;
    date_termine: string | null;
}

export interface PopupEntreprise {
    id: number;
    nom: string;
    telephone?: string;
    email?: string;
}

export interface PopupPhotos {
    count: number;
    url: string;
}

export interface PopupData {
    id: number;
    description: string;
    date_signalement: string;
    location: Location;
    status: StatusInfo;
    reparation: PopupReparation | null;
    entreprise: PopupEntreprise | null;
    photos: PopupPhotos;
}

// Signalement complet depuis l'API
export interface Report {
    id: number;
    description: string;
    location: Location;
    date_signalement: string;
    firebase_id?: string;
    est_synchronise?: boolean;
    niveau?: number; // Niveau de dégradation 1-10 (peut être null si non défini)
    status: StatusInfo;
    signale_par: SignalePar | string; // Objet détaillé ou string simple selon l'endpoint
    reparation: Reparation | null;
    // Propriétés calculées côté client pour compatibilité
    latitude: number;
    longitude: number;
    createdAt: Date;
    clientStatus: ReportStatus;
    signaleParNom: string; // Nom extrait pour affichage
}

// Résumé/Statistiques des signalements
export interface ReportSummary {
    totalReports: number;
    totalSurface: number;
    totalBudget: number;
    progressPercentage: number;
    newCount: number;
    inProgressCount: number;
    completedCount: number;
}

// Données pour créer un signalement
export interface ReportFormData {
    latitude: number;
    longitude: number;
    description: string;
}

// Données pour mettre à jour un signalement (utilisateur)
export interface ReportUpdateData {
    latitude?: number;
    longitude?: number;
    description?: string;
}

// Données pour mettre à jour le statut (manager)
export interface StatusUpdateData {
    id_status: number;
    commentaire?: string;
    niveau?: number; // Optionnel - permet de mettre à jour le niveau en même temps
}

// Données pour mettre à jour uniquement le niveau de dégradation
export interface NiveauUpdateData {
    niveau: number; // 1-10
}

// Réponse de l'API pour la mise à jour du niveau
export interface NiveauUpdateResponse {
    success: boolean;
    message: string;
    signalement: {
        id_signalement: number;
        niveau: number;
        ancien_niveau: number | null;
    };
    budget_recalcule?: {
        id_reparation: number;
        formule: string;
        nouveau_budget: number;
    };
}

// ============================================
// TYPES POUR LES ROUTES MANAGER
// ============================================

// Données pour assigner une entreprise à un signalement
export interface AssignEntrepriseData {
    id_entreprise: number;
}

// Données pour définir le budget d'un signalement
export interface BudgetData {
    budget: number; // En Ariary
}

// Données pour définir la surface d'un signalement
export interface SurfaceData {
    surface_m2: number;
}

// Données pour la gestion complète d'un signalement (tout en un)
export interface GestionCompleteData {
    id_entreprise?: number;
    budget?: number;
    surface_m2?: number;
    date_debut?: string;
    date_fin_prevue?: string;
    commentaire?: string;
}

// Données pour modifier un signalement (manager)
export interface ManagerReportUpdateData {
    description?: string;
    latitude?: number;
    longitude?: number;
}

// Données pour créer/modifier une entreprise
export interface EntrepriseFormData {
    nom: string;
    telephone?: string;
    email?: string;
    adresse?: string;
}

// Réponse API pour la liste des signalements
export interface SignalementsListResponse {
    success: boolean;
    count: number;
    signalements: any[];
}

// Réponse API pour un signalement unique
export interface SignalementResponse {
    success: boolean;
    signalement: any;
}

// Réponse API pour les statistiques
export interface StatsRecapResponse {
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

// Mapping des libellés statut vers statuts client (insensible à la casse)
export const STATUS_LIBELLE_MAP: Record<string, ReportStatus> = {
    'nouveau': 'new',
    'new': 'new',
    'en cours': 'in_progress',
    'en_cours': 'in_progress',
    'in_progress': 'in_progress',
    'terminé': 'completed',
    'termine': 'completed',
    'completed': 'completed',
};

// Mapping des IDs de statut vers statuts client
export const STATUS_ID_MAP: Record<number, ReportStatus> = {
    1: 'new',
    2: 'in_progress',
    3: 'completed',
};

export const STATUS_REVERSE_MAP: Record<ReportStatus, number> = {
    'new': 1,
    'in_progress': 2,
    'completed': 3,
};

// Fonction utilitaire pour mapper le statut (par libellé ou par id)
export function mapStatusLibelle(libelle: string | undefined, statusId?: number): ReportStatus {
    // D'abord essayer par ID si disponible
    if (statusId && STATUS_ID_MAP[statusId]) {
        return STATUS_ID_MAP[statusId];
    }
    // Sinon par libellé
    if (!libelle) return 'new';
    const normalized = libelle.toLowerCase().trim();
    return STATUS_LIBELLE_MAP[normalized] || 'new';
}

// Fonction pour transformer un signalement API en Report client
export function mapApiToReport(apiSignalement: any): Report {
    if (!apiSignalement) {
        // Retourner un objet par défaut si les données sont manquantes
        return {
            id: 0,
            description: '',
            location: { latitude: 0, longitude: 0 },
            date_signalement: new Date().toISOString(),
            firebase_id: undefined,
            est_synchronise: false,
            niveau: undefined,
            status: { id: 1, libelle: 'Nouveau', couleur: '#gray' },
            signale_par: '',
            reparation: null,
            latitude: 0,
            longitude: 0,
            createdAt: new Date(),
            clientStatus: 'new',
            signaleParNom: '',
        };
    }

    const statusLibelle = apiSignalement.status?.libelle || 'Nouveau';
    // Récupérer l'ID du statut (peut être dans status.id ou id_status)
    const statusId = apiSignalement.status?.id || apiSignalement.id_status;

    // Extraire le nom de l'utilisateur (peut être string ou objet)
    let signaleParNom = '';
    if (typeof apiSignalement.signale_par === 'string') {
        signaleParNom = apiSignalement.signale_par;
    } else if (apiSignalement.signale_par?.display_name) {
        signaleParNom = apiSignalement.signale_par.display_name;
    }

    return {
        // L'API peut retourner 'id' ou 'id_signalement'
        id: apiSignalement.id ?? apiSignalement.id_signalement ?? 0,
        description: apiSignalement.description || '',
        location: apiSignalement.location || { latitude: 0, longitude: 0 },
        date_signalement: apiSignalement.date_signalement || new Date().toISOString(),
        firebase_id: apiSignalement.firebase_id,
        est_synchronise: apiSignalement.est_synchronise ?? false,
        niveau: apiSignalement.niveau ?? undefined, // Niveau de dégradation 1-10
        status: apiSignalement.status || { id: 1, libelle: 'Nouveau', couleur: '#gray' },
        signale_par: apiSignalement.signale_par || '',
        reparation: apiSignalement.reparation || null,
        // Propriétés calculées pour compatibilité
        latitude: apiSignalement.location?.latitude || apiSignalement.latitude || 0,
        longitude: apiSignalement.location?.longitude || apiSignalement.longitude || 0,
        createdAt: new Date(apiSignalement.date_signalement || Date.now()),
        clientStatus: mapStatusLibelle(statusLibelle, statusId),
        signaleParNom,
    };
}

// ============================================
// TYPES POUR LA SYNCHRONISATION
// ============================================

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
