import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../components/ui';
import {
    reparationService,
    type ReparationListItem,
    type ReparationStatus,
    type ReparationFilters,
    type ReparationUpdateData,
} from '../../../services/reparationService';
import { priceService } from '../../../services/priceService';
import { reportService } from '../../../services/reportService';
import type { Report, EntrepriseConfig } from '../../../types/report.types';
import { ROUTES } from '../../../constants';
import './Reparations.css';

export function Reparations() {
    const navigate = useNavigate();
    const [reparations, setReparations] = useState<ReparationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Statistiques rapides
    const [quickStats, setQuickStats] = useState({
        total: 0,
        nouveau: 0,
        en_cours: 0,
        termine: 0,
        budget_total: 0,
    });

    // Filtres
    const [statusFilter, setStatusFilter] = useState<ReparationStatus | ''>('');
    const [niveauFilter, setNiveauFilter] = useState<number | ''>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 20;

    // Modal pour changer le statut
    const [selectedReparation, setSelectedReparation] = useState<ReparationListItem | null>(null);
    const [newStatus, setNewStatus] = useState<ReparationStatus>('nouveau');
    const [isUpdating, setIsUpdating] = useState(false);

    // Modal pour créer une réparation
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState<{ signalementId: string; surface_m2: number; commentaire: string; id_entreprise: number | '' }>({
        signalementId: '',
        surface_m2: 10,
        commentaire: '',
        id_entreprise: '',
    });
    const [isCreating, setIsCreating] = useState(false);
    const [calculatedBudget, setCalculatedBudget] = useState<number>(0);
    const [currentPricePerM2, setCurrentPricePerM2] = useState<number>(0);

    // Liste des entreprises pour la sélection
    const [entreprisesList, setEntreprisesList] = useState<EntrepriseConfig[]>([]);

    // Liste des signalements pour la sélection
    const [signalementsList, setSignalementsList] = useState<Report[]>([]);
    const [signalementSearch, setSignalementSearch] = useState('');
    const [showSignalementDropdown, setShowSignalementDropdown] = useState(false);
    const [selectedSignalement, setSelectedSignalement] = useState<Report | null>(null);
    const [isLoadingSignalements, setIsLoadingSignalements] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Modal pour modifier une réparation
    const [editReparation, setEditReparation] = useState<ReparationListItem | null>(null);
    const [editForm, setEditForm] = useState<ReparationUpdateData>({
        surface_m2: 10,
        commentaire: '',
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadReparations();
        loadCurrentPrice();
    }, [statusFilter, niveauFilter, currentPage]);

    // Charger la liste des signalements pour le dropdown
    const loadSignalements = async () => {
        setIsLoadingSignalements(true);
        try {
            const response = await reportService.getManagerReports();
            // Filtrer pour ne garder que les signalements sans réparation ou avec un niveau défini
            setSignalementsList(response.reports);
        } catch (err) {
            console.error('Erreur chargement signalements:', err);
        } finally {
            setIsLoadingSignalements(false);
        }
    };

    // Charger les entreprises
    const loadEntreprises = async () => {
        try {
            const entreprises = await reportService.getEntreprises();
            setEntreprisesList(entreprises);
        } catch (err) {
            console.error('Erreur chargement entreprises:', err);
        }
    };

    // Charger les signalements et entreprises quand on ouvre le modal de création
    useEffect(() => {
        if (showCreateModal) {
            loadSignalements();
            loadEntreprises();
            setSelectedSignalement(null);
            setSignalementSearch('');
            setCreateForm({ signalementId: '', surface_m2: 10, commentaire: '', id_entreprise: '' });
        }
    }, [showCreateModal]);

    // Fermer le dropdown quand on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSignalementDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrer les signalements par recherche
    const filteredSignalements = signalementsList.filter(s => {
        const searchLower = signalementSearch.toLowerCase();
        return (
            s.id.toString().includes(searchLower) ||
            (s.description?.toLowerCase().includes(searchLower)) ||
            (s.signaleParNom?.toLowerCase().includes(searchLower))
        );
    });

    // Charger le prix actuel pour le calcul du budget
    const loadCurrentPrice = async () => {
        try {
            const priceResponse = await priceService.getCurrentPrice();
            if (priceResponse.configured && priceResponse.prix) {
                setCurrentPricePerM2(priceResponse.prix.prix_par_m2);
            } else {
                setCurrentPricePerM2(0);
            }
        } catch (err) {
            console.error('Erreur chargement prix:', err);
        }
    };

    // Calculer le budget en temps réel pour la création
    // Note: niveau vient du signalement sélectionné
    useEffect(() => {
        if (currentPricePerM2 > 0 && selectedSignalement) {
            const niveau = selectedSignalement.niveau || 5;
            const budget = currentPricePerM2 * niveau * createForm.surface_m2;
            setCalculatedBudget(budget);
        } else if (currentPricePerM2 > 0) {
            // Estimation avec niveau 5 par défaut si pas de signalement sélectionné
            const budget = currentPricePerM2 * 5 * createForm.surface_m2;
            setCalculatedBudget(budget);
        }
    }, [createForm.surface_m2, currentPricePerM2, selectedSignalement]);

    const loadReparations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const filters: ReparationFilters = {
                page: currentPage,
                limit: itemsPerPage,
            };
            if (statusFilter) filters.status = statusFilter;
            if (niveauFilter) filters.niveau = niveauFilter as number;

            const response = await reparationService.getList(filters);
            // Utiliser la nouvelle structure de réponse
            setReparations(response.reparations || []);
            setTotalItems(response.count || 0);
            // Stats globales (toujours calculées sans filtres)
            if (response.stats) {
                setQuickStats(response.stats);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async () => {
        if (!selectedReparation) return;

        const repId = getRepId(selectedReparation);
        if (!repId) {
            setError('ID de réparation manquant');
            return;
        }

        setIsUpdating(true);
        try {
            await reparationService.updateStatus(repId, newStatus);
            setSuccessMessage('Statut mis à jour avec succès');
            setSelectedReparation(null);
            await loadReparations();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally {
            setIsUpdating(false);
        }
    };

    const openStatusModal = (reparation: ReparationListItem) => {
        setSelectedReparation(reparation);
        // Utiliser status_libelle ou status selon ce qui est disponible
        const currentStatus = (reparation.status_libelle || reparation.status || 'nouveau') as ReparationStatus;
        setNewStatus(currentStatus);
    };

    // Créer une nouvelle réparation
    const handleCreateReparation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.signalementId) {
            setError('Veuillez sélectionner un signalement');
            return;
        }

        // Vérifier que le signalement a un niveau défini
        if (selectedSignalement && !selectedSignalement.niveau) {
            setError('Ce signalement n\'a pas de niveau défini. Veuillez d\'abord définir le niveau sur la page du signalement.');
            return;
        }

        setIsCreating(true);
        setError(null);
        try {
            // Le niveau est lu depuis le signalement côté serveur
            await reparationService.create(createForm.signalementId, {
                surface_m2: createForm.surface_m2,
                id_entreprise: createForm.id_entreprise ? Number(createForm.id_entreprise) : undefined,
                commentaire: createForm.commentaire || undefined,
            });
            setSuccessMessage('Réparation créée avec succès !');
            setShowCreateModal(false);
            setCreateForm({ signalementId: '', surface_m2: 10, commentaire: '', id_entreprise: '' });
            await loadReparations();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création');
        } finally {
            setIsCreating(false);
        }
    };

    // Ouvrir la modale d'édition
    const openEditModal = (reparation: ReparationListItem) => {
        setEditReparation(reparation);
        setEditForm({
            surface_m2: reparation.surface_m2,
            commentaire: reparation.description || '',
        });
    };

    // Modifier une réparation
    const handleEditReparation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editReparation) return;

        const repId = getRepId(editReparation);
        if (!repId) {
            setError('ID de réparation manquant');
            return;
        }

        setIsEditing(true);
        setError(null);
        try {
            await reparationService.update(repId, editForm);
            setSuccessMessage('Réparation modifiée avec succès ! Le budget a été recalculé.');
            setEditReparation(null);
            await loadReparations();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
        } finally {
            setIsEditing(false);
        }
    };

    const getProgressBarColor = (avancement: number) => {
        if (avancement === 0) return '#6b7280';
        if (avancement <= 50) return '#f59e0b';
        return '#10b981';
    };

    // Helper pour obtenir le status normalisé
    const getStatusValue = (rep: ReparationListItem): ReparationStatus => {
        return (rep.status_libelle || rep.status || 'nouveau') as ReparationStatus;
    };

    // Helper pour obtenir l'ID de la réparation
    const getRepId = (rep: ReparationListItem): number => {
        return rep.id_reparation || rep.id || 0;
    };

    // Helper pour obtenir l'ID du signalement
    const getSignalementId = (rep: ReparationListItem): number => {
        return rep.id_signalement || rep.Id_signalement || 0;
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="reparations-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>🔧 Gestion des Réparations</h1>
                    <p className="page-subtitle">Suivi des travaux de réparation avec calcul automatique du budget</p>
                </div>
                <div className="header-actions">
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        ➕ Nouvelle réparation
                    </Button>
                    <Link to={ROUTES.ADMIN.STATISTICS}>
                        <Button variant="secondary">📊 Statistiques</Button>
                    </Link>
                    <Link to={ROUTES.ADMIN.PRICE_CONFIG}>
                        <Button variant="secondary">💰 Config Prix</Button>
                    </Link>
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="quick-stats-grid">
                <div className="quick-stat-card" onClick={() => { setStatusFilter(''); setCurrentPage(1); }}>
                    <div className="stat-icon total">📋</div>
                    <div className="stat-info">
                        <span className="stat-number">{quickStats.total || totalItems}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
                <div className="quick-stat-card" onClick={() => { setStatusFilter('nouveau'); setCurrentPage(1); }}>
                    <div className="stat-icon nouveau">🆕</div>
                    <div className="stat-info">
                        <span className="stat-number">{quickStats.nouveau}</span>
                        <span className="stat-label">Nouveau</span>
                    </div>
                </div>
                <div className="quick-stat-card" onClick={() => { setStatusFilter('en_cours'); setCurrentPage(1); }}>
                    <div className="stat-icon en-cours">🔨</div>
                    <div className="stat-info">
                        <span className="stat-number">{quickStats.en_cours}</span>
                        <span className="stat-label">En cours</span>
                    </div>
                </div>
                <div className="quick-stat-card" onClick={() => { setStatusFilter('termine'); setCurrentPage(1); }}>
                    <div className="stat-icon termine">✅</div>
                    <div className="stat-info">
                        <span className="stat-number">{quickStats.termine}</span>
                        <span className="stat-label">Terminé</span>
                    </div>
                </div>
                <div className="quick-stat-card budget">
                    <div className="stat-icon budget">💰</div>
                    <div className="stat-info">
                        <span className="stat-number">{priceService.formatPriceSimple(quickStats.budget_total)}</span>
                        <span className="stat-label">Budget total</span>
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="alert alert-success">
                    <span>{successMessage}</span>
                    <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span>{error}</span>
                    <button className="alert-close" onClick={() => setError(null)}>×</button>
                </div>
            )}

            {/* Filtres */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Statut:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as ReparationStatus | '');
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">Tous</option>
                        <option value="nouveau">Nouveau (0%)</option>
                        <option value="en_cours">En cours (50%)</option>
                        <option value="termine">Terminé (100%)</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Niveau:</label>
                    <select
                        value={niveauFilter}
                        onChange={(e) => {
                            setNiveauFilter(e.target.value ? Number(e.target.value) : '');
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">Tous</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n} value={n}>
                                Niveau {n} ({reparationService.getNiveauLabel(n)})
                            </option>
                        ))}
                    </select>
                </div>
                <Button variant="secondary" onClick={() => {
                    setStatusFilter('');
                    setNiveauFilter('');
                    setCurrentPage(1);
                }}>
                    Réinitialiser
                </Button>
            </div>

            {/* Liste des réparations */}
            {isLoading ? (
                <div className="loading">Chargement...</div>
            ) : reparations.length === 0 ? (
                <div className="empty-state">
                    <p>Aucune réparation trouvée</p>
                </div>
            ) : (
                <>
                    <div className="reparations-table-container">
                        <table className="reparations-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Signalement</th>
                                    <th>Niveau</th>
                                    <th>Surface</th>
                                    <th>Budget</th>
                                    <th>Avancement</th>
                                    <th>Statut</th>
                                    <th>Date création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reparations.map((rep) => {
                                    const repId = getRepId(rep);
                                    const signalementId = getSignalementId(rep);
                                    const statusValue = getStatusValue(rep);
                                    return (
                                        <tr key={repId} className={`status-row-${statusValue}`}>
                                            <td>#{repId}</td>
                                            <td>
                                                <div className="signalement-cell">
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigate(`/admin/reports/${signalementId}`);
                                                        }}
                                                    >
                                                        #{signalementId}
                                                    </a>
                                                    {rep.signalement_description && (
                                                        <span className="signalement-desc">{rep.signalement_description.substring(0, 30)}...</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className="niveau-badge"
                                                    style={{ backgroundColor: reparationService.getNiveauColor(rep.niveau) }}
                                                >
                                                    {rep.niveau}
                                                </span>
                                            </td>
                                            <td>{rep.surface_m2} m²</td>
                                            <td className="budget-cell">{priceService.formatPriceSimple(rep.budget)}</td>
                                            <td>
                                                <div className="progress-container">
                                                    <div
                                                        className="progress-bar"
                                                        style={{
                                                            width: `${rep.avancement_pct}%`,
                                                            backgroundColor: getProgressBarColor(rep.avancement_pct),
                                                        }}
                                                    />
                                                    <span className="progress-text">{rep.avancement_pct}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className="status-badge"
                                                    style={{ backgroundColor: rep.status_couleur || reparationService.getStatusColor(statusValue) }}
                                                >
                                                    {reparationService.getStatusLabel(statusValue)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="date-cell">
                                                    <span>{new Date(rep.date_creation).toLocaleDateString('fr-FR')}</span>
                                                    {rep.entreprise_nom && (
                                                        <span className="entreprise-tag">🏢 {rep.entreprise_nom}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => navigate(`/admin/reparations/${repId}`)}
                                                        title="Voir détails"
                                                    >
                                                        👁️
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => openEditModal(rep)}
                                                        title="Modifier"
                                                        disabled={statusValue === 'termine'}
                                                    >
                                                        ✏️
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => openStatusModal(rep)}
                                                        title="Changer statut"
                                                        disabled={statusValue === 'termine'}
                                                    >
                                                        ⚡
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                Précédent
                            </Button>
                            <span className="page-info">
                                Page {currentPage} sur {totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                Suivant
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Modal pour changer le statut */}
            {selectedReparation && (
                <div className="modal-overlay" onClick={() => setSelectedReparation(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚡ Changer le statut</h2>
                            <button className="modal-close" onClick={() => setSelectedReparation(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-info-grid">
                                <div className="info-item">
                                    <span className="info-label">Réparation</span>
                                    <span className="info-value">#{getRepId(selectedReparation)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Niveau</span>
                                    <span className="niveau-badge" style={{ backgroundColor: reparationService.getNiveauColor(selectedReparation.niveau) }}>
                                        {selectedReparation.niveau}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Budget</span>
                                    <span className="info-value budget">{priceService.formatPriceSimple(selectedReparation.budget)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Statut actuel</span>
                                    <span className="status-badge" style={{ backgroundColor: selectedReparation.status_couleur || reparationService.getStatusColor(getStatusValue(selectedReparation)) }}>
                                        {reparationService.getStatusLabel(getStatusValue(selectedReparation))}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Nouveau statut:</label>
                                <div className="status-options">
                                    {[
                                        { value: 'nouveau', label: 'Nouveau', icon: '🆕', progress: 0 },
                                        { value: 'en_cours', label: 'En cours', icon: '🔨', progress: 50 },
                                        { value: 'termine', label: 'Terminé', icon: '✅', progress: 100 },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`status-option ${newStatus === opt.value ? 'active' : ''}`}
                                            onClick={() => setNewStatus(opt.value as ReparationStatus)}
                                        >
                                            <span className="option-icon">{opt.icon}</span>
                                            <span className="option-label">{opt.label}</span>
                                            <span className="option-progress">{opt.progress}%</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="status-info">
                                {newStatus === 'en_cours' && (
                                    <p className="info-text warning">⏱️ La date de passage en cours sera enregistrée automatiquement</p>
                                )}
                                {newStatus === 'termine' && (
                                    <p className="info-text success">✅ La date de fin sera enregistrée et l'avancement passera à 100%</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Button variant="secondary" onClick={() => setSelectedReparation(null)}>
                                Annuler
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleStatusChange}
                                isLoading={isUpdating}
                                disabled={isUpdating || newStatus === getStatusValue(selectedReparation)}
                            >
                                Confirmer le changement
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal pour créer une réparation */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Nouvelle Réparation</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateReparation}>
                            <div className="modal-body">
                                <div className="info-banner">
                                    ℹ️ Le niveau de dégradation et le budget seront calculés automatiquement à partir du signalement.
                                </div>

                                <div className="form-grid">
                                    {/* Sélection du signalement avec recherche */}
                                    <div className="form-group signalement-selector" ref={dropdownRef}>
                                        <label htmlFor="signalementSearch">Signalement *</label>
                                        <div className="signalement-search-container">
                                            <input
                                                type="text"
                                                id="signalementSearch"
                                                value={selectedSignalement ? `#${selectedSignalement.id} - ${selectedSignalement.description?.substring(0, 40)}...` : signalementSearch}
                                                onChange={(e) => {
                                                    setSignalementSearch(e.target.value);
                                                    setSelectedSignalement(null);
                                                    setCreateForm({ ...createForm, signalementId: '' });
                                                    setShowSignalementDropdown(true);
                                                }}
                                                onFocus={() => setShowSignalementDropdown(true)}
                                                placeholder="Rechercher par ID ou description..."
                                                className="signalement-search-input"
                                            />
                                            {selectedSignalement && (
                                                <button
                                                    type="button"
                                                    className="clear-selection"
                                                    onClick={() => {
                                                        setSelectedSignalement(null);
                                                        setCreateForm({ ...createForm, signalementId: '' });
                                                        setSignalementSearch('');
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>

                                        {showSignalementDropdown && !selectedSignalement && (
                                            <div className="signalement-dropdown">
                                                {isLoadingSignalements ? (
                                                    <div className="dropdown-loading">Chargement...</div>
                                                ) : filteredSignalements.length === 0 ? (
                                                    <div className="dropdown-empty">Aucun signalement trouvé</div>
                                                ) : (
                                                    filteredSignalements.slice(0, 10).map(s => (
                                                        <div
                                                            key={s.id}
                                                            className={`signalement-option ${!s.niveau ? 'no-niveau' : ''}`}
                                                            onClick={() => {
                                                                setSelectedSignalement(s);
                                                                setCreateForm({ ...createForm, signalementId: s.id.toString() });
                                                                setShowSignalementDropdown(false);
                                                            }}
                                                        >
                                                            <div className="option-main">
                                                                <span className="option-id">#{s.id}</span>
                                                                <span className="option-desc">{s.description?.substring(0, 50)}...</span>
                                                            </div>
                                                            <div className="option-meta">
                                                                {s.niveau ? (
                                                                    <span
                                                                        className="option-niveau"
                                                                        style={{ backgroundColor: reparationService.getNiveauColor(s.niveau) }}
                                                                    >
                                                                        Niv. {s.niveau}
                                                                    </span>
                                                                ) : (
                                                                    <span className="option-no-niveau">⚠️ Pas de niveau</span>
                                                                )}
                                                                <span className={`option-status status-${s.clientStatus}`}>
                                                                    {s.status.libelle}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}

                                        {selectedSignalement && (
                                            <div className="selected-signalement-info">
                                                <div className="info-row">
                                                    <span className="info-label">ID:</span>
                                                    <span className="info-value">#{selectedSignalement.id}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Statut:</span>
                                                    <span className={`status-badge-sm status-${selectedSignalement.clientStatus}`}>
                                                        {selectedSignalement.status.libelle}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Niveau:</span>
                                                    {selectedSignalement.niveau ? (
                                                        <span
                                                            className="niveau-badge-sm"
                                                            style={{ backgroundColor: reparationService.getNiveauColor(selectedSignalement.niveau) }}
                                                        >
                                                            {selectedSignalement.niveau}
                                                        </span>
                                                    ) : (
                                                        <span className="warning-text">⚠️ Non défini</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <p className="form-hint">Sélectionnez un signalement avec un niveau défini</p>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="create-surface">Surface à réparer (m²) *</label>
                                        <input
                                            type="number"
                                            id="create-surface"
                                            value={createForm.surface_m2}
                                            onChange={(e) => setCreateForm({ ...createForm, surface_m2: Number(e.target.value) })}
                                            min="1"
                                            step="1"
                                            required
                                        />
                                        <div className="quick-surface-buttons">
                                            {[5, 10, 25, 50, 100].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    className={`quick-btn ${createForm.surface_m2 === s ? 'active' : ''}`}
                                                    onClick={() => setCreateForm({ ...createForm, surface_m2: s })}
                                                >
                                                    {s}m²
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sélection de l'entreprise */}
                                    <div className="form-group full-width">
                                        <label htmlFor="create-entreprise">Entreprise assignée</label>
                                        <select
                                            id="create-entreprise"
                                            value={createForm.id_entreprise}
                                            onChange={(e) => setCreateForm({ ...createForm, id_entreprise: e.target.value ? Number(e.target.value) : '' })}
                                            className="form-select"
                                        >
                                            <option value="">-- Sélectionner une entreprise --</option>
                                            {entreprisesList.map((e) => (
                                                <option key={e.id} value={e.id}>
                                                    {e.nom} {e.telephone ? `(${e.telephone})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="form-hint">Optionnel - Vous pourrez assigner l'entreprise plus tard</p>
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="create-commentaire">Commentaire (optionnel)</label>
                                        <textarea
                                            id="create-commentaire"
                                            value={createForm.commentaire || ''}
                                            onChange={(e) => setCreateForm({ ...createForm, commentaire: e.target.value })}
                                            placeholder="Notes ou observations sur la réparation..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Aperçu du budget estimé */}
                                <div className="budget-preview">
                                    <div className="budget-preview-header">
                                        <span className="budget-label">
                                            💰 Budget estimé
                                            {selectedSignalement && selectedSignalement.niveau
                                                ? ` (niveau ${selectedSignalement.niveau})`
                                                : ' (exemple niveau 5)'}
                                        </span>
                                        <span className="budget-amount">{priceService.formatPriceSimple(calculatedBudget)}</span>
                                    </div>
                                    <div className="budget-formula">
                                        <span>{priceService.formatPriceSimple(currentPricePerM2)}</span>
                                        <span className="operator">×</span>
                                        <span>
                                            {selectedSignalement && selectedSignalement.niveau
                                                ? selectedSignalement.niveau
                                                : 'niveau'}
                                        </span>
                                        <span className="operator">×</span>
                                        <span>{createForm.surface_m2} m²</span>
                                    </div>
                                    {(!selectedSignalement || !selectedSignalement.niveau) && (
                                        <p className="budget-note">⚠️ Sélectionnez un signalement avec un niveau pour voir le budget réel</p>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                                    Annuler
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    isLoading={isCreating}
                                    disabled={isCreating || !selectedSignalement || !selectedSignalement.niveau}
                                >
                                    Créer la réparation
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal pour modifier une réparation */}
            {editReparation && (
                <div className="modal-overlay" onClick={() => setEditReparation(null)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>✏️ Modifier la Réparation #{getRepId(editReparation)}</h2>
                            <button className="modal-close" onClick={() => setEditReparation(null)}>×</button>
                        </div>
                        <form onSubmit={handleEditReparation}>
                            <div className="modal-body">
                                <div className="modal-info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Signalement</span>
                                        <span className="info-value">#{getSignalementId(editReparation)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Niveau (du signalement)</span>
                                        <span
                                            className="niveau-badge"
                                            style={{ backgroundColor: reparationService.getNiveauColor(editReparation.niveau || 1) }}
                                        >
                                            {editReparation.niveau || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Statut actuel</span>
                                        <span className="status-badge" style={{ backgroundColor: editReparation.status_couleur || reparationService.getStatusColor(getStatusValue(editReparation)) }}>
                                            {reparationService.getStatusLabel(getStatusValue(editReparation))}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Budget actuel</span>
                                        <span className="info-value budget">{priceService.formatPriceSimple(editReparation.budget)}</span>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="edit-surface">Surface à réparer (m²)</label>
                                        <input
                                            type="number"
                                            id="edit-surface"
                                            value={editForm.surface_m2 || 10}
                                            onChange={(e) => setEditForm({ ...editForm, surface_m2: Number(e.target.value) })}
                                            min="1"
                                            step="1"
                                        />
                                        <div className="quick-surface-buttons">
                                            {[5, 10, 25, 50, 100].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    className={`quick-btn ${editForm.surface_m2 === s ? 'active' : ''}`}
                                                    onClick={() => setEditForm({ ...editForm, surface_m2: s })}
                                                >
                                                    {s}m²
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="edit-commentaire">Commentaire</label>
                                        <textarea
                                            id="edit-commentaire"
                                            value={editForm.commentaire || ''}
                                            onChange={(e) => setEditForm({ ...editForm, commentaire: e.target.value })}
                                            placeholder="Notes ou observations..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Aperçu du nouveau budget */}
                                <div className="budget-preview edit-mode">
                                    <div className="budget-preview-header">
                                        <span className="budget-label">💰 Nouveau budget estimé</span>
                                        <span className="budget-amount">
                                            {priceService.formatPriceSimple(
                                                currentPricePerM2 * (editReparation.niveau || 1) * (editForm.surface_m2 || editReparation.surface_m2)
                                            )}
                                        </span>
                                    </div>
                                    {editForm.surface_m2 !== editReparation.surface_m2 && (
                                        <p className="budget-change-warning">
                                            ⚠️ Le budget sera recalculé automatiquement lors de l'enregistrement
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="secondary" type="button" onClick={() => setEditReparation(null)}>
                                    Annuler
                                </Button>
                                <Button variant="primary" type="submit" isLoading={isEditing} disabled={isEditing}>
                                    Enregistrer les modifications
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
