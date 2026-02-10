import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui';
import { PhotoGallery } from '../../../components/Report';
import {
    reparationService,
    type ReparationDetail as ReparationDetailType,
    type ReparationStatus,
    type ReparationUpdateData,
} from '../../../services/reparationService';
import { priceService } from '../../../services/priceService';
import { ROUTES } from '../../../constants';
import './Reparations.css';

const STATUS_OPTIONS: { value: ReparationStatus; label: string; progress: number; icon: string; color: string }[] = [
    { value: 'nouveau', label: 'Nouveau', progress: 0, icon: '🆕', color: '#f59e0b' },
    { value: 'en_cours', label: 'En cours', progress: 50, icon: '🔧', color: '#3b82f6' },
    { value: 'termine', label: 'Terminé', progress: 100, icon: '✅', color: '#22c55e' },
];

export function ReparationDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [reparation, setReparation] = useState<ReparationDetailType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // État pour le changement de statut
    const [selectedStatus, setSelectedStatus] = useState<ReparationStatus>('nouveau');
    const [isUpdating, setIsUpdating] = useState(false);

    // État pour l'édition
    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm, setEditForm] = useState<ReparationUpdateData>({});
    const [isEditing, setIsEditing] = useState(false);
    const [currentPricePerM2, setCurrentPricePerM2] = useState<number>(0);

    useEffect(() => {
        if (id) {
            loadReparation();
            loadCurrentPrice();
        }
    }, [id]);

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

    const loadReparation = async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await reparationService.getById(Number(id));
            setReparation(data);
            // Support both field names for API compatibility
            const status = data.status || (data.status_libelle?.toLowerCase() as ReparationStatus) || 'nouveau';
            setSelectedStatus(status);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get the reparation ID (support both id and id_reparation)
    const getRepId = (rep: ReparationDetailType): number => {
        return rep.id_reparation || rep.id || 0;
    };

    // Helper to get the signalement ID
    const getSignalementId = (rep: ReparationDetailType): number => {
        return rep.Id_signalement || 0;
    };

    // Helper to get status value
    const getStatus = (rep: ReparationDetailType): ReparationStatus => {
        if (rep.status) return rep.status;
        if (rep.status_libelle) return rep.status_libelle.toLowerCase() as ReparationStatus;
        return 'nouveau';
    };

    const handleStatusUpdate = async () => {
        if (!id || !reparation) return;

        setIsUpdating(true);
        try {
            await reparationService.updateStatus(getRepId(reparation), selectedStatus);
            setSuccessMessage('Statut mis à jour avec succès');
            await loadReparation();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadgeClass = (status: ReparationStatus) => {
        switch (status) {
            case 'nouveau': return 'status-badge nouveau';
            case 'en_cours': return 'status-badge en-cours';
            case 'termine': return 'status-badge termine';
            default: return 'status-badge';
        }
    };

    const getStatusColor = (status: ReparationStatus) => {
        const option = STATUS_OPTIONS.find(s => s.value === status);
        return option?.color || '#6b7280';
    };

    // Activer le mode édition
    const enableEditMode = () => {
        if (!reparation) return;
        setEditForm({
            surface_m2: reparation.surface_m2,
            commentaire: reparation.commentaire || reparation.description || '',
        });
        setIsEditMode(true);
    };

    // Sauvegarder les modifications
    const handleSaveEdit = async () => {
        if (!reparation) return;

        const repId = getRepId(reparation);
        if (!repId) {
            setError('ID de réparation manquant');
            return;
        }

        setIsEditing(true);
        setError(null);
        try {
            await reparationService.update(repId, editForm);
            setSuccessMessage('Réparation modifiée avec succès ! Le budget a été recalculé.');
            setIsEditMode(false);
            await loadReparation();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
        } finally {
            setIsEditing(false);
        }
    };

    // Annuler l'édition
    const cancelEdit = () => {
        setIsEditMode(false);
        setEditForm({});
    };

    const getNiveauColor = (niveau: number) => {
        if (niveau <= 2) return '#22c55e';
        if (niveau <= 4) return '#84cc16';
        if (niveau <= 6) return '#eab308';
        if (niveau <= 8) return '#f97316';
        return '#ef4444';
    };

    if (isLoading) {
        return (
            <div className="reparation-detail-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Chargement de la réparation...</p>
                </div>
            </div>
        );
    }

    if (error && !reparation) {
        return (
            <div className="reparation-detail-page">
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN.REPARATIONS)}>
                        Retour à la liste
                    </Button>
                </div>
            </div>
        );
    }

    if (!reparation) {
        return (
            <div className="reparation-detail-page">
                <div className="error-container">
                    <p>Réparation non trouvée</p>
                    <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN.REPARATIONS)}>
                        Retour à la liste
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="reparation-detail-page">
            {/* Header avec breadcrumb et actions */}
            <div className="detail-header">
                <div className="detail-breadcrumb">
                    <Link to={ROUTES.ADMIN.REPARATIONS} className="breadcrumb-link">
                        Réparations
                    </Link>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">Réparation #{getRepId(reparation)}</span>
                </div>
                <div className="detail-title-row">
                    <h1>
                        <span className="title-icon">🔧</span>
                        Réparation #{getRepId(reparation)}
                    </h1>
                    <span
                        className={getStatusBadgeClass(getStatus(reparation))}
                        style={{ backgroundColor: reparation.status_couleur || getStatusColor(getStatus(reparation)) }}
                    >
                        {reparation.status_libelle || STATUS_OPTIONS.find(s => s.value === getStatus(reparation))?.label}
                    </span>
                    {getStatus(reparation) !== 'termine' && !isEditMode && (
                        <Button variant="secondary" size="sm" onClick={enableEditMode}>
                            ✏️ Modifier
                        </Button>
                    )}
                </div>
            </div>

            {successMessage && (
                <div className="alert alert-success">
                    <span>✅ {successMessage}</span>
                    <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span>⚠️ {error}</span>
                    <button className="alert-close" onClick={() => setError(null)}>×</button>
                </div>
            )}

            {/* Mode édition */}
            {isEditMode && (
                <div className="edit-mode-panel">
                    <div className="edit-mode-header">
                        <h3>✏️ Mode édition</h3>
                        <div className="edit-mode-actions">
                            <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={isEditing}>
                                Annuler
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleSaveEdit} isLoading={isEditing}>
                                💾 Enregistrer
                            </Button>
                        </div>
                    </div>
                    <div className="edit-info-note">
                        ℹ️ Le niveau ({reparation.niveau}) est défini sur le signalement et ne peut pas être modifié ici.
                    </div>
                    <div className="edit-form-grid">
                        <div className="form-group">
                            <label>Surface (m²)</label>
                            <input
                                type="number"
                                value={editForm.surface_m2 || reparation.surface_m2}
                                onChange={(e) => setEditForm({ ...editForm, surface_m2: Number(e.target.value) })}
                                min="1"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Commentaire</label>
                            <textarea
                                value={editForm.commentaire || ''}
                                onChange={(e) => setEditForm({ ...editForm, commentaire: e.target.value })}
                                rows={2}
                                placeholder="Notes sur la réparation..."
                            />
                        </div>
                    </div>
                    <div className="edit-budget-preview">
                        <span className="label">Nouveau budget estimé :</span>
                        <span className="amount">
                            {priceService.formatPriceSimple(
                                currentPricePerM2 * (reparation.niveau || 1) * (editForm.surface_m2 || reparation.surface_m2)
                            )}
                        </span>
                        {editForm.surface_m2 !== reparation.surface_m2 && (
                            <span className="change-note">⚠️ Le budget sera recalculé</span>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Stats Bar */}
            <div className="detail-quick-stats">
                <div className="quick-stat-item">
                    <span className="stat-label">Surface</span>
                    <span className="stat-value">{reparation.surface_m2} m²</span>
                </div>
                <div className="quick-stat-item">
                    <span className="stat-label">Niveau</span>
                    <span
                        className="niveau-badge"
                        style={{ backgroundColor: getNiveauColor(reparation.niveau) }}
                    >
                        {reparation.niveau}/10
                    </span>
                </div>
                <div className="quick-stat-item">
                    <span className="stat-label">Budget</span>
                    <span className="stat-value budget">{priceService.formatPriceSimple(reparation.budget)}</span>
                </div>
                <div className="quick-stat-item">
                    <span className="stat-label">Avancement</span>
                    <div className="mini-progress">
                        <div
                            className="mini-progress-fill"
                            style={{
                                width: `${reparation.avancement_pct}%`,
                                backgroundColor: getStatusColor(getStatus(reparation))
                            }}
                        ></div>
                        <span>{reparation.avancement_pct}%</span>
                    </div>
                </div>
            </div>

            <div className="detail-grid">
                {/* Signalement lié */}
                <div className="detail-card signalement-card">
                    <h2>📍 Signalement associé</h2>
                    <div className="signalement-preview">
                        <div className="signalement-header">
                            <Link
                                to={`/admin/reports/${getSignalementId(reparation)}`}
                                className="signalement-link"
                            >
                                Signalement #{getSignalementId(reparation)}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </Link>
                        </div>
                        {reparation.signalement_description && (
                            <p className="signalement-description">
                                {reparation.signalement_description}
                            </p>
                        )}
                        {reparation.latitude && reparation.longitude && (
                            <div className="signalement-location">
                                <span className="location-icon">📍</span>
                                <span>{reparation.latitude.toFixed(6)}, {reparation.longitude.toFixed(6)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Entreprise assignée */}
                <div className="detail-card entreprise-card">
                    <h2>🏢 Entreprise assignée</h2>
                    {reparation.entreprise_nom ? (
                        <div className="entreprise-detail">
                            <div className="entreprise-name-row">
                                <span className="entreprise-name">{reparation.entreprise_nom}</span>
                            </div>
                            <div className="contact-grid">
                                {reparation.entreprise_tel && (
                                    <a href={`tel:${reparation.entreprise_tel}`} className="contact-item phone">
                                        <span className="contact-icon">📞</span>
                                        <span>{reparation.entreprise_tel}</span>
                                    </a>
                                )}
                                {reparation.entreprise_email && (
                                    <a href={`mailto:${reparation.entreprise_email}`} className="contact-item email">
                                        <span className="contact-icon">✉️</span>
                                        <span>{reparation.entreprise_email}</span>
                                    </a>
                                )}
                            </div>
                            {reparation.manager_nom && (
                                <div className="manager-info">
                                    <span className="manager-label">Manager :</span>
                                    <span className="manager-name">{reparation.manager_nom}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="no-entreprise">
                            <span className="no-data-icon">⚠️</span>
                            <p>Aucune entreprise assignée</p>
                            <Button variant="secondary" size="sm">
                                Assigner une entreprise
                            </Button>
                        </div>
                    )}
                </div>

                {/* Budget détaillé */}
                <div className="detail-card budget-card">
                    <h2>💰 Détail du budget</h2>
                    <div className="budget-breakdown">
                        <div className="budget-total">
                            <span className="budget-value">
                                {priceService.formatPriceSimple(reparation.budget)}
                            </span>
                        </div>
                        <div className="budget-formula-detail">
                            <div className="formula-row">
                                <span className="formula-label">Formule :</span>
                                <span className="formula-value">Prix/m² × Niveau × Surface</span>
                            </div>
                            <div className="formula-calculation">
                                <span className="formula-item">
                                    {reparation.prix_applique
                                        ? priceService.formatPriceSimple(reparation.prix_applique)
                                        : 'Prix/m²'}
                                </span>
                                <span className="formula-operator">×</span>
                                <span className="formula-item">{reparation.niveau}</span>
                                <span className="formula-operator">×</span>
                                <span className="formula-item">{reparation.surface_m2} m²</span>
                            </div>
                        </div>
                        {reparation.prix_applique && (
                            <div className="prix-info">
                                <span className="prix-label">Prix au m² appliqué :</span>
                                <span className="prix-value">{priceService.formatPriceSimple(reparation.prix_applique)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline / Dates */}
                <div className="detail-card timeline-card">
                    <h2>📅 Historique</h2>
                    <div className="timeline">
                        <div className="timeline-item completed">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <span className="timeline-date">
                                    {new Date(reparation.date_creation).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                                <span className="timeline-label">Création de la réparation</span>
                            </div>
                        </div>
                        <div className={`timeline-item ${reparation.date_passage_en_cours ? 'completed' : 'pending'}`}>
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                {reparation.date_passage_en_cours ? (
                                    <>
                                        <span className="timeline-date">
                                            {new Date(reparation.date_passage_en_cours).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <span className="timeline-label">Travaux commencés</span>
                                    </>
                                ) : (
                                    <span className="timeline-label pending-label">En attente de démarrage</span>
                                )}
                            </div>
                        </div>
                        <div className={`timeline-item ${reparation.date_termine ? 'completed' : 'pending'}`}>
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                {reparation.date_termine ? (
                                    <>
                                        <span className="timeline-date">
                                            {new Date(reparation.date_termine).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <span className="timeline-label">Travaux terminés</span>
                                    </>
                                ) : (
                                    <span className="timeline-label pending-label">À compléter</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Changer le statut */}
                <div className="detail-card status-update-card">
                    <h2>🔄 Changer le statut</h2>
                    <div className="status-options-grid">
                        {STATUS_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`status-option-btn ${selectedStatus === option.value ? 'selected' : ''} ${getStatus(reparation) === option.value ? 'current' : ''}`}
                                onClick={() => setSelectedStatus(option.value)}
                                style={{
                                    '--status-color': option.color,
                                    borderColor: selectedStatus === option.value ? option.color : undefined
                                } as React.CSSProperties}
                            >
                                <span className="status-icon">{option.icon}</span>
                                <span className="status-name">{option.label}</span>
                                <span className="status-progress">{option.progress}%</span>
                                {getStatus(reparation) === option.value && (
                                    <span className="current-badge">Actuel</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleStatusUpdate}
                        isLoading={isUpdating}
                        disabled={selectedStatus === getStatus(reparation)}
                        className="update-status-btn"
                    >
                        {selectedStatus === getStatus(reparation)
                            ? 'Statut actuel'
                            : `Passer en "${STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}"`
                        }
                    </Button>
                </div>

                {/* Description */}
                {reparation.description && (
                    <div className="detail-card description-card">
                        <h2>📝 Notes</h2>
                        <p className="description-text">{reparation.description}</p>
                    </div>
                )}

                {/* Photos du signalement associé */}
                <div className="detail-card photos-card">
                    <h2>📷 Photos du signalement</h2>
                    <PhotoGallery
                        signalementId={getSignalementId(reparation)}
                        editable={false}
                    />
                </div>
            </div>
        </div>
    );
}
