import { useState } from 'react';
import { Button } from '../../ui';
import type { NewReportLocation } from '../../Map';
import type { ReportFormData } from '../../../types/report.types';
import '../../../assets/styles/components/ReportForm.css';

interface ReportFormProps {
    location: NewReportLocation;
    onSubmit: (data: ReportFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ReportForm({ location, onSubmit, onCancel, isLoading = false }: ReportFormProps) {
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!description.trim()) {
            setError('La description est requise');
            return;
        }
        if (description.trim().length < 10) {
            setError('La description doit contenir au moins 10 caractères');
            return;
        }
        if (description.trim().length > 500) {
            setError('La description ne doit pas dépasser 500 caractères');
            return;
        }

        try {
            await onSubmit({
                description: description.trim(),
                latitude: location.latitude,
                longitude: location.longitude,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        }
    };

    return (
        <div className="report-form-overlay">
            <div className="report-form-modal">
                <div className="report-form-header">
                    <h2>Nouveau signalement</h2>
                    <button className="close-btn" onClick={onCancel} disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="report-form">
                    {error && (
                        <div className="form-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="location-info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>
                            Position: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description du problème *</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Décrivez le problème routier observé (ex: Nid de poule dangereux sur la route principale)..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            maxLength={500}
                            required
                        />
                        <div className="char-count">
                            {description.length}/500 caractères
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                        >
                            Créer le signalement
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
