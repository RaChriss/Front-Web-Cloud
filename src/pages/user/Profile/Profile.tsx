import { useState, useEffect } from 'react';
import { Input, Button } from '../../../components/ui';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../../../contexts';
import { authService } from '../../../services/authService';
import { USER_ROLES } from '../../../types/auth.types';
import '../../../assets/styles/pages/Profile.css';

interface ProfileFormValues {
    displayName: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

const validateProfile = (values: ProfileFormValues) => {
    const errors: Partial<Record<keyof ProfileFormValues, string>> = {};

    if (!values.displayName) {
        errors.displayName = 'Le nom d\'affichage est requis';
    } else if (values.displayName.length < 2) {
        errors.displayName = 'Le nom d\'affichage doit contenir au moins 2 caractères';
    }

    if (!values.email) {
        errors.email = "L'adresse email est requise";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Veuillez entrer une adresse email valide';
    }

    // Validation du mot de passe (optionnel - seulement si on veut le changer)
    if (values.newPassword) {
        if (!values.currentPassword) {
            errors.currentPassword = 'Le mot de passe actuel est requis pour changer de mot de passe';
        }
        if (values.newPassword.length < 6) {
            errors.newPassword = 'Le nouveau mot de passe doit contenir au moins 6 caractères';
        }
        if (values.newPassword !== values.confirmNewPassword) {
            errors.confirmNewPassword = 'Les mots de passe ne correspondent pas';
        }
    }

    return errors;
};

export function Profile() {
    const { user, refreshUser } = useAuth();
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

    const { values, errors, isSubmitting, handleChange, handleSubmit, setValues } = useForm<ProfileFormValues>({
        initialValues: {
            displayName: '',
            email: '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
        validate: validateProfile,
        onSubmit: async (formValues) => {
            setUpdateError(null);
            setUpdateSuccess(null);

            try {
                const updateData: Record<string, string> = {
                    displayName: formValues.displayName,
                    email: formValues.email,
                };

                // Ajouter les mots de passe seulement si on veut les changer
                if (formValues.newPassword) {
                    updateData.currentPassword = formValues.currentPassword;
                    updateData.newPassword = formValues.newPassword;
                }

                await authService.updateProfile(updateData);
                await refreshUser();

                setUpdateSuccess('Vos informations ont été mises à jour avec succès.');

                // Réinitialiser les champs de mot de passe
                setValues((prev) => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: '',
                }));
            } catch (error) {
                setUpdateError(
                    error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour'
                );
            }
        },
    });

    // Charger les données utilisateur au montage
    useEffect(() => {
        if (user) {
            setValues((prev) => ({
                ...prev,
                displayName: user.display_name || '',
                email: user.email || '',
            }));
        }
    }, [user, setValues]);

    const roleLabel = user?.type_user_name || (user?.type_user ? USER_ROLES[user.type_user] : 'Utilisateur');

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>Mon Profil</h1>
                <p className="profile-subtitle">Gérez vos informations personnelles</p>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div className="profile-user-info">
                            <h2>{user?.display_name}</h2>
                            <span className="profile-role-badge">{roleLabel}</span>
                        </div>
                    </div>

                    <form className="profile-form" onSubmit={handleSubmit} noValidate>
                        {updateSuccess && (
                            <div className="alert alert-success" role="alert">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <span>{updateSuccess}</span>
                            </div>
                        )}

                        {updateError && (
                            <div className="alert alert-error" role="alert">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{updateError}</span>
                            </div>
                        )}

                        <div className="form-section">
                            <h3>Informations personnelles</h3>
                            <Input
                                id="displayName"
                                name="displayName"
                                type="text"
                                label="Nom d'affichage"
                                placeholder="Votre nom"
                                value={values.displayName}
                                onChange={handleChange}
                                error={errors.displayName}
                                autoComplete="name"
                            />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                label="Adresse email"
                                placeholder="exemple@email.com"
                                value={values.email}
                                onChange={handleChange}
                                error={errors.email}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-section">
                            <h3>Changer le mot de passe</h3>
                            <p className="section-hint">Laissez vide si vous ne souhaitez pas changer votre mot de passe</p>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                label="Mot de passe actuel"
                                placeholder="••••••••"
                                value={values.currentPassword}
                                onChange={handleChange}
                                error={errors.currentPassword}
                                autoComplete="current-password"
                            />
                            <div className="form-row">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    label="Nouveau mot de passe"
                                    placeholder="••••••••"
                                    value={values.newPassword}
                                    onChange={handleChange}
                                    error={errors.newPassword}
                                    autoComplete="new-password"
                                />
                                <Input
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    type="password"
                                    label="Confirmer le mot de passe"
                                    placeholder="••••••••"
                                    value={values.confirmNewPassword}
                                    onChange={handleChange}
                                    error={errors.confirmNewPassword}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                isLoading={isSubmitting}
                            >
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
