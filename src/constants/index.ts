export const APP_NAME = 'SignalRoute';

export const ROUTES = {
    // Routes publiques
    HOME: '/',
    LOGIN: '/login',

    // Routes Visiteur & Utilisateur (carte publique)
    DASHBOARD: '/dashboard',
    MAP: '/map',

    // Routes Utilisateur connecté
    PROFILE: '/profile',
    MY_REPORTS: '/my-reports',

    // Routes Manager
    ADMIN: {
        REPORTS: '/admin/reports',
        REPORT_DETAIL: '/admin/reports/:id',
        SYNC: '/admin/sync',
        USERS: '/admin/users',
        BLOCKED_USERS: '/admin/users/blocked',
        ENTREPRISES: '/admin/entreprises',
        PRICE_CONFIG: '/admin/config/prix',
        REPARATIONS: '/admin/reparations',
        REPARATION_DETAIL: '/admin/reparations/:id',
        STATISTICS: '/admin/statistiques',
    },

    // Anciens chemins (compatibilité)
    REPORTS: '/admin/reports',
    REPORT_DETAIL: '/admin/reports/:id',
    SYNC: '/admin/sync',
    BLOCKED_USERS: '/admin/users/blocked',
} as const;

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
    },
    REPORTS: {
        LIST: '/reports',
        CREATE: '/reports',
        DETAIL: (id: string) => `/reports/${id}`,
        UPDATE: (id: string) => `/reports/${id}`,
        DELETE: (id: string) => `/reports/${id}`,
    },
    USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/profile',
    },
} as const;

export const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'user_data',
    THEME: 'app_theme',
} as const;

export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 2,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
