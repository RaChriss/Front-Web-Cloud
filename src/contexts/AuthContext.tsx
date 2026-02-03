import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth.types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logoutMessage: string | null;
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    clearLogoutMessage: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const refreshUser = useCallback(async () => {
        try {
            const profile = await authService.getProfile();
            setUser(profile);
        } catch {
            setUser(null);
            authService.clearAuthData();
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const token = authService.getToken();
            if (token) {
                try {
                    // Vérifier la session et récupérer l'utilisateur depuis l'API
                    const user = await authService.verifySession();
                    if (user) {
                        setUser(user);
                    } else {
                        // Session invalide
                        setUser(null);
                    }
                } catch {
                    // Erreur lors de la vérification, nettoyer
                    setUser(null);
                    authService.clearAuthData();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await authService.login(credentials);
        if (response.success && response.user) {
            setUser(response.user);
        }
        return response;
    };

    const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        return authService.register(credentials);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setLogoutMessage('Vous avez été déconnecté avec succès.');
        navigate('/login');
    };

    const clearLogoutMessage = () => {
        setLogoutMessage(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                logoutMessage,
                login,
                register,
                logout,
                refreshUser,
                clearLogoutMessage,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
}
