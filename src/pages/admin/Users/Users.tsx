import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../../services/adminService';
import type { CreateUserDTO, UpdateUserDTO } from '../../../services/adminService';
import type { AdminUser } from '../../../types/auth.types';
import UserForm from './UserForm';
import './Users.css';

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
    { id: 1, label: 'Visiteur', color: '#6c757d' },
    { id: 2, label: 'Utilisateur', color: '#0d6efd' },
    { id: 3, label: 'Manager', color: '#dc3545' },
];

export default function Users() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        setLoading(true);
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
            setLoading(false);
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
                setError(null);
            } else {
                await adminService.createUser(userData as CreateUserDTO);
                setError(null);
            }
            setShowForm(false);
            setSelectedUser(null);
            setIsEditing(false);
            loadUsers();
            loadStats();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la sauvegarde');
        }
    };

    // Bloquer/Débloquer
    const handleToggleBlock = async (userId: number, isBlocked: boolean) => {
        try {
            if (isBlocked) {
                await adminService.unblockUser(userId);
            } else {
                await adminService.blockUser(userId);
            }
            loadUsers();
        } catch (err: any) {
            setError(err.message || 'Erreur lors du blocage');
        }
    };

    // Supprimer
    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        try {
            await adminService.deleteUser(userId);
            loadUsers();
            loadStats();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la suppression');
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

    const getUserTypeLabel = (typeId: number) => {
        return USER_TYPES.find(t => t.id === typeId)?.label || 'Inconnu';
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
                <h1>Gestion des Utilisateurs</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setSelectedUser(null);
                        setIsEditing(false);
                        setShowForm(true);
                    }}
                >
                    + Créer un utilisateur
                </button>
            </div>

            {/* Statistiques */}
            {stats && (
                <div className="users-stats">
                    <div className="stat-card">
                        <div className="stat-label">Total</div>
                        <div className="stat-value">{stats.total_users}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Managers</div>
                        <div className="stat-value">{stats.managers}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Utilisateurs</div>
                        <div className="stat-value">{stats.regular_users}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Visiteurs</div>
                        <div className="stat-value">{stats.visitors}</div>
                    </div>
                    <div className="stat-card blocked">
                        <div className="stat-label">Bloqués</div>
                        <div className="stat-value">{stats.blocked_users}</div>
                    </div>
                </div>
            )}

            {/* Barre d'outils de filtrage */}
            <div className="users-toolbar">
                <div className="search-box">
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

                    <button onClick={handleResetFilters} className="btn btn-secondary">
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Tableau des utilisateurs */}
            <div className="users-table-container">
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : users.length === 0 ? (
                    <div className="empty-state">Aucun utilisateur trouvé</div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Nom</th>
                                <th>Type</th>
                                <th>Statut</th>
                                <th>Créé le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className={user.est_bloque ? 'blocked-row' : ''}>
                                    <td>{user.email}</td>
                                    <td>{user.display_name}</td>
                                    <td>
                                        <span
                                            className="type-badge"
                                            style={{ backgroundColor: getUserTypeColor(user.type_user) }}
                                        >
                                            {getUserTypeLabel(user.type_user)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.est_bloque ? 'blocked' : 'active'}`}>
                                            {user.est_bloque ? 'Bloqué' : 'Actif'}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.date_creation)}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn btn-sm btn-info"
                                            onClick={() => handleViewUser(user.id)}
                                            title="Voir les détails"
                                        >
                                            Voir
                                        </button>
                                        <button
                                            className="btn btn-sm btn-warning"
                                            onClick={() => handleEditUser(user)}
                                            title="Modifier"
                                        >
                                            Éditer
                                        </button>
                                        <button
                                            className={`btn btn-sm ${user.est_bloque ? 'btn-success' : 'btn-danger'}`}
                                            onClick={() => handleToggleBlock(user.id, user.est_bloque)}
                                            title={user.est_bloque ? 'Débloquer' : 'Bloquer'}
                                            disabled={user.type_user === 3}
                                        >
                                            {user.est_bloque ? 'Débloquer' : 'Bloquer'}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteUser(user.id)}
                                            title="Supprimer"
                                            disabled={user.type_user === 3}
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => handleFilterChange('page', pagination.page - 1)}
                        className="btn btn-secondary"
                    >
                        ← Précédent
                    </button>

                    <div className="page-info">
                        Page {pagination.page} sur {pagination.pages} ({pagination.total} résultats)
                    </div>

                    <button
                        disabled={pagination.page === pagination.pages}
                        onClick={() => handleFilterChange('page', pagination.page + 1)}
                        className="btn btn-secondary"
                    >
                        Suivant →
                    </button>

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
                            <h2>{isEditing ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</h2>
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
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Détails de l'utilisateur</h2>
                            <button className="btn-close" onClick={() => setSelectedUser(null)}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="user-details">
                                <div className="detail-row">
                                    <label>Email:</label>
                                    <span>{selectedUser.email}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Nom:</label>
                                    <span>{selectedUser.display_name}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Type:</label>
                                    <span className="type-badge" style={{ backgroundColor: getUserTypeColor(selectedUser.type_user) }}>
                                        {getUserTypeLabel(selectedUser.type_user)}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <label>UID Firebase:</label>
                                    <span className="monospace">{selectedUser.firebase_uid}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Statut:</label>
                                    <span className={`status-badge ${selectedUser.est_bloque ? 'blocked' : 'active'}`}>
                                        {selectedUser.est_bloque ? 'Bloqué' : 'Actif'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <label>Créé le:</label>
                                    <span>{formatDate(selectedUser.date_creation)}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Dernière sync:</label>
                                    <span>{formatDate(selectedUser.derniere_sync)}</span>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
