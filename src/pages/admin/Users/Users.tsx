import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui';
import { adminService } from '../../../services/adminService';
import type { CreateUserDTO, UpdateUserDTO } from '../../../services/adminService';
import { USER_ROLES, canBeBlocked, type AdminUser, type UserRoleId } from '../../../types/auth.types';
import UserForm from '../../../components/users/UserForm';
import '../../../assets/styles/pages/Users.css'

interface UserFilters {
    search: string;
    type_user?: number;
    est_bloque?: boolean;
    sort_by: 'date_creation' | 'email' | 'display_name';
    order: 'ASC' | 'DESC';
    page: number;
    limit: number;
}

const USER_TYPES = [
    { id: 1, label: 'Admin', color: '#6c757d' },
    { id: 2, label: 'Utilisateur', color: '#0d6efd' },
    { id: 3, label: 'Manager', color: '#dc3545' },
];

export default function Users() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        pages: 1,
    });

    const [filters, setFilters] = useState<UserFilters>({
        search: '',
        type_user: undefined,
        est_bloque: undefined,
        sort_by: 'date_creation',
        order: 'DESC',
        page: 1,
        limit: 10,
    });

    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Charger les utilisateurs
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await adminService.getUsers({
                page: filters.page,
                limit: filters.limit,
                search: filters.search || undefined,
                type_user: filters.type_user,
                est_bloque: filters.est_bloque,
                sort_by: filters.sort_by,
                order: filters.order,
            });

            if (response.success) {
                setUsers(response.data);
                setPagination(response.pagination);
            } else {
                setError('Erreur lors du chargement des utilisateurs');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // Charger les statistiques
    const loadStats = useCallback(async () => {
        try {
            const response = await adminService.getUserStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des stats:', err);
        }
    }, []);

    useEffect(() => {
        loadUsers();
        loadStats();
    }, [loadUsers, loadStats]);

    // Gérer la recherche
    const handleSearch = (value: string) => {
        setFilters(prev => ({ ...prev, search: value, page: 1 }));
    };

    // Gérer les filtres
    const handleFilterChange = (key: keyof UserFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    // Réinitialiser les filtres
    const handleResetFilters = () => {
        setFilters({
            search: '',
            type_user: undefined,
            est_bloque: undefined,
            sort_by: 'date_creation',
            order: 'DESC',
            page: 1,
            limit: 10,
        });
    };

    // Créer/Modifier un utilisateur
    const handleSaveUser = async (userData: CreateUserDTO | UpdateUserDTO) => {
        try {
            if (isEditing && selectedUser) {
                await adminService.updateUser(selectedUser.id, userData);
                setSuccessMessage('Utilisateur modifié avec succès');
            } else {
                await adminService.createUser(userData as CreateUserDTO);
                setSuccessMessage('Utilisateur créé avec succès');
            }
            setShowForm(false);
            setSelectedUser(null);
            setIsEditing(false);
            setError(null);
            loadUsers();
            loadStats();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la sauvegarde');
        }
    };

    // Bloquer/Débloquer
    const handleToggleBlock = async (user: AdminUser) => {
        if (!canBeBlocked(user.type_user)) {
            setError('Les managers ne peuvent pas être bloqués');
            return;
        }

        setActionLoading(user.id);
        setError(null);
        setSuccessMessage(null);

        try {
            if (user.est_bloque) {
                const result = await adminService.unblockUser(user.id);
                if (result.success) {
                    setSuccessMessage(result.message || `L'utilisateur ${user.display_name} a été débloqué.`);
                } else {
                    setError(result.error || 'Erreur lors du déblocage');
                }
            } else {
                const result = await adminService.blockUser(user.id);
                if (result.success) {
                    setSuccessMessage(result.message || `L'utilisateur ${user.display_name} a été bloqué.`);
                } else {
                    setError(result.error || 'Erreur lors du blocage');
                }
            }
            await loadUsers();
        } catch (err: any) {
            setError(err.message || 'Erreur lors du blocage/déblocage');
        } finally {
            setActionLoading(null);
        }
    };

    // Envoyer les identifiants par email
    const handleSendCredentials = async (user: AdminUser) => {
        setActionLoading(user.id);
        setSuccessMessage(null);
        setError(null);

        try {
            const res = await adminService.sendUserCredentials(user.id);
            if (res.success) {
                setSuccessMessage(res.message || `Identifiants envoyés à ${user.email} avec succès.`);
            } else {
                setError("Erreur lors de l'envoi des identifiants.");
            }
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'envoi des identifiants.");
        } finally {
            setActionLoading(null);
        }
    };

    // Supprimer
    const handleDeleteUser = async (user: AdminUser) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.display_name} ?`)) return;

        setActionLoading(user.id);
        setError(null);
        setSuccessMessage(null);

        try {
            await adminService.deleteUser(user.id);
            setSuccessMessage(`L'utilisateur ${user.display_name} a été supprimé.`);
            loadUsers();
            loadStats();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la suppression');
        } finally {
            setActionLoading(null);
        }
    };

    // Éditer
    const handleEditUser = (user: AdminUser) => {
        setSelectedUser(user);
        setIsEditing(true);
        setShowForm(true);
    };

    // Voir les détails
    const handleViewUser = async (userId: number) => {
        try {
            const response = await adminService.getUserById(userId);
            if (response.success) {
                setSelectedUser(response.data);
            }
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement');
        }
    };

    const getUserTypeLabel = (typeId: UserRoleId) => {
        return USER_ROLES[typeId] || USER_TYPES.find(t => t.id === typeId)?.label || 'Inconnu';
    };

    const getUserTypeColor = (typeId: number) => {
        return USER_TYPES.find(t => t.id === typeId)?.color || '#6c757d';
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="users-container">
            <div className="users-header">
                <div className="header-content">
                    <h1>Gestion des Utilisateurs</h1>
                    <p className="page-subtitle">Créer, modifier et gérer les utilisateurs</p>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" onClick={loadUsers} disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Actualiser
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setSelectedUser(null);
                            setIsEditing(false);
                            setShowForm(true);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        Créer un utilisateur
                    </Button>
                </div>
            </div>

            {/* Messages */}
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

            {/* Statistiques */}
            {stats && (
                <div className="users-stats">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.total_users}</div>
                            <div className="stat-label">Total</div>
                        </div>
                    </div>
                    <div className="stat-card manager">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <polyline points="17 11 19 13 23 9" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.managers}</div>
                            <div className="stat-label">Managers</div>
                        </div>
                    </div>
                    <div className="stat-card user">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.regular_users}</div>
                            <div className="stat-label">Utilisateurs</div>
                        </div>
                    </div>
                    <div className="stat-card visitor">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.visitors}</div>
                            <div className="stat-label">Visiteurs</div>
                        </div>
                    </div>
                    <div className="stat-card blocked">
                        <div className="stat-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.blocked_users}</div>
                            <div className="stat-label">Bloqués</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Barre d'outils de filtrage */}
            <div className="users-toolbar">
                <div className="search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Rechercher par email, nom ou UID..."
                        value={filters.search}
                        onChange={e => handleSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filters">
                    <select
                        value={filters.type_user || ''}
                        onChange={e => handleFilterChange('type_user', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="filter-select"
                    >
                        <option value="">Tous les types</option>
                        {USER_TYPES.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.est_bloque === undefined ? '' : filters.est_bloque.toString()}
                        onChange={e => handleFilterChange('est_bloque', e.target.value === '' ? undefined : e.target.value === 'true')}
                        className="filter-select"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="false">Actifs</option>
                        <option value="true">Bloqués</option>
                    </select>

                    <select
                        value={filters.sort_by}
                        onChange={e => handleFilterChange('sort_by', e.target.value as any)}
                        className="filter-select"
                    >
                        <option value="date_creation">Tri: Date création</option>
                        <option value="email">Tri: Email</option>
                        <option value="display_name">Tri: Nom</option>
                    </select>

                    <select
                        value={filters.order}
                        onChange={e => handleFilterChange('order', e.target.value as any)}
                        className="filter-select"
                    >
                        <option value="DESC">Descendant</option>
                        <option value="ASC">Ascendant</option>
                    </select>

                    <Button variant="outline" size="sm" onClick={handleResetFilters}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Réinitialiser
                    </Button>
                </div>
            </div>

            {/* Tableau des utilisateurs */}
            <div className="users-card">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement des utilisateurs...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <p>Aucun utilisateur trouvé</p>
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
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
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
                                                {getUserTypeLabel(user.type_user)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.est_bloque ? 'blocked' : 'active'}`}>
                                                {user.est_bloque ? 'Bloqué' : 'Actif'}
                                            </span>
                                        </td>
                                        <td className="date-cell">{formatDate(user.date_creation)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewUser(user.id)}
                                                    title="Voir les détails"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleEditUser(user)}
                                                    title="Modifier"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </Button>
                                                {canBeBlocked(user.type_user) ? (
                                                    user.est_bloque ? (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleToggleBlock(user)}
                                                            isLoading={actionLoading === user.id}
                                                            disabled={actionLoading !== null}
                                                            title="Débloquer"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                                            </svg>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleToggleBlock(user)}
                                                            isLoading={actionLoading === user.id}
                                                            disabled={actionLoading !== null}
                                                            title="Bloquer"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                            </svg>
                                                        </Button>
                                                    )
                                                ) : null}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSendCredentials(user)}
                                                    isLoading={actionLoading === user.id}
                                                    disabled={actionLoading !== null || !user.email}
                                                    title="Envoyer les identifiants par email"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                        <polyline points="22,6 12,13 2,6" />
                                                    </svg>
                                                </Button>
                                                {canBeBlocked(user.type_user) && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(user)}
                                                        isLoading={actionLoading === user.id}
                                                        disabled={actionLoading !== null}
                                                        title="Supprimer"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </Button>
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

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => handleFilterChange('page', pagination.page - 1)}
                    >
                        ← Précédent
                    </Button>

                    <div className="page-info">
                        Page {pagination.page} sur {pagination.pages} ({pagination.total} résultats)
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => handleFilterChange('page', pagination.page + 1)}
                    >
                        Suivant →
                    </Button>

                    <select
                        value={filters.limit}
                        onChange={e => handleFilterChange('limit', parseInt(e.target.value))}
                        className="limit-select"
                    >
                        <option value={10}>10 par page</option>
                        <option value={25}>25 par page</option>
                        <option value={50}>50 par page</option>
                        <option value={100}>100 par page</option>
                    </select>
                </div>
            )}

            {/* Formulaire Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{isEditing ? "Modifier l'utilisateur" : 'Créer un utilisateur'}</h2>
                            <button
                                className="btn-close"
                                onClick={() => {
                                    setShowForm(false);
                                    setSelectedUser(null);
                                    setIsEditing(false);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <UserForm
                                user={selectedUser}
                                isEditing={isEditing}
                                onSave={handleSaveUser}
                                onCancel={() => {
                                    setShowForm(false);
                                    setSelectedUser(null);
                                    setIsEditing(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Détails Utilisateur Modal */}
            {selectedUser && !showForm && (
                <div className="modal-overlay">
                    <div className="modal-content modal-details">
                        <div className="modal-header">
                            <h2>Détails de l'utilisateur</h2>
                            <button className="btn-close" onClick={() => setSelectedUser(null)}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="user-details-header">
                                <div className="user-avatar-large">
                                    {selectedUser.display_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="user-details-title">
                                    <h3>{selectedUser.display_name}</h3>
                                    <span className={`role-badge role-${selectedUser.type_user}`}>
                                        {getUserTypeLabel(selectedUser.type_user)}
                                    </span>
                                </div>
                            </div>
                            <div className="user-details">
                                <div className="detail-row">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        Email
                                    </label>
                                    <span>{selectedUser.email}</span>
                                </div>
                                <div className="detail-row">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        Statut
                                    </label>
                                    <span className={`status-badge ${selectedUser.est_bloque ? 'blocked' : 'active'}`}>
                                        {selectedUser.est_bloque ? 'Bloqué' : 'Actif'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        Créé le
                                    </label>
                                    <span>{formatDate(selectedUser.date_creation)}</span>
                                </div>
                                <div className="detail-row">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="23 4 23 10 17 10" />
                                            <polyline points="1 20 1 14 7 14" />
                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                        </svg>
                                        Dernière sync
                                    </label>
                                    <span>{formatDate(selectedUser.derniere_sync)}</span>
                                </div>
                                <div className="detail-row">
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                        </svg>
                                        UID Firebase
                                    </label>
                                    <span className="monospace">{selectedUser.firebase_uid}</span>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                                    Fermer
                                </Button>
                                <Button variant="primary" onClick={() => handleEditUser(selectedUser)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Modifier
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
