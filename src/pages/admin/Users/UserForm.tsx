import React, { useState, useEffect } from 'react';
import type { AdminUser } from '../../../types/auth.types';
import type { CreateUserDTO, UpdateUserDTO } from '../../../services/adminService';

interface UserFormProps {
    user?: AdminUser | null;
    isEditing: boolean;
    onSave: (userData: CreateUserDTO | UpdateUserDTO) => Promise<void>;
    onCancel: () => void;
}

interface FormData {
    email: string;
    password: string;
    display_name: string;
    type_user: 1 | 2 | 3;
}

const USER_TYPES = [
    { id: 1, label: 'Visiteur' },
    { id: 2, label: 'Utilisateur' },
    { id: 3, label: 'Manager' },
];

export default function UserForm({ user, isEditing, onSave, onCancel }: UserFormProps) {
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        display_name: '',
        type_user: 2,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditing && user) {
            setFormData({
                email: user.email,
                password: '', // Ne pas afficher le mot de passe
                display_name: user.display_name,
                type_user: user.type_user as 1 | 2 | 3,
            });
        }
    }, [user, isEditing]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        if (!isEditing) {
            if (!formData.password) {
                newErrors.password = 'Mot de passe requis';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Minimum 6 caractères';
            }
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Minimum 6 caractères';
        }

        if (!formData.display_name) {
            newErrors.display_name = 'Nom requis';
        } else if (formData.display_name.length < 2) {
            newErrors.display_name = 'Minimum 2 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'type_user' ? (parseInt(value) as 1 | 2 | 3) : value,
        }));
        // Effacer l'erreur du champ
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            if (isEditing) {
                // Pour l'édition, on ne sendque les champs modifiés
                const updateData: UpdateUserDTO = {
                    email: formData.email,
                    display_name: formData.display_name,
                    type_user: formData.type_user,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await onSave(updateData);
            } else {
                await onSave(formData);
            }
        } catch (err: any) {
            setErrors({ submit: err.message || 'Erreur lors de la sauvegarde' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="user-form">
            {errors.submit && <div className="alert alert-danger">{errors.submit}</div>}

            <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    disabled={isEditing}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
                {isEditing && <small className="form-hint">Email ne peut pas être modifié</small>}
            </div>

            <div className="form-group">
                <label htmlFor="password">Mot de passe {!isEditing ? '*' : ''}</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditing ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
                {isEditing && <small className="form-hint">Laisser vide pour conserver le mot de passe actuel</small>}
            </div>

            <div className="form-group">
                <label htmlFor="display_name">Nom d'affichage *</label>
                <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    placeholder="Jean Dupont"
                    className={`form-input ${errors.display_name ? 'error' : ''}`}
                />
                {errors.display_name && <span className="form-error">{errors.display_name}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="type_user">Type d'utilisateur *</label>
                <select
                    id="type_user"
                    name="type_user"
                    value={formData.type_user}
                    onChange={handleChange}
                    className="form-select"
                >
                    {USER_TYPES.map(type => (
                        <option key={type.id} value={type.id}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Sauvegarde...' : isEditing ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                    Annuler
                </button>
            </div>

            <small className="form-hint">* Champs obligatoires</small>
        </form>
    );
}
