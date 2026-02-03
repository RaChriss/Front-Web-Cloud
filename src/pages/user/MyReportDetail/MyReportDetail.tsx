import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import type { Report, ReportStatus } from '../../../types/report.types';
import '../../../assets/styles/pages/MyReportDetail.css';

const STATUS_COLORS: Record<ReportStatus, string> = {
    new: 'status-new',
    in_progress: 'status-progress',
    completed: 'status-completed',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
    new: 'Nouveau',
    in_progress: 'En cours',
    completed: 'Terminé',
};

export function MyReportDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReport = async () => {
            if (!id || id === '0') {
                setError('ID de signalement invalide');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await reportService.getReport(id);
                setReport(response);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
            } finally {
                setIsLoading(false);
            }
        };

        loadReport();
    }, [id]);

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('fr-MG', {
            style: 'currency',
            currency: 'MGA',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="my-report-detail-loading">
                <div className="loader"></div>
                <p>Chargement du signalement...</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="my-report-detail-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h2>Erreur</h2>
                <p>{error || 'Signalement introuvable'}</p>
                <button onClick={() => navigate('/my-reports')} className="btn-back">
                    Retour à mes signalements
                </button>
            </div>
        );
    }

    return (
        <div className="my-report-detail-page">
            <header className="detail-header">
                <Link to="/my-reports" className="back-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Retour
                </Link>
                <span className={`status-badge ${STATUS_COLORS[report.clientStatus]}`}>
                    {STATUS_LABELS[report.clientStatus]}
                </span>
            </header>

            <div className="detail-content">
                <div className="detail-main">
                    <h1 className="detail-title">Signalement #{report.id}</h1>

                    <div className="detail-section">
                        <h2>Description</h2>
                        <p className="description-text">{report.description || 'Aucune description'}</p>
                    </div>

                    <div className="detail-section">
                        <h2>Localisation</h2>
                        <div className="location-info">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h2>Date de signalement</h2>
                        <div className="date-info">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>{formatDate(report.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {report.reparation && (
                    <div className="detail-sidebar">
                        <div className="repair-card">
                            <h2>Informations de réparation</h2>

                            <div className="repair-item">
                                <span className="repair-label">Entreprise</span>
                                <span className="repair-value">{report.reparation.entreprise_nom || '-'}</span>
                            </div>

                            <div className="repair-item">
                                <span className="repair-label">Surface</span>
                                <span className="repair-value">
                                    {report.reparation.surface_m2 ? `${report.reparation.surface_m2} m²` : '-'}
                                </span>
                            </div>

                            <div className="repair-item">
                                <span className="repair-label">Budget</span>
                                <span className="repair-value">{formatCurrency(report.reparation.budget)}</span>
                            </div>

                            {report.reparation.date_debut && (
                                <div className="repair-item">
                                    <span className="repair-label">Date de début</span>
                                    <span className="repair-value">
                                        {new Date(report.reparation.date_debut).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            )}

                            {report.reparation.date_fin_prevue && (
                                <div className="repair-item">
                                    <span className="repair-label">Date de fin prévue</span>
                                    <span className="repair-value">
                                        {new Date(report.reparation.date_fin_prevue).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            )}

                            {report.reparation.commentaire && (
                                <div className="repair-item">
                                    <span className="repair-label">Commentaire</span>
                                    <span className="repair-value comment">{report.reparation.commentaire}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
