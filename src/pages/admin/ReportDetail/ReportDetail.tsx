import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { reportService } from '../../../services/reportService';
import type { Report, ReportStatus, EntrepriseConfig, GestionCompleteData, ManagerReportUpdateData, StatusUpdateData, HistoriqueEntry } from '../../../types/report.types';
import { STATUS_REVERSE_MAP } from '../../../types/report.types';
import { ROUTES } from '../../../constants';
import '../../../assets/styles/pages/ReportDetail.css';

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
    { value: 'new', label: 'Nouveau' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
];

export function ReportDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<Report | null>(null);
    const [entreprises, setEntreprises] = useState<EntrepriseConfig[]>([]);
    const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form state pour le statut
    const [selectedStatus, setSelectedStatus] = useState<ReportStatus>('new');
    const [statusComment, setStatusComment] = useState('');

    // Form state pour la gestion complète (réparation)
    const [gestionData, setGestionData] = useState<GestionCompleteData>({
        id_entreprise: undefined,
        budget: undefined,
        surface_m2: undefined,
        date_debut: '',
        date_fin_prevue: '',
        commentaire: '',
    });

    // Form state pour la modification du signalement (manager)
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<ManagerReportUpdateData>({
        description: '',
        latitude: undefined,
        longitude: undefined,
    });

    useEffect(() => {
        const fetchData = async () => {
            // Valider que l'ID est présent et valide (pas 0, pas vide)
            if (!id || id === '0' || id === '') {
                setError('ID de signalement invalide');
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                // Charger le signalement
                const data = await reportService.getReport(id);
                setReport(data);
                setSelectedStatus(data.clientStatus);

                // Initialiser les données d'édition
                setEditData({
                    description: data.description || '',
                    latitude: data.latitude,
                    longitude: data.longitude,
                });

                // Charger les données de réparation existantes
                if (data.reparation) {
                    setGestionData({
                        surface_m2: data.reparation.surface_m2 || undefined,
                        budget: data.reparation.budget || undefined,
                        id_entreprise: data.reparation.id_entreprise || undefined,
                        date_debut: data.reparation.date_debut?.split('T')[0] || '',
                        date_fin_prevue: data.reparation.date_fin_prevue?.split('T')[0] || '',
                        commentaire: data.reparation.commentaire || '',
                    });
                }

                // Charger les entreprises
                try {
                    const entreprisesData = await reportService.getEntreprises();
                    setEntreprises(entreprisesData);
                } catch {
                    console.log('Impossible de charger les entreprises');
                }

                // Charger l'historique
                try {
                    const historiqueData = await reportService.getHistorique(id);
                    setHistorique(historiqueData);
                } catch {
                    console.log('Impossible de charger l\'historique');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleGestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setGestionData((prev) => ({
            ...prev,
            [name]: name === 'surface_m2' || name === 'budget' || name === 'id_entreprise'
                ? (value ? parseFloat(value) : undefined)
                : value,
        }));
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData((prev) => ({
            ...prev,
            [name]: name === 'latitude' || name === 'longitude'
                ? (value ? parseFloat(value) : undefined)
                : value,
        }));
    };

    // Gestion complète - tout en un
    const handleSaveGestionComplete = async () => {
        if (!id) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Filtrer les champs vides
            const dataToSend: GestionCompleteData = {};
            if (gestionData.id_entreprise) dataToSend.id_entreprise = gestionData.id_entreprise;
            if (gestionData.budget !== undefined && gestionData.budget > 0) dataToSend.budget = gestionData.budget;
            if (gestionData.surface_m2 !== undefined && gestionData.surface_m2 > 0) dataToSend.surface_m2 = gestionData.surface_m2;
            if (gestionData.date_debut) dataToSend.date_debut = gestionData.date_debut;
            if (gestionData.date_fin_prevue) dataToSend.date_fin_prevue = gestionData.date_fin_prevue;
            if (gestionData.commentaire) dataToSend.commentaire = gestionData.commentaire;

            await reportService.gestionComplete(id, dataToSend);
            setSuccessMessage('Gestion mise à jour avec succès');

            // Recharger le signalement
            const data = await reportService.getReport(id);
            setReport(data);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!id) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const statusData: StatusUpdateData = {
                id_status: STATUS_REVERSE_MAP[selectedStatus],
                commentaire: statusComment || undefined,
            };
            await reportService.updateStatus(id, statusData);
            setSuccessMessage('Statut mis à jour avec succès');
            setStatusComment('');

            // Recharger les données
            const data = await reportService.getReport(id);
            setReport(data);
            const historiqueData = await reportService.getHistorique(id);
            setHistorique(historiqueData);

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally {
            setIsSaving(false);
        }
    };

    // Modifier le signalement (manager)
    const handleManagerUpdate = async () => {
        if (!id) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const dataToSend: ManagerReportUpdateData = {};
            if (editData.description && editData.description !== report?.description) {
                dataToSend.description = editData.description;
            }
            if (editData.latitude !== undefined && editData.latitude !== report?.latitude) {
                dataToSend.latitude = editData.latitude;
            }
            if (editData.longitude !== undefined && editData.longitude !== report?.longitude) {
                dataToSend.longitude = editData.longitude;
            }

            if (Object.keys(dataToSend).length === 0) {
                setError('Aucune modification détectée');
                setIsSaving(false);
                return;
            }

            await reportService.managerUpdateReport(id, dataToSend);
            setSuccessMessage('Signalement modifié avec succès');
            setEditMode(false);

            // Recharger les données
            const data = await reportService.getReport(id);
            setReport(data);

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
        } finally {
            setIsSaving(false);
        }
    };

    // Supprimer le signalement (manager)
    const handleDelete = async () => {
        if (!id) return;

        setIsDeleting(true);
        setError(null);

        try {
            await reportService.managerDeleteReport(id);
            navigate(ROUTES.ADMIN.REPORTS, {
                state: { message: 'Signalement supprimé avec succès' }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="report-detail-page">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Chargement du signalement...</p>
                </div>
            </div>
        );
    }

    if (error && !report) {
        return (
            <div className="report-detail-page">
                <div className="error-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p>{error}</p>
                    <Link to={ROUTES.ADMIN.REPORTS}>
                        <Button variant="secondary">Retour à la liste</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="report-detail-page">
            <div className="page-header">
                <Link to={ROUTES.ADMIN.REPORTS} className="back-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Retour aux signalements
                </Link>
                <div className="header-title-row">
                    <div>
                        <h1>Gérer le signalement #{report?.id}</h1>
                        <p className="page-subtitle">{report?.description?.substring(0, 100)}{report?.description && report.description.length > 100 ? '...' : ''}</p>
                    </div>
                    <div className="header-actions">
                        <Button
                            variant="secondary"
                            onClick={() => setEditMode(!editMode)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            {editMode ? 'Annuler' : 'Modifier'}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Supprimer
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal de confirmation de suppression */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirmer la suppression</h3>
                        <p>Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible et supprimera également l'historique et les réparations associées.</p>
                        <div className="modal-actions">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                isLoading={isDeleting}
                            >
                                Supprimer définitivement
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>{successMessage}</span>
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

            <div className="detail-grid">
                {/* Informations générales / Mode édition */}
                <div className="detail-card info-card">
                    <h2>{editMode ? 'Modifier le signalement' : 'Informations'}</h2>
                    {editMode ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={editData.description || ''}
                                    onChange={handleEditChange}
                                    className="form-textarea"
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Description du signalement..."
                                />
                                <small>{editData.description?.length || 0}/500 caractères</small>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <Input
                                        id="latitude"
                                        name="latitude"
                                        type="number"
                                        label="Latitude"
                                        value={editData.latitude?.toString() || ''}
                                        onChange={handleEditChange}
                                        placeholder="-18.8792"
                                    />
                                </div>
                                <div className="form-group">
                                    <Input
                                        id="longitude"
                                        name="longitude"
                                        type="number"
                                        label="Longitude"
                                        value={editData.longitude?.toString() || ''}
                                        onChange={handleEditChange}
                                        placeholder="47.5079"
                                    />
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleManagerUpdate}
                                isLoading={isSaving}
                            >
                                Enregistrer les modifications
                            </Button>
                        </div>
                    ) : (
                        <div className="info-list">
                            <div className="info-item">
                                <span className="info-label">ID</span>
                                <span className="info-value">#{report?.id}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Créé le</span>
                                <span className="info-value">{report && formatDate(report.createdAt)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Signalé par</span>
                                <span className="info-value">{report?.signaleParNom || '-'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Coordonnées</span>
                                <span className="info-value">
                                    {report?.latitude?.toFixed(6)}, {report?.longitude?.toFixed(6)}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Description</span>
                                <span className="info-value description-text">{report?.description}</span>
                            </div>
                            {report?.reparation && (
                                <>
                                    <div className="info-divider"></div>
                                    <div className="info-item">
                                        <span className="info-label">Surface</span>
                                        <span className="info-value">{report.reparation.surface_m2 ? `${report.reparation.surface_m2} m²` : '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Budget</span>
                                        <span className="info-value">{report.reparation.budget ? `${report.reparation.budget.toLocaleString('fr-FR')} MGA` : '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Entreprise</span>
                                        <span className="info-value">{report.reparation.entreprise_nom || '-'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Formulaire de statut */}
                <div className="detail-card form-card">
                    <h2>Modifier le statut</h2>
                    <div className="form-group">
                        <label htmlFor="status">Statut</label>
                        <select
                            id="status"
                            name="status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                            className="form-select"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="statusComment">Commentaire (optionnel)</label>
                        <textarea
                            id="statusComment"
                            name="statusComment"
                            value={statusComment}
                            onChange={(e) => setStatusComment(e.target.value)}
                            className="form-textarea"
                            rows={2}
                            placeholder="Ajouter un commentaire sur le changement de statut..."
                        />
                    </div>

                    <Button
                        variant="primary"
                        onClick={handleUpdateStatus}
                        isLoading={isSaving}
                    >
                        Mettre à jour le statut
                    </Button>
                </div>

                {/* Formulaire de gestion complète (réparation) */}
                <div className="detail-card form-card gestion-card">
                    <h2>Gestion de la réparation</h2>
                    <p className="card-subtitle">Gérer l'entreprise, le budget, la surface et les dates</p>

                    <div className="form-group">
                        <label htmlFor="id_entreprise">Entreprise assignée</label>
                        <select
                            id="id_entreprise"
                            name="id_entreprise"
                            value={gestionData.id_entreprise || ''}
                            onChange={handleGestionChange}
                            className="form-select"
                        >
                            <option value="">-- Sélectionner une entreprise --</option>
                            {entreprises.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.nom} {e.telephone ? `(${e.telephone})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <Input
                                id="surface_m2"
                                name="surface_m2"
                                type="number"
                                label="Surface (m²)"
                                value={gestionData.surface_m2?.toString() || ''}
                                onChange={handleGestionChange}
                                placeholder="Ex: 25.5"
                            />
                        </div>
                        <div className="form-group">
                            <Input
                                id="budget"
                                name="budget"
                                type="number"
                                label="Budget (Ariary)"
                                value={gestionData.budget?.toString() || ''}
                                onChange={handleGestionChange}
                                placeholder="Ex: 1500000"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <Input
                                id="date_debut"
                                name="date_debut"
                                type="date"
                                label="Date de début"
                                value={gestionData.date_debut || ''}
                                onChange={handleGestionChange}
                            />
                        </div>
                        <div className="form-group">
                            <Input
                                id="date_fin_prevue"
                                name="date_fin_prevue"
                                type="date"
                                label="Date de fin prévue"
                                value={gestionData.date_fin_prevue || ''}
                                onChange={handleGestionChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="commentaire">Commentaire</label>
                        <textarea
                            id="commentaire"
                            name="commentaire"
                            value={gestionData.commentaire || ''}
                            onChange={handleGestionChange}
                            className="form-textarea"
                            rows={3}
                            placeholder="Commentaire sur la réparation..."
                        />
                    </div>

                    <Button
                        variant="primary"
                        onClick={handleSaveGestionComplete}
                        isLoading={isSaving}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        Enregistrer la gestion
                    </Button>
                </div>

                {/* Historique */}
                {historique.length > 0 && (
                    <div className="detail-card historique-card">
                        <h2>Historique des modifications</h2>
                        <div className="historique-list">
                            {historique.map((entry) => (
                                <div key={entry.id} className="historique-item">
                                    <div className="historique-date">
                                        {new Date(entry.date_modification).toLocaleString('fr-FR')}
                                    </div>
                                    <div className="historique-content">
                                        {entry.ancien_statut && entry.nouveau_statut && (
                                            <span className="historique-status">
                                                {entry.ancien_statut} → {entry.nouveau_statut}
                                            </span>
                                        )}
                                        {entry.commentaire && (
                                            <span className="historique-comment">{entry.commentaire}</span>
                                        )}
                                        {entry.user_name && (
                                            <span className="historique-user">par {entry.user_name}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
