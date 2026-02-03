import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts';
import { reportService } from '../../../services/reportService';
import type { Report, ReportStatus } from '../../../types/report.types';
import '../../../assets/styles/pages/MyReports.css';

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

export function MyReports() {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMyReports = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await reportService.getMyReports();
            setReports(response.reports);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMyReports();
    }, [loadMyReports]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="my-reports-loading">
                <div className="loader"></div>
                <p>Chargement de vos signalements...</p>
            </div>
        );
    }

    return (
        <div className="my-reports-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>Mes signalements</h1>
                    <p className="header-subtitle">
                        {user?.display_name} • {reports.length} signalement{reports.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link to="/dashboard" className="btn-add-report">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Nouveau signalement
                </Link>
            </header>

            {error && (
                <div className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error}
                </div>
            )}

            {reports.length === 0 ? (
                <div className="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <h3>Aucun signalement</h3>
                    <p>Vous n'avez pas encore créé de signalement.</p>
                    <Link to="/dashboard" className="btn-primary">
                        Signaler un problème
                    </Link>
                </div>
            ) : (
                <div className="reports-list">
                    {reports.map((report) => (
                        <Link
                            to={`/my-reports/${report.id}`}
                            key={report.id}
                            className="report-list-item"
                        >
                            <div className="report-list-content">
                                <div className="report-list-main">
                                    <h3 className="report-list-title">{report.description || 'Sans description'}</h3>
                                    <div className="report-list-meta">
                                        <span className="meta-date">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            {formatDate(report.createdAt)}
                                        </span>
                                        <span className="meta-location">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                                <div className="report-list-right">
                                    <span className={`status-badge ${STATUS_COLORS[report.clientStatus]}`}>
                                        {STATUS_LABELS[report.clientStatus]}
                                    </span>
                                    <svg className="chevron-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
