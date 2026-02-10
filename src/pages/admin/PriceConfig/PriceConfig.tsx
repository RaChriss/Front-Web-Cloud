import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui';
import { priceService, type PrixConfig } from '../../../services/priceService';
import { ROUTES } from '../../../constants';
import './PriceConfig.css';

export function PriceConfig() {
    const [currentPrice, setCurrentPrice] = useState<PrixConfig | null>(null);
    const [isPriceConfigured, setIsPriceConfigured] = useState<boolean>(false);
    const [priceHistory, setPriceHistory] = useState<PrixConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Formulaire pour nouveau prix
    const [newPrice, setNewPrice] = useState<number>(0);
    const [description, setDescription] = useState<string>('');
    const [showForm, setShowForm] = useState(false);

    // Calculateur de budget - Calcul en temps réel
    const [calcNiveau, setCalcNiveau] = useState<number>(5);
    const [calcSurface, setCalcSurface] = useState<number>(100);

    // Calcul en temps réel du budget
    const liveCalculatedBudget = useMemo(() => {
        if (!currentPrice) return 0;
        return currentPrice.prix_par_m2 * calcNiveau * calcSurface;
    }, [currentPrice, calcNiveau, calcSurface]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [priceResponse, history] = await Promise.all([
                priceService.getCurrentPrice(),
                priceService.getPriceHistory(1, 10),
            ]);

            // Gérer la nouvelle structure de réponse avec configured: true/false
            setIsPriceConfigured(priceResponse.configured);
            setCurrentPrice(priceResponse.prix);
            setPriceHistory(history.data || []);
            setNewPrice(priceResponse.prix?.prix_par_m2 || 50000); // Valeur par défaut si non configuré
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitNewPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPrice < 1) {
            setError('Le prix doit être supérieur ou égal à 1 Ar');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const result = await priceService.setNewPrice(newPrice, description || undefined);
            setCurrentPrice(result);
            setIsPriceConfigured(true);
            setSuccessMessage('Nouveau prix configuré avec succès ! Ce tarif sera appliqué aux nouvelles réparations.');
            setShowForm(false);
            setDescription('');
            await loadData();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la configuration');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getNiveauLabel = (niveau: number): string => {
        if (niveau <= 3) return 'Mineur';
        if (niveau <= 6) return 'Moyen';
        if (niveau <= 8) return 'Important';
        return 'Critique';
    };

    const getNiveauColor = (niveau: number): string => {
        if (niveau <= 3) return '#10b981';
        if (niveau <= 6) return '#f59e0b';
        if (niveau <= 8) return '#f97316';
        return '#ef4444';
    };

    if (isLoading) {
        return <div className="loading">Chargement...</div>;
    }

    return (
        <div className="price-config-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>💰 Configuration des Prix</h1>
                    <p className="page-subtitle">Gérer le prix par m² pour le calcul des budgets de réparation</p>
                </div>
                <div className="header-actions">
                    <Button
                        variant="primary"
                        onClick={() => setShowForm(true)}
                        className="add-price-btn"
                    >
                        ➕ Nouveau prix
                    </Button>
                    <Link to={ROUTES.ADMIN.STATISTICS} className="nav-link-btn">
                        <span>📊</span> Statistiques
                    </Link>
                    <Link to={ROUTES.ADMIN.REPARATIONS} className="nav-link-btn">
                        <span>🔧</span> Réparations
                    </Link>
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

            <div className="price-grid">
                {/* Prix actuel */}
                <div className="price-card current-price-card">
                    <h2>Prix Actuel</h2>
                    {isPriceConfigured && currentPrice ? (
                        <>
                            <div className="price-value">
                                {priceService.formatPriceSimple(currentPrice.prix_par_m2)}
                                <span className="price-unit">/m²</span>
                            </div>
                            <div className="price-details">
                                <p><strong>Description:</strong> {currentPrice.description || 'Aucune'}</p>
                                <p><strong>En vigueur depuis:</strong> {new Date(currentPrice.date_effet).toLocaleDateString('fr-FR')}</p>
                                {currentPrice.cree_par && (
                                    <p><strong>Configuré par:</strong> {currentPrice.cree_par}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-price-configured">
                            <div className="no-price-icon">⚠️</div>
                            <p>Aucun prix configuré</p>
                            <p className="no-price-hint">Configurez un prix pour pouvoir calculer les budgets de réparation</p>
                            <Button
                                variant="primary"
                                onClick={() => setShowForm(true)}
                            >
                                ➕ Configurer le premier prix
                            </Button>
                        </div>
                    )}
                </div>

                {/* Calculateur de budget - Temps réel */}
                <div className="price-card calculator-card">
                    <h2>🧮 Calculateur de Budget</h2>
                    {!isPriceConfigured && (
                        <div className="calculator-warning">
                            ⚠️ Aucun prix configuré - Le calcul utilisera 0 Ar/m²
                        </div>
                    )}
                    <p className="formula-display">
                        <span className="formula-label">Formule :</span>
                        <code>Budget = {priceService.formatPriceSimple(currentPrice?.prix_par_m2 || 0)} × Niveau × Surface</code>
                    </p>

                    <div className="calculator-inputs">
                        <div className="form-group niveau-group">
                            <label htmlFor="calcNiveau">
                                Niveau de dégradation
                                <span
                                    className="niveau-indicator"
                                    style={{ backgroundColor: getNiveauColor(calcNiveau) }}
                                >
                                    {calcNiveau} - {getNiveauLabel(calcNiveau)}
                                </span>
                            </label>
                            <input
                                type="range"
                                id="calcNiveau"
                                min="1"
                                max="10"
                                value={calcNiveau}
                                onChange={(e) => setCalcNiveau(Number(e.target.value))}
                                style={{
                                    background: `linear-gradient(to right, ${getNiveauColor(calcNiveau)} ${(calcNiveau - 1) * 11.1}%, #e5e7eb ${(calcNiveau - 1) * 11.1}%)`
                                }}
                            />
                            <div className="range-labels">
                                <span>1</span>
                                <span>5</span>
                                <span>10</span>
                            </div>
                        </div>
                        <div className="form-group surface-group">
                            <label htmlFor="calcSurface">Surface à réparer (m²)</label>
                            <div className="surface-input-wrapper">
                                <input
                                    type="number"
                                    id="calcSurface"
                                    value={calcSurface}
                                    onChange={(e) => setCalcSurface(Number(e.target.value))}
                                    min="1"
                                    step="5"
                                />
                                <span className="input-unit">m²</span>
                            </div>
                            <div className="quick-surface-buttons">
                                {[10, 25, 50, 100, 200].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`quick-btn ${calcSurface === s ? 'active' : ''}`}
                                        onClick={() => setCalcSurface(s)}
                                    >
                                        {s}m²
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="calculation-result live">
                        <div className="result-formula">
                            <span>{priceService.formatPriceSimple(currentPrice?.prix_par_m2 || 0)}</span>
                            <span className="operator">×</span>
                            <span>{calcNiveau}</span>
                            <span className="operator">×</span>
                            <span>{calcSurface} m²</span>
                            <span className="operator">=</span>
                        </div>
                        <div className="result-value">
                            {priceService.formatPriceSimple(liveCalculatedBudget)}
                        </div>
                    </div>
                </div>

                {/* Historique des prix */}
                <div className="price-card history-card">
                    <h2>Historique des Prix</h2>
                    {priceHistory.length > 0 ? (
                        <table className="price-history-table">
                            <thead>
                                <tr>
                                    <th>Prix/m²</th>
                                    <th>Description</th>
                                    <th>Date d'effet</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceHistory.map((price) => (
                                    <tr key={price.id} className={price.est_actif ? 'active' : ''}>
                                        <td>{priceService.formatPriceSimple(price.prix_par_m2)}</td>
                                        <td>{price.description || '-'}</td>
                                        <td>{new Date(price.date_effet).toLocaleDateString('fr-FR')}</td>
                                        <td>
                                            <span className={`status-badge ${price.est_actif ? 'active' : 'inactive'}`}>
                                                {price.est_actif ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Aucun historique disponible</p>
                    )}
                </div>
            </div>


            {/* Modal pour nouveau prix */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Nouveau Prix</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmitNewPrice}>
                            <div className="modal-body">
                                {currentPrice && (
                                    <div className="current-price-info">
                                        <span>Prix actuel :</span>
                                        <strong>{priceService.formatPriceSimple(currentPrice.prix_par_m2)}/m²</strong>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="newPrice">Nouveau prix par m² (Ar)</label>
                                    <input
                                        type="number"
                                        id="newPrice"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(Number(e.target.value))}
                                        min="0"
                                        step="1000"
                                        required
                                        autoFocus
                                    />
                                    {currentPrice && newPrice !== currentPrice.prix_par_m2 && (
                                        <div className="price-change-indicator">
                                            {newPrice > currentPrice.prix_par_m2 ? (
                                                <span className="price-up">↑ +{priceService.formatPriceSimple(newPrice - currentPrice.prix_par_m2)}</span>
                                            ) : (
                                                <span className="price-down">↓ -{priceService.formatPriceSimple(currentPrice.prix_par_m2 - newPrice)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description (optionnel)</label>
                                    <input
                                        type="text"
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ex: Tarif 2026, Ajustement inflation..."
                                    />
                                </div>

                                <div className="price-preview">
                                    <h4>Exemple de budget avec ce prix</h4>
                                    <p className="example-calculation">
                                        Pour une réparation niveau 5, surface 100m² :
                                    </p>
                                    <div className="preview-amount">
                                        {priceService.formatPrice(newPrice * 5 * 100)}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowForm(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isSubmitting}
                                    disabled={isSubmitting || newPrice <= 0}
                                >
                                    Confirmer le nouveau prix
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
