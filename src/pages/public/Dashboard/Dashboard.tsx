import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapView } from '../../../components/Map';
import type { NewReportLocation } from '../../../components/Map';
import { ReportForm } from '../../../components/Report';
import { StatsCard } from '../../../components/Stats';
import { Button } from '../../../components/ui';
import { useAuth } from '../../../contexts';
import { reportService } from '../../../services/reportService';
import type { Report, ReportSummary, ReportFormData } from '../../../types/report.types';
import { ROUTES } from '../../../constants';
import '../../../assets/styles/pages/Dashboard.css';

export function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [allReports, setAllReports] = useState<Report[]>([]);
    const [myReports, setMyReports] = useState<Report[]>([]);
    const [summary, setSummary] = useState<ReportSummary>({
        totalReports: 0,
        totalSurface: 0,
        totalBudget: 0,
        progressPercentage: 0,
        newCount: 0,
        inProgressCount: 0,
        completedCount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showMyReportsOnly, setShowMyReportsOnly] = useState(false);

    // Mode création de signalement
    const [isCreationMode, setIsCreationMode] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<NewReportLocation | null>(null);
    const [showReportForm, setShowReportForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // L'utilisateur peut créer des signalements s'il est connecté (type 2 ou 3)
    const canCreateReport = user && (user.type_user === 2 || user.type_user === 3);

    // Charger les signalements depuis l'API
    const loadReports = useCallback(async () => {
        setIsLoading(true);
        try {
            // Charger tous les signalements
            const response = await reportService.getReports();
            setAllReports(response.reports);

            // Charger les statistiques
            try {
                const statsData = await reportService.getSummary();
                setSummary(statsData);
            } catch {
                // Calculer les stats localement si l'API échoue
                const reports = response.reports;
                const newCount = reports.filter(r => r.clientStatus === 'new').length;
                const inProgressCount = reports.filter(r => r.clientStatus === 'in_progress').length;
                const completedCount = reports.filter(r => r.clientStatus === 'completed').length;
                const totalSurface = reports.reduce((sum, r) => sum + (r.reparation?.surface_m2 || 0), 0);
                const totalBudget = reports.reduce((sum, r) => sum + (r.reparation?.budget || 0), 0);
                const total = reports.length || 1;

                setSummary({
                    totalReports: reports.length,
                    totalSurface,
                    totalBudget,
                    progressPercentage: Math.round((completedCount / total) * 100),
                    newCount,
                    inProgressCount,
                    completedCount,
                });
            }

            // Charger mes signalements si connecté
            if (user) {
                try {
                    const myResponse = await reportService.getMyReports();
                    setMyReports(myResponse.reports);
                } catch {
                    setMyReports([]);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des signalements:', error);
            setAllReports([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    // Signalements à afficher selon le filtre
    const displayedReports = showMyReportsOnly ? myReports : allReports;

    const handleLocationSelect = useCallback((location: NewReportLocation) => {
        setPendingLocation(location);
        setShowReportForm(true);
    }, []);

    // Handler pour le clic sur un signalement dans la carte
    const handleReportClick = useCallback((report: Report) => {
        // Naviguer vers la page de détail du signalement
        // Les utilisateurs connectés vont vers la page admin, les autres vers le dashboard avec modal
        if (user && user.type_user === 3) {
            // Manager → page admin de détail
            navigate(ROUTES.ADMIN.REPORT_DETAIL.replace(':id', report.id.toString()));
        } else if (user && user.type_user === 2) {
            // Utilisateur connecté → page utilisateur
            navigate(`/user/signalement/${report.id}`);
        } else {
            // Non connecté → modal ou simplement les infos dans le popup suffisent
            // Pour l'instant, ne rien faire ou afficher une alerte
            console.log('Détails du signalement:', report);
        }
    }, [navigate, user]);

    const handleCreateReport = async (data: ReportFormData) => {
        setIsSubmitting(true);
        try {
            await reportService.createReport(data);
            setShowReportForm(false);
            setPendingLocation(null);
            setIsCreationMode(false);
            setSuccessMessage('Signalement créé avec succès !');
            await loadReports();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelCreate = () => {
        setShowReportForm(false);
        setPendingLocation(null);
    };

    const toggleCreationMode = () => {
        if (isCreationMode) {
            setIsCreationMode(false);
            setPendingLocation(null);
        } else {
            setIsCreationMode(true);
        }
    };

    if (isLoading) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p>Chargement des données...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {successMessage && (
                <div className="success-toast">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    {successMessage}
                </div>
            )}

            <header className="dashboard-header">
                <div className="header-content">
                    <h1 className="dashboard-title">Tableau de bord</h1>
                    <p className="dashboard-subtitle">
                        Suivi des signalements routiers à Antananarivo
                    </p>
                </div>
                <div className="header-actions">
                    {canCreateReport && (
                        <Button
                            variant={isCreationMode ? 'secondary' : 'primary'}
                            onClick={toggleCreationMode}
                        >
                            {isCreationMode ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                    Annuler
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Signaler un problème
                                </>
                            )}
                        </Button>
                    )}
                    <span className="last-update">
                        Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
                    </span>
                </div>
            </header>

            <div className="dashboard-content">
                <section className="stats-section">
                    <StatsCard summary={summary} />
                </section>

                <section className="map-section">
                    <div className="section-header">
                        <div className="section-header-left">
                            <h2 className="section-title">Carte des signalements</h2>
                            <p className="section-subtitle">
                                {isCreationMode
                                    ? 'Cliquez sur la carte pour placer votre signalement'
                                    : 'Survolez les marqueurs pour voir les détails'
                                }
                            </p>
                        </div>

                        {user && (
                            <div className="filter-controls">
                                <button
                                    className={`filter-btn ${!showMyReportsOnly ? 'active' : ''}`}
                                    onClick={() => setShowMyReportsOnly(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="2" y1="12" x2="22" y2="12"></line>
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                    </svg>
                                    Tous les signalements
                                </button>
                                <button
                                    className={`filter-btn ${showMyReportsOnly ? 'active' : ''}`}
                                    onClick={() => setShowMyReportsOnly(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    Mes signalements
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="map-wrapper">
                        <MapView
                            reports={displayedReports}
                            center={[-18.8792, 47.5079]}
                            zoom={13}
                            isCreationMode={isCreationMode}
                            onLocationSelect={handleLocationSelect}
                            pendingLocation={pendingLocation}
                            onReportClick={handleReportClick}
                        />
                    </div>
                </section>
            </div>

            {showReportForm && pendingLocation && (
                <ReportForm
                    location={pendingLocation}
                    onSubmit={handleCreateReport}
                    onCancel={handleCancelCreate}
                    isLoading={isSubmitting}
                />
            )}
        </div>
    );
}
