import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useAuth } from '../../../contexts';
import type { UserRoleId } from '../../../types/auth.types';
import '../../../assets/styles/components/Sidebar.css';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

interface NavItem {
    path: string;
    label: string;
    icon: ReactNode;
    // 'public' = accessible à tous (visiteurs non connectés inclus)
    // 'authenticated' = nécessite connexion (Utilisateur ou Manager)
    // 'manager' = Manager uniquement
    access: 'public' | 'authenticated' | 'manager';
}

const navItems: NavItem[] = [
    // ========================
    // ROUTES PUBLIQUES (Visiteurs non connectés + tous les utilisateurs)
    // ========================
    {
        path: ROUTES.DASHBOARD,
        label: 'Tableau de bord',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
        access: 'public',
    },
    {
        path: ROUTES.MAP,
        label: 'Carte',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
            </svg>
        ),
        access: 'public',
    },

    // ========================
    // UTILISATEURS CONNECTÉS (Utilisateur ou Manager)
    // ========================
    {
        path: ROUTES.MY_REPORTS,
        label: 'Mes signalements',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        access: 'authenticated',
    },

    // ========================
    // MANAGER UNIQUEMENT
    // ========================
    {
        path: ROUTES.ADMIN.REPORTS,
        label: 'Gestion signalements',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        access: 'manager',
    },
    {
        path: ROUTES.ADMIN.SYNC,
        label: 'Synchronisation',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
        ),
        access: 'manager',
    },
    {
        path: ROUTES.ADMIN.BLOCKED_USERS,
        label: 'Utilisateurs bloqués',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
        ),
        access: 'manager',
    },
    {
        path: ROUTES.ADMIN.ENTREPRISES,
        label: 'Entreprises',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
        access: 'manager',
    },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();

    // Déterminer le rôle actuel
    const userRoleId: UserRoleId | null = user?.type_user || null;
    const isManager = userRoleId === 3;

    // Filtrer les éléments de navigation selon l'accès
    const filteredNavItems = navItems.filter((item) => {
        if (item.access === 'public') return true;
        if (item.access === 'authenticated') return isAuthenticated;
        if (item.access === 'manager') return isManager;
        return false;
    });

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    {!collapsed && <span className="sidebar-title">SignalRoute</span>}
                </div>
                <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed ? (
                            <polyline points="9 18 15 12 9 6" />
                        ) : (
                            <polyline points="15 18 9 12 15 6" />
                        )}
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {filteredNavItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                title={collapsed ? item.label : undefined}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!collapsed && <span className="nav-label">{item.label}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                {!isAuthenticated ? (
                    <div className="visitor-section">
                        <div className="visitor-info">
                            <span className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            {!collapsed && <span className="visitor-label">Visiteur</span>}
                        </div>
                        <Link to={ROUTES.LOGIN} className="nav-link login-link">
                            <span className="nav-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                            </span>
                            {!collapsed && <span className="nav-label">Se connecter</span>}
                        </Link>
                    </div>
                ) : (
                    <div className="user-section">
                        <Link to={ROUTES.PROFILE} className="user-info-link">
                            <div className="user-info">
                                <div className="user-avatar">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                {!collapsed && (
                                    <div className="user-details">
                                        <span className="user-name">{user?.display_name}</span>
                                        <span className="user-role">{user?.type_user_name}</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                        <button
                            className="logout-button"
                            onClick={logout}
                            title="Se déconnecter"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            {!collapsed && <span>Déconnexion</span>}
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
