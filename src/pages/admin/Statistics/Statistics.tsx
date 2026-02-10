import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui';
import {
    statisticsService,
    type StatistiquesData,
    type StatisticsPeriod,
} from '../../../services/statisticsService';
import { reparationService } from '../../../services/reparationService';
import { ROUTES } from '../../../constants';
import './Statistics.css';

export function Statistics() {
    const [stats, setStats] = useState<StatistiquesData | null>(null);
    const [periode, setPeriode] = useState<StatisticsPeriod>('tout');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        loadStatistics();
    }, [periode]);

    const loadStatistics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await statisticsService.getAll(periode);
            setStats(response.statistiques);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="loading">Chargement des statistiques...</div>;
    }

    if (error) {
        return (
            <div className="statistics-page">
                <div className="alert alert-error">
                    <span>{error}</span>
                    <Button variant="secondary" onClick={loadStatistics}>Réessayer</Button>
                </div>
            </div>
        );
    }

    const delais = stats?.delais;
    const reparations = stats?.reparations;
    const signalements = stats?.signalements;

    return (
        <div className="statistics-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>📊 Statistiques</h1>
                    <p className="page-subtitle">
                        Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-FR')}
                    </p>
                </div>
                <div className="header-actions">
                    {/* Sélecteur de période */}
                    <select
                        className="period-selector"
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value as StatisticsPeriod)}
                    >
                        <option value="tout">Toutes périodes</option>
                        <option value="semaine">Cette semaine</option>
                        <option value="mois">Ce mois</option>
                        <option value="trimestre">Ce trimestre</option>
                        <option value="annee">Cette année</option>
                    </select>
                    <Button variant="secondary" size="sm" onClick={loadStatistics}>
                        🔄 Actualiser
                    </Button>
                    <Link to={ROUTES.ADMIN.REPARATIONS} className="nav-link-btn">
                        <span>🔧</span> Réparations
                    </Link>
                    <Link to={ROUTES.ADMIN.PRICE_CONFIG} className="nav-link-btn">
                        <span>💰</span> Prix
                    </Link>
                </div>
            </div>

            {/* Cartes Délais - Design compact */}
            <div className="stats-grid-compact">
                <div className="stat-card-compact primary">
                    <div className="stat-icon-compact">⏱️</div>
                    <div className="stat-info">
                        <span className="stat-value-compact">{delais?.moyen_jours?.toFixed(1) || 0}</span>
                        <span className="stat-unit">jours</span>
                    </div>
                    <span className="stat-label-compact">Délai moyen</span>
                </div>

                <div className="stat-card-compact">
                    <div className="stat-icon-compact">🚀</div>
                    <div className="stat-info">
                        <span className="stat-value-compact">{delais?.min_jours?.toFixed(1) || 0}</span>
                        <span className="stat-unit">jours</span>
                    </div>
                    <span className="stat-label-compact">Plus rapide</span>
                </div>

                <div className="stat-card-compact">
                    <div className="stat-icon-compact">🐢</div>
                    <div className="stat-info">
                        <span className="stat-value-compact">{delais?.max_jours?.toFixed(1) || 0}</span>
                        <span className="stat-unit">jours</span>
                    </div>
                    <span className="stat-label-compact">Plus long</span>
                </div>

                <div className="stat-card-compact success">
                    <div className="stat-icon-compact">✅</div>
                    <div className="stat-info">
                        <span className="stat-value-compact">{delais?.total_termines || 0}</span>
                        <span className="stat-unit">travaux</span>
                    </div>
                    <span className="stat-label-compact">Terminés</span>
                </div>
            </div>

            {/* Section Réparations */}
            {reparations && (
                <div className="stats-section">
                    <h2>🔧 Réparations</h2>
                    <div className="stats-row">
                        <div className="mini-stat">
                            <span className="mini-value">{reparations.total}</span>
                            <span className="mini-label">Total</span>
                        </div>
                        <div className="mini-stat nouveau">
                            <span className="mini-value">{reparations.nouveau}</span>
                            <span className="mini-label">Nouveau</span>
                        </div>
                        <div className="mini-stat en-cours">
                            <span className="mini-value">{reparations.en_cours}</span>
                            <span className="mini-label">En cours</span>
                        </div>
                        <div className="mini-stat termine">
                            <span className="mini-value">{reparations.termine}</span>
                            <span className="mini-label">Terminé</span>
                        </div>
                        <div className="mini-stat budget">
                            <span className="mini-value">{statisticsService.formatBudget(reparations.budget_total)}</span>
                            <span className="mini-label">Budget total</span>
                        </div>
                        <div className="mini-stat">
                            <span className="mini-value">{reparations.avancement_moyen?.toFixed(0) || 0}%</span>
                            <span className="mini-label">Avancement</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Signalements */}
            {signalements && (
                <div className="stats-section">
                    <h2>📍 Signalements</h2>
                    <div className="stats-row">
                        <div className="mini-stat">
                            <span className="mini-value">{signalements.total}</span>
                            <span className="mini-label">Total</span>
                        </div>
                        <div className="mini-stat nouveau">
                            <span className="mini-value">{signalements.nouveau}</span>
                            <span className="mini-label">Nouveau</span>
                        </div>
                        <div className="mini-stat en-cours">
                            <span className="mini-value">{signalements.en_cours}</span>
                            <span className="mini-label">En cours</span>
                        </div>
                        <div className="mini-stat termine">
                            <span className="mini-value">{signalements.termine}</span>
                            <span className="mini-label">Terminé</span>
                        </div>
                        <div className="mini-stat">
                            <span className="mini-value">{signalements.avec_niveau}</span>
                            <span className="mini-label">Avec niveau</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Répartition par niveau - si disponible */}
            {stats?.repartition_par_niveau && stats.repartition_par_niveau.length > 0 && (
                <div className="stats-section niveau-section">
                    <h2>📈 Performance par Niveau</h2>
                    <div className="niveau-stats-grid">
                        {stats.repartition_par_niveau.map((item) => (
                            <div key={item.niveau} className="niveau-stat-card">
                                <div className="niveau-header">
                                    <span
                                        className="niveau-badge"
                                        style={{ backgroundColor: reparationService.getNiveauColor(item.niveau) }}
                                    >
                                        N{item.niveau}
                                    </span>
                                    <span className="niveau-count">{item.count} réparations</span>
                                </div>
                                <div className="niveau-delay">
                                    <span className="delay-value">{item.delai_moyen_jours.toFixed(1)}</span>
                                    <span className="delay-unit">j en moyenne</span>
                                </div>
                                <div className="niveau-bar">
                                    <div
                                        className="niveau-bar-fill"
                                        style={{
                                            width: `${Math.min((item.delai_moyen_jours / (delais?.max_jours || 1)) * 100, 100)}%`,
                                            backgroundColor: reparationService.getNiveauColor(item.niveau),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Section Entreprises - si disponible */}
            {stats?.entreprises && stats.entreprises.length > 0 && (
                <div className="stats-section">
                    <h2>🏢 Performance Entreprises</h2>
                    <div className="entreprises-grid">
                        {stats.entreprises.map((e) => (
                            <div key={e.id} className="entreprise-card">
                                <div className="entreprise-name">{e.nom}</div>
                                <div className="entreprise-stats">
                                    <span>{e.reparations_terminees}/{e.reparations_total} terminées</span>
                                    <span className="budget">{statisticsService.formatBudget(e.budget_total)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Prix actuel - si disponible */}
            {stats?.prix && (
                <div className="stats-section prix-section">
                    <h2>💰 Prix Actuel</h2>
                    <div className="prix-info">
                        <span className="prix-value">{stats.prix.prix_par_m2.toLocaleString('fr-FR')} Ar/m²</span>
                        {stats.prix.description && <span className="prix-desc">{stats.prix.description}</span>}
                    </div>
                </div>
            )}

            {/* Message si aucune donnée */}
            {!stats && (
                <div className="empty-stats">
                    <span className="empty-icon">📭</span>
                    <p>Aucune donnée disponible pour le moment</p>
                    <Link to={ROUTES.ADMIN.REPARATIONS} className="nav-link-btn primary">
                        Voir les réparations →
                    </Link>
                </div>
            )}
        </div>
    );
}
