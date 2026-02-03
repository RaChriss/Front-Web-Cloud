export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    displayName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

// Correspondance avec la table type_user
// Note: Un visiteur n'a PAS de compte (non connecté)
// 1: Admin, 2: Utilisateur (connecté), 3: Manager (connecté)
export type UserRoleId = 1 | 2 | 3;
export type UserRole = 'Admin' | 'Utilisateur' | 'Manager';

export const USER_ROLES: Record<UserRoleId, UserRole> = {
    1: 'Admin',
    2: 'Utilisateur',
    3: 'Manager',
};

// Vérifier si un utilisateur est un manager
export const isManager = (typeUser: UserRoleId): boolean => typeUser === 3;

// Vérifier si un utilisateur peut être bloqué (les managers ne peuvent pas être bloqués)
export const canBeBlocked = (typeUser: UserRoleId): boolean => typeUser !== 3;

export interface User {
    id: number;
    firebase_uid: string;
    email: string;
    display_name: string;
    type_user: UserRoleId;
    type_user_name: UserRole;
    est_bloque?: boolean;
    avatar?: string;
}

// Détails du blocage lors d'une tentative de connexion
export interface BlockDetails {
    tentatives: number;
    max_tentatives: number;
    compte_bloque: boolean;
    raison?: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    mode?: 'firebase' | 'postgres';
    token?: string;
    refresh_token?: string;
    expires_at?: string;
    user?: User;
    // Champs pour les erreurs de blocage
    error?: string;
    blocked?: boolean;
    reason?: 'permanent' | 'temporary';
    details?: BlockDetails;
}

export interface AuthError {
    message: string;
    field?: 'email' | 'password';
}

export interface UpdateProfileData {
    displayName?: string;
}

// Interface pour les utilisateurs dans l'admin
export interface AdminUser {
    id: number;
    firebase_uid: string;
    email: string;
    display_name: string;
    date_creation: string;
    derniere_sync?: string;
    est_bloque: boolean;
    type_user: UserRoleId;
    type_libelle: UserRole;
}
