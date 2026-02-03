import type { ReportSummary } from '../../../types';
import '../../../assets/styles/components/StatsCard.css';

interface StatsCardProps {
    summary: ReportSummary;
}

export function StatsCard({ summary }: StatsCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-MG', {
            style: 'currency',
            currency: 'MGA',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="stats-card">
            <h3 className="stats-title">Récapitulatif</h3>
            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-icon total">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{summary.totalReports}</span>
                        <span className="stat-label">Total signalements</span>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon new">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{summary.newCount}</span>
                        <span className="stat-label">Nouveaux</span>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon in-progress">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{summary.inProgressCount}</span>
                        <span className="stat-label">En cours</span>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon completed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{summary.completedCount}</span>
                        <span className="stat-label">Terminés</span>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon surface">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{summary.totalSurface.toLocaleString()} m²</span>
                        <span className="stat-label">Surface totale</span>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon budget">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(summary.totalBudget)}</span>
                        <span className="stat-label">Budget total</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
                <div className="progress-header">
                    <span className="progress-label">Avancement global</span>
                    <span className="progress-value">{summary.progressPercentage}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${summary.progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
