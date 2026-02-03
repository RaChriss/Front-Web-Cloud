import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui';
import { adminService } from '../../../services/adminService';
import { USER_ROLES, canBeBlocked, type AdminUser } from '../../../types/auth.types';
import '../../../assets/styles/pages/BlockedUsers.css';

export function BlockedUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'blocked'>('all');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Filtrer les utilisateurs bloqués à partir de la liste principale
    const blockedUsers = users.filter(user => user.est_bloque);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allUsers = await adminService.getUsers();
            setUsers(allUsers);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleBlockUser = async (user: AdminUser) => {
        // Vérifier que l'utilisateur peut être bloqué (pas un manager)
        if (!canBeBlocked(user.type_user)) {
            setError('Les managers ne peuvent pas être bloqués');
            return;
        }

        setActionLoading(user.id);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await adminService.blockUser(user.id);
            if (result.success) {
                setSuccessMessage(result.message || `L'utilisateur ${user.display_name} a été bloqué.`);
                await fetchUsers();
            } else {
                setError(result.error || 'Erreur lors du blocage');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du blocage');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnblockUser = async (user: AdminUser) => {
        setActionLoading(user.id);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await adminService.unblockUser(user.id);
            if (result.success) {
                const details = result.details?.tentatives_reinitialisees
                    ? ' Les tentatives de connexion ont été réinitialisées.'
                    : '';
                setSuccessMessage(
                    result.message || `L'utilisateur ${user.display_name} a été débloqué.${details}`
                );
                await fetchUsers();
            } else {
                setError(result.error || 'Erreur lors du déblocage');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du déblocage');
        } finally {
            setActionLoading(null);
        }
    };

    const displayedUsers = activeTab === 'blocked' ? blockedUsers : users;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Jamais';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="blocked-users-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>Gestion des utilisateurs</h1>
                    <p className="page-subtitle">Bloquer et débloquer les utilisateurs</p>
                </div>
                <Button variant="secondary" onClick={fetchUsers} disabled={isLoading}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Actualiser
                </Button>
            </div>

            {successMessage && (
                <div className="alert alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{successMessage}</span>
                    <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Tous les utilisateurs
                    <span className="tab-count">{users.length}</span>
                </button>
                <button
                    className={`tab ${activeTab === 'blocked' ? 'active' : ''}`}
                    onClick={() => setActiveTab('blocked')}
                >
                    Utilisateurs bloqués
                    <span className="tab-count blocked">{blockedUsers.length}</span>
                </button>
            </div>

            <div className="users-card">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement des utilisateurs...</p>
                    </div>
                ) : displayedUsers.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <p>
                            {activeTab === 'blocked'
                                ? 'Aucun utilisateur bloqué'
                                : 'Aucun utilisateur trouvé'}
                        </p>
                    </div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                    <th>Statut</th>
                                    <th>Date de création</th>
                                    <th>Dernière sync</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedUsers.map((user) => (
                                    <tr key={user.id} className={user.est_bloque ? 'blocked-row' : ''}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-small">
                                                    {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <span>{user.display_name}</span>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge role-${user.type_user}`}>
                                                {USER_ROLES[user.type_user] || user.type_libelle}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.est_bloque ? 'blocked' : 'active'}`}>
                                                {user.est_bloque ? 'Bloqué' : 'Actif'}
                                            </span>
                                        </td>
                                        <td className="date-cell">{formatDate(user.date_creation)}</td>
                                        <td className="date-cell">{formatDate(user.derniere_sync)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {/* Les managers ne peuvent pas être bloqués */}
                                                {canBeBlocked(user.type_user) ? (
                                                    user.est_bloque ? (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleUnblockUser(user)}
                                                            isLoading={actionLoading === user.id}
                                                            disabled={actionLoading !== null}
                                                        >
                                                            Débloquer
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleBlockUser(user)}
                                                            isLoading={actionLoading === user.id}
                                                            disabled={actionLoading !== null}
                                                        >
                                                            Bloquer
                                                        </Button>
                                                    )
                                                ) : (
                                                    <span className="text-muted" title="Les managers ne peuvent pas être bloqués">
                                                        Non modifiable
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
