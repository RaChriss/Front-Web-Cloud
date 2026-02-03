import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui';
import { reportService } from '../../../services/reportService';
import { syncService } from '../../../services/syncService';
import type { Report, SyncStatus, SyncConflict, HealthStatus, SyncStatistics } from '../../../types/report.types';
import '../../../assets/styles/pages/Sync.css';

export function Sync() {
    // États pour synchronisation manuelle
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingReports, setPendingReports] = useState<Report[]>([]);

    // États pour le statut de synchronisation
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

    // États pour les conflits
    const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
    const [isLoadingConflicts, setIsLoadingConflicts] = useState(true);
    const [expandedConflict, setExpandedConflict] = useState<number | null>(null);

    // États pour la synchronisation automatique
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
    const [isTogglingAutoSync, setIsTogglingAutoSync] = useState(false);

    // États pour la santé du système
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [isLoadingHealth, setIsLoadingHealth] = useState(true);

    // États pour les statistiques
    const [statistics, setStatistics] = useState<SyncStatistics | null>(null);
    const [isLoadingStatistics, setIsLoadingStatistics] = useState(true);

    // Gestion des erreurs et messages
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'conflicts' | 'health' | 'statistics'>('overview');

    // Charger les données au montage et régulièrement
    useEffect(() => {
        const loadAllData = async () => {
            try {
                // Charger en parallèle
                await Promise.all([
                    loadPendingReports(),
                    loadSyncStatus(),
                    loadConflicts(),
                    loadHealth(),
                    loadStatistics(),
                ]);
            } catch (err) {
                console.error('Erreur lors du chargement des données:', err);
            }
        };

        loadAllData();
        const interval = setInterval(loadAllData, 30000); // Actualiser toutes les 30 secondes
        return () => clearInterval(interval);
    }, []);

    const loadPendingReports = async () => {
        try {
            const response = await reportService.getPendingSync();
            setPendingReports(response.reports);
        } catch (err) {
            console.error('Erreur lors du chargement des signalements en attente:', err);
        }
    };

    const loadSyncStatus = async () => {
        try {
            const status = await syncService.getSyncStatus();
            setSyncStatus(status);
        } catch (err) {
            console.error('Erreur lors du chargement du statut:', err);
        }
    };

    const loadConflicts = async () => {
        setIsLoadingConflicts(true);
        try {
            const data = await syncService.getConflicts();
            setConflicts(data);
        } catch (err) {
            console.error('Erreur lors du chargement des conflits:', err);
        } finally {
            setIsLoadingConflicts(false);
        }
    };

    const loadHealth = async () => {
        setIsLoadingHealth(true);
        try {
            const data = await syncService.getGeneralHealth();
            setHealth(data);
        } catch (err) {
            console.error('Erreur lors du chargement de la santé:', err);
        } finally {
            setIsLoadingHealth(false);
        }
    };

    const loadStatistics = async () => {
        setIsLoadingStatistics(true);
        try {
            const data = await syncService.getSyncStatistics(7);
            setStatistics(data);
        } catch (err) {
            console.error('Erreur lors du chargement des statistiques:', err);
        } finally {
            setIsLoadingStatistics(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await reportService.syncToFirebase();
            if (result.success) {
                setSuccessMessage(result.message || `Synchronisation réussie : ${result.count || 0} signalement(s) synchronisé(s)`);
                // Recharger les données
                await Promise.all([loadPendingReports(), loadSyncStatus(), loadStatistics()]);
            } else {
                setError(result.message || 'Erreur lors de la synchronisation');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la synchronisation');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await syncService.executeSyncManual();
            if (result.success) {
                setSuccessMessage(result.message || `Synchronisation manuelle réussie : ${result.synced_count || 0} élément(s) synchronisé(s)`);
                // Recharger les données
                await Promise.all([loadPendingReports(), loadSyncStatus(), loadConflicts(), loadStatistics()]);
            } else {
                setError(result.message || 'Erreur lors de la synchronisation manuelle');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la synchronisation manuelle');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleToggleAutoSync = async () => {
        setIsTogglingAutoSync(true);
        setError(null);
        try {
            const result = await syncService.setAutoSyncEnabled(!autoSyncEnabled);
            setAutoSyncEnabled(result.enabled);
            setSuccessMessage(`Synchronisation automatique ${result.enabled ? 'activée' : 'désactivée'}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du changement de la synchronisation automatique');
        } finally {
            setIsTogglingAutoSync(false);
        }
    };

    const handleResolveConflict = async (conflictId: number, resolution: 'firebase' | 'postgres') => {
        setError(null);
        try {
            await syncService.resolveConflict(conflictId, resolution);
            setSuccessMessage('Conflit résolu avec succès');
            await loadConflicts();
            setExpandedConflict(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la résolution du conflit');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected':
            case 'ok':
                return '#10b981';
            case 'disconnected':
            case 'degraded':
                return '#f59e0b';
            case 'error':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    return (
        <div className="sync-page">
            <div className="page-header">
                <h1>Centre de Synchronisation</h1>
                <p className="page-subtitle">Gérer la synchronisation bidirectionnelle entre PostgreSQL et Firebase</p>
            </div>

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

            {/* Onglets de navigation */}
            <div className="sync-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Vue d'ensemble
                </button>
                <button
                    className={`tab-button ${activeTab === 'conflicts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('conflicts')}
                >
                    Conflits {conflicts.length > 0 && <span className="badge">{conflicts.length}</span>}
                </button>
                <button
                    className={`tab-button ${activeTab === 'health' ? 'active' : ''}`}
                    onClick={() => setActiveTab('health')}
                >
                    Santé du système
                </button>
                <button
                    className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('statistics')}
                >
                    Statistiques
                </button>
            </div>

            {/* Vue d'ensemble */}
            {activeTab === 'overview' && (
                <div className="sync-grid">
                    {/* Carte Statut */}
                    {syncStatus && (
                        <div className="sync-card status-card">
                            <h3>État du système</h3>
                            <div className="status-grid">
                                <div className="status-item">
                                    <div className="status-indicator" style={{ backgroundColor: getStatusColor(syncStatus.firebase_status) }} />
                                    <span>Firebase: {syncStatus.firebase_status === 'connected' ? 'Connecté' : 'Déconnecté'}</span>
                                </div>
                                <div className="status-item">
                                    <div className="status-indicator" style={{ backgroundColor: getStatusColor(syncStatus.database_status) }} />
                                    <span>Base de données: {syncStatus.database_status === 'connected' ? 'Connectée' : 'Déconnectée'}</span>
                                </div>
                            </div>
                            <div className="status-details">
                                <p>Éléments en attente: <strong>{syncStatus.pending_count}</strong></p>
                                <p>Éléments synchronisés: <strong>{syncStatus.synced_count}</strong></p>
                                <p>Erreurs: <strong>{syncStatus.error_count}</strong></p>
                                {syncStatus.last_sync && <p>Dernière sync: <strong>{new Date(syncStatus.last_sync).toLocaleString('fr-FR')}</strong></p>}
                            </div>
                        </div>
                    )}

                    {/* Carte Synchronisation manuelle */}
                    <div className="sync-card sync-card-full">
                        <div className="sync-card-icon full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </div>
                        <h2>Synchronisation manuelle</h2>
                        <p>Déclenchez une synchronisation complète ou synchronisez les signalements en attente.</p>
                        <div className="button-group">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSync}
                                isLoading={isSyncing}
                                disabled={isSyncing || pendingReports.length === 0}
                            >
                                Synchroniser signalements en attente ({pendingReports.length})
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handleManualSync}
                                isLoading={isSyncing}
                                disabled={isSyncing}
                            >
                                Synchronisation complète
                            </Button>
                        </div>
                    </div>

                    {/* Carte Synchronisation automatique */}
                    <div className="sync-card auto-sync-card">
                        <h3>Synchronisation automatique</h3>
                        <p>Activez la synchronisation automatique pour synchroniser les données périodiquement.</p>
                        <div className="toggle-container">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={autoSyncEnabled}
                                    onChange={handleToggleAutoSync}
                                    disabled={isTogglingAutoSync}
                                    className="toggle-input"
                                />
                                <span className={`toggle-switch ${autoSyncEnabled ? 'enabled' : ''}`} />
                            </label>
                            <span className="toggle-text">
                                {autoSyncEnabled ? 'Activée' : 'Désactivée'}
                            </span>
                        </div>
                    </div>

                    {/* Liste des signalements en attente */}
                    {pendingReports.length > 0 && (
                        <div className="sync-card pending-list-card">
                            <h3>Signalements en attente ({pendingReports.length})</h3>
                            <div className="pending-list">
                                {pendingReports.map((report) => (
                                    <div key={report.id} className="pending-item">
                                        <span className="pending-id">#{report.id}</span>
                                        <span className="pending-desc">{report.description.substring(0, 50)}...</span>
                                        <span className="pending-date">
                                            {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Conflits */}
            {activeTab === 'conflicts' && (
                <div className="sync-conflicts">
                    {isLoadingConflicts ? (
                        <div className="loading">Chargement des conflits...</div>
                    ) : conflicts.length === 0 ? (
                        <div className="empty-state">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <p>Aucun conflit détecté</p>
                        </div>
                    ) : (
                        <div className="conflicts-list">
                            {conflicts.map((conflict) => (
                                <div key={conflict.id} className="conflict-card">
                                    <div className="conflict-header" onClick={() => setExpandedConflict(expandedConflict === conflict.id ? null : conflict.id)}>
                                        <div className="conflict-info">
                                            <span className="conflict-id">Conflit #{conflict.id}</span>
                                            <span className="conflict-type">{conflict.conflict_type}</span>
                                            <span className={`conflict-status ${conflict.resolution}`}>{conflict.resolution === 'resolved' ? 'Résolu' : 'En attente'}</span>
                                        </div>
                                        <span className="conflict-toggle">{expandedConflict === conflict.id ? '▲' : '▼'}</span>
                                    </div>
                                    {expandedConflict === conflict.id && (
                                        <div className="conflict-details">
                                            <div className="conflict-comparison">
                                                <div className="conflict-side">
                                                    <h4>Firebase</h4>
                                                    <pre>{JSON.stringify(conflict.firebase_data, null, 2)}</pre>
                                                </div>
                                                <div className="conflict-side">
                                                    <h4>PostgreSQL</h4>
                                                    <pre>{JSON.stringify(conflict.postgres_data, null, 2)}</pre>
                                                </div>
                                            </div>
                                            {conflict.resolution === 'pending' && (
                                                <div className="conflict-actions">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleResolveConflict(conflict.id, 'firebase')}
                                                    >
                                                        Garder Firebase
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleResolveConflict(conflict.id, 'postgres')}
                                                    >
                                                        Garder PostgreSQL
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Santé du système */}
            {activeTab === 'health' && (
                <div className="sync-health">
                    {isLoadingHealth ? (
                        <div className="loading">Chargement...</div>
                    ) : health ? (
                        <div className="health-grid">
                            <div className="health-card">
                                <div className="health-header">
                                    <h3>État général</h3>
                                    <div className="health-status" style={{ backgroundColor: getStatusColor(health.status) }} />
                                    <span className="health-label">{health.status === 'ok' ? 'Correct' : health.status === 'degraded' ? 'Dégradé' : 'Erreur'}</span>
                                </div>
                            </div>
                            <div className="health-card">
                                <h3>PostgreSQL</h3>
                                <div className="health-detail">
                                    <div className="health-status" style={{ backgroundColor: health.postgres.connected ? '#10b981' : '#ef4444' }} />
                                    <span>{health.postgres.connected ? 'Connecté' : 'Déconnecté'}</span>
                                </div>
                                {health.postgres.response_time && <p>Temps de réponse: {health.postgres.response_time}ms</p>}
                            </div>
                            <div className="health-card">
                                <h3>Firebase</h3>
                                <div className="health-detail">
                                    <div className="health-status" style={{ backgroundColor: health.firebase.connected ? '#10b981' : '#ef4444' }} />
                                    <span>{health.firebase.connected ? 'Connecté' : 'Déconnecté'}</span>
                                </div>
                                {health.firebase.response_time && <p>Temps de réponse: {health.firebase.response_time}ms</p>}
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Statistiques */}
            {activeTab === 'statistics' && (
                <div className="sync-statistics">
                    {isLoadingStatistics ? (
                        <div className="loading">Chargement...</div>
                    ) : statistics ? (
                        <div className="statistics-grid">
                            <div className="stat-card">
                                <h4>Total des synchronisations</h4>
                                <p className="stat-value">{statistics.total_syncs}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Synchronisations réussies</h4>
                                <p className="stat-value" style={{ color: '#10b981' }}>{statistics.successful_syncs}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Synchronisations échouées</h4>
                                <p className="stat-value" style={{ color: '#ef4444' }}>{statistics.failed_syncs}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Durée moyenne</h4>
                                <p className="stat-value">{Math.round(statistics.average_duration_ms)}ms</p>
                            </div>
                            <div className="stat-card">
                                <h4>Éléments synchronisés</h4>
                                <p className="stat-value">{statistics.total_items_synced}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Conflits détectés</h4>
                                <p className="stat-value">{statistics.conflicts_detected}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Conflits résolus</h4>
                                <p className="stat-value" style={{ color: '#10b981' }}>{statistics.conflicts_resolved}</p>
                            </div>
                            {statistics.last_sync_duration_ms && (
                                <div className="stat-card">
                                    <h4>Dernière sync</h4>
                                    <p className="stat-value">{Math.round(statistics.last_sync_duration_ms)}ms</p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

            {/* Section d'information */}
            <div className="sync-info">
                <h3>À propos de la synchronisation bidirectionnelle</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <div className="info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </div>
                        <div className="info-content">
                            <h4>Synchronisation bidirectionnelle</h4>
                            <p>Les signalements sont synchronisés entre PostgreSQL (serveur web) et Firebase (applications mobiles) de manière bidirectionnelle.</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </div>
                        <div className="info-content">
                            <h4>Gestion des conflits</h4>
                            <p>Lors de modifications simultanées, les conflits sont détectés et résolus manuellement ou automatiquement selon la stratégie configurée.</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <div className="info-content">
                            <h4>Synchronisation automatique</h4>
                            <p>Activez la synchronisation automatique pour synchroniser les données périodiquement sans intervention manuelle.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
