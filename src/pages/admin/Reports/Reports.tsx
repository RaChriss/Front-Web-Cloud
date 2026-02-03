import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { reportService } from '../../../services/reportService';
import type { Report, ReportStatus } from '../../../types/report.types';
import { STATUS_REVERSE_MAP } from '../../../types/report.types';
import { ROUTES } from '../../../constants';
import '../../../assets/styles/pages/Reports.css';

const STATUS_COLORS: Record<ReportStatus, string> = {
    new: 'status-new',
    in_progress: 'status-progress',
    completed: 'status-completed',
};

export function Reports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Utiliser getManagerReports pour les managers
            const response = await reportService.getManagerReports();
            let filteredReports = response.reports;

            // Filtrer par statut côté client
            if (statusFilter !== 'all') {
                filteredReports = filteredReports.filter(r => r.clientStatus === statusFilter);
            }

            // Filtrer par recherche côté client
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                filteredReports = filteredReports.filter(r =>
                    r.description.toLowerCase().includes(search)
                );
            }

            setReports(filteredReports);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, searchTerm]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleStatusChange = async (reportId: number, newStatus: ReportStatus) => {
        try {
            const id_status = STATUS_REVERSE_MAP[newStatus];
            await reportService.updateStatus(reportId, { id_status });
            setSuccessMessage('Statut mis à jour avec succès');
            fetchReports();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        }
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('fr-MG', {
            style: 'currency',
            currency: 'MGA',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div className="reports-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>Gestion des Signalements</h1>
                    <p className="page-subtitle">Gérer les informations et statuts des signalements</p>
                </div>
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

            {/* Filtres */}
            <div className="filters-bar">
                <div className="search-box">
                    <Input
                        id="search"
                        name="search"
                        type="text"
                        label=""
                        placeholder="Rechercher un signalement..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        }
                    />
                </div>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        Tous
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'new' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('new')}
                    >
                        Nouveaux
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('in_progress')}
                    >
                        En cours
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('completed')}
                    >
                        Terminés
                    </button>
                </div>
            </div>

            {/* Tableau des signalements */}
            <div className="reports-card">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Chargement des signalements...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p>Aucun signalement trouvé</p>
                    </div>
                ) : (
                    <div className="reports-table-container">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Signalement</th>
                                    <th>Date</th>
                                    <th>Surface (m²)</th>
                                    <th>Budget</th>
                                    <th>Entreprise</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report, index) => (
                                    <tr key={report.id ? `report-${report.id}` : `report-idx-${index}`}>
                                        <td>
                                            <div className="report-info">
                                                <span className="report-description">{report.description || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="date-cell">{formatDate(report.createdAt)}</td>
                                        <td>{report.reparation?.surface_m2 ? `${report.reparation.surface_m2} m²` : '-'}</td>
                                        <td>{formatCurrency(report.reparation?.budget)}</td>
                                        <td>{report.reparation?.entreprise_nom || '-'}</td>
                                        <td>
                                            <select
                                                className={`status-select ${STATUS_COLORS[report.clientStatus] || ''}`}
                                                value={report.clientStatus || 'new'}
                                                onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                                            >
                                                <option value="new">Nouveau</option>
                                                <option value="in_progress">En cours</option>
                                                <option value="completed">Terminé</option>
                                            </select>
                                        </td>
                                        <td>
                                            <Link to={ROUTES.ADMIN.REPORT_DETAIL.replace(':id', String(report.id ?? ''))}>
                                                <Button variant="secondary" size="sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                    Modifier
                                                </Button>
                                            </Link>
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
