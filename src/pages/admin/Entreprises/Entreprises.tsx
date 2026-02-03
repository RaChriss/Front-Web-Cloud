import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '../../../components/ui';
import { reportService } from '../../../services/reportService';
import type { EntrepriseConfig, EntrepriseFormData } from '../../../types/report.types';
import '../../../assets/styles/pages/Entreprises.css';

export function Entreprises() {
    const [entreprises, setEntreprises] = useState<EntrepriseConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingEntreprise, setEditingEntreprise] = useState<EntrepriseConfig | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState<EntrepriseFormData>({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
    });

    const fetchEntreprises = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await reportService.getEntreprises();
            setEntreprises(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEntreprises();
    }, [fetchEntreprises]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setEditingEntreprise(null);
        setFormData({ nom: '', telephone: '', email: '', adresse: '' });
        setShowModal(true);
    };

    const openEditModal = (entreprise: EntrepriseConfig) => {
        setEditingEntreprise(entreprise);
        setFormData({
            nom: entreprise.nom,
            telephone: entreprise.telephone || '',
            email: entreprise.email || '',
            adresse: entreprise.adresse || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEntreprise(null);
        setFormData({ nom: '', telephone: '', email: '', adresse: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nom.trim()) {
            setError('Le nom de l\'entreprise est obligatoire');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            if (editingEntreprise) {
                await reportService.updateEntreprise(editingEntreprise.id, formData);
                setSuccessMessage('Entreprise modifiée avec succès');
            } else {
                await reportService.createEntreprise(formData);
                setSuccessMessage('Entreprise créée avec succès');
            }
            closeModal();
            fetchEntreprises();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsSaving(true);
        setError(null);

        try {
            await reportService.deleteEntreprise(id);
            setSuccessMessage('Entreprise supprimée avec succès');
            setShowDeleteConfirm(null);
            fetchEntreprises();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="entreprises-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>Gestion des Entreprises</h1>
                    <p className="page-subtitle">Gérer les entreprises de réparation</p>
                </div>
                <Button variant="primary" onClick={openCreateModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nouvelle entreprise
                </Button>
            </div>

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

            {/* Liste des entreprises */}
            <div className="entreprises-card">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement des entreprises...</p>
                    </div>
                ) : entreprises.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <p>Aucune entreprise enregistrée</p>
                        <Button variant="primary" onClick={openCreateModal}>
                            Créer une entreprise
                        </Button>
                    </div>
                ) : (
                    <div className="entreprises-grid">
                        {entreprises.map((entreprise) => (
                            <div key={entreprise.id} className="entreprise-item">
                                <div className="entreprise-info">
                                    <h3>{entreprise.nom}</h3>
                                    {entreprise.telephone && (
                                        <p className="entreprise-detail">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                            {entreprise.telephone}
                                        </p>
                                    )}
                                    {entreprise.email && (
                                        <p className="entreprise-detail">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                            {entreprise.email}
                                        </p>
                                    )}
                                    {entreprise.adresse && (
                                        <p className="entreprise-detail">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {entreprise.adresse}
                                        </p>
                                    )}
                                </div>
                                <div className="entreprise-actions">
                                    <Button variant="secondary" size="sm" onClick={() => openEditModal(entreprise)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Modifier
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(entreprise.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Supprimer
                                    </Button>
                                </div>

                                {/* Confirmation de suppression */}
                                {showDeleteConfirm === entreprise.id && (
                                    <div className="delete-confirm">
                                        <p>Supprimer cette entreprise ?</p>
                                        <div className="confirm-actions">
                                            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(null)}>
                                                Annuler
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(entreprise.id)} isLoading={isSaving}>
                                                Confirmer
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de création/modification */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingEntreprise ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <Input
                                    id="nom"
                                    name="nom"
                                    type="text"
                                    label="Nom de l'entreprise *"
                                    value={formData.nom}
                                    onChange={handleFormChange}
                                    placeholder="Ex: Entreprise XYZ"
                                />
                            </div>
                            <div className="form-group">
                                <Input
                                    id="telephone"
                                    name="telephone"
                                    type="tel"
                                    label="Téléphone"
                                    value={formData.telephone || ''}
                                    onChange={handleFormChange}
                                    placeholder="+261 34 00 000 00"
                                />
                            </div>
                            <div className="form-group">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    label="Email"
                                    value={formData.email || ''}
                                    onChange={handleFormChange}
                                    placeholder="contact@entreprise.mg"
                                />
                            </div>
                            <div className="form-group">
                                <Input
                                    id="adresse"
                                    name="adresse"
                                    type="text"
                                    label="Adresse"
                                    value={formData.adresse || ''}
                                    onChange={handleFormChange}
                                    placeholder="Antananarivo, Madagascar"
                                />
                            </div>
                            <div className="modal-actions">
                                <Button variant="secondary" type="button" onClick={closeModal} disabled={isSaving}>
                                    Annuler
                                </Button>
                                <Button variant="primary" type="submit" isLoading={isSaving}>
                                    {editingEntreprise ? 'Enregistrer' : 'Créer'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
