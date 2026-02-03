import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button } from '../../../components/ui';
import { useForm } from '../../../hooks/useForm';
import { useAuth } from '../../../contexts';
import type { RegisterCredentials } from '../../../types/auth.types';
import '../../../assets/styles/pages/Register.css';

const validateRegister = (values: RegisterCredentials) => {
    const errors: Partial<Record<keyof RegisterCredentials, string>> = {};

    if (!values.displayName) {
        errors.displayName = 'Le nom d\'affichage est requis';
    } else if (values.displayName.length < 2) {
        errors.displayName = 'Le nom d\'affichage doit contenir au moins 2 caractères';
    }

    if (!values.email) {
        errors.email = 'L\'adresse email est requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Veuillez entrer une adresse email valide';
    }

    if (!values.password) {
        errors.password = 'Le mot de passe est requis';
    } else if (values.password.length < 6) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    return errors;
};

export function Register() {
    const { register } = useAuth();
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm<RegisterCredentials>({
        initialValues: {
            displayName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        validate: validateRegister,
        onSubmit: async (credentials) => {
            setRegisterError(null);
            try {
                const response = await register(credentials);
                if (response.success) {
                    setRegisterSuccess(true);
                }
            } catch (error) {
                setRegisterError(
                    error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription'
                );
            }
        },
    });

    if (registerSuccess) {
        return (
            <div className="register-page">
                <div className="register-card success-card">
                    <div className="success-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2>Inscription réussie!</h2>
                    <p>Votre compte a été créé avec succès.</p>
                    <Link to="/login">
                        <Button variant="primary" size="md">
                            Se connecter
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="register-page">
            <div className="register-card">
                <div className="register-header">
                    <div className="register-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                    </div>
                    <h1 className="register-title">Créer un compte</h1>
                    <p className="register-subtitle">Rejoignez SignalRoute pour améliorer nos routes</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit} noValidate>
                    {registerError && (
                        <div className="alert alert-error" role="alert">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{registerError}</span>
                        </div>
                    )}

                    <Input
                        id="displayName"
                        name="displayName"
                        type="text"
                        label="Nom d'affichage"
                        placeholder="Jean Rakoto"
                        value={values.displayName}
                        onChange={handleChange}
                        error={errors.displayName}
                        autoComplete="name"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        }
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
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        }
                    />

                    <Input
                        id="password"
                        name="password"
                        type="password"
                        label="Mot de passe"
                        placeholder="••••••••"
                        value={values.password}
                        onChange={handleChange}
                        error={errors.password}
                        autoComplete="new-password"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        }
                    />

                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        label="Confirmer le mot de passe"
                        placeholder="••••••••"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        autoComplete="new-password"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        }
                    />

                    <div className="terms-checkbox">
                        <label className="checkbox-label">
                            <input type="checkbox" name="terms" required />
                            <span>
                                J'accepte les{' '}
                                <a href="#" className="terms-link">conditions d'utilisation</a>
                                {' '}et la{' '}
                                <a href="#" className="terms-link">politique de confidentialité</a>
                            </span>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        isLoading={isSubmitting}
                    >
                        Créer mon compte
                    </Button>
                </form>

                <div className="register-footer">
                    <p>
                        Déjà un compte?{' '}
                        <Link to="/login" className="login-link">
                            Se connecter
                        </Link>
                    </p>
                </div>

                <div className="visitor-explore">
                    <div className="divider">
                        <span>ou</span>
                    </div>
                    <Link to="/dashboard" className="visitor-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="10 8 16 12 10 16 10 8" />
                        </svg>
                        Explorer en tant que visiteur
                    </Link>
                </div>
            </div>
        </div>
    );
}
