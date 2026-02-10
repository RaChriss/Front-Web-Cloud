import { apiRequest } from './api';

/**
 * Service pour la gestion des photos (Cloudinary)
 * Endpoints: /api/photos
 */

// ============================================
// TYPES
// ============================================

export interface Photo {
    id: number;
    Id_signalement?: number;
    url: string;
    cloudinary_public_id: string;
    file_name?: string;
    mime_type?: string;
    taille_octets?: number;
    largeur?: number;
    hauteur?: number;
    date_upload: string;
}

export interface PhotoUploadData {
    url: string;
    cloudinary_public_id: string;
    file_name?: string;
    mime_type?: string;
    taille_octets?: number;
    largeur?: number;
    hauteur?: number;
}

export interface BulkPhotoData {
    signalement_id: number;
    url: string;
    cloudinary_public_id: string;
    file_name?: string;
}

export interface FirebaseSyncPhoto {
    url: string;
    cloudinary_public_id: string;
}

// ============================================
// SERVICE
// ============================================

export const photoService = {
    /**
     * Récupérer les photos d'un signalement
     * GET /api/photos/signalement/:id
     */
    async getPhotosForSignalement(signalementId: number | string): Promise<Photo[]> {
        const response = await apiRequest<{ success: boolean; data: Photo[] }>(
            `/photos/signalement/${signalementId}`,
            { method: 'GET' }
        );
        return response.data || [];
    },

    /**
     * Ajouter une photo à un signalement
     * POST /api/photos/signalement/:id
     */
    async addPhoto(signalementId: number | string, photoData: PhotoUploadData): Promise<Photo> {
        const response = await apiRequest<{ success: boolean; message: string; data: Photo }>(
            `/photos/signalement/${signalementId}`,
            {
                method: 'POST',
                body: photoData,
            }
        );
        return response.data;
    },

    /**
     * Synchroniser les photos depuis Firebase
     * POST /api/photos/signalement/:id/sync-firebase
     */
    async syncFromFirebase(
        signalementId: number | string,
        photos: FirebaseSyncPhoto[]
    ): Promise<{ inserted: number; photos: Photo[] }> {
        const response = await apiRequest<{
            success: boolean;
            message: string;
            data: { inserted: number; photos: Photo[] };
        }>(`/photos/signalement/${signalementId}/sync-firebase`, {
            method: 'POST',
            body: { photos },
        });
        return response.data;
    },

    /**
     * Supprimer une photo
     * DELETE /api/photos/:id
     */
    async deletePhoto(photoId: number | string): Promise<void> {
        await apiRequest<{ success: boolean; message: string }>(`/photos/${photoId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Ajouter plusieurs photos en une seule requête
     * POST /api/photos/bulk
     */
    async addBulkPhotos(photos: BulkPhotoData[]): Promise<{ inserted: number }> {
        const response = await apiRequest<{
            success: boolean;
            message: string;
            data: { inserted: number };
        }>('/photos/bulk', {
            method: 'POST',
            body: { photos },
        });
        return response.data;
    },

    /**
     * Obtenir l'URL optimisée pour une miniature Cloudinary
     */
    getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
        // Transformer l'URL Cloudinary pour obtenir une miniature
        if (url.includes('cloudinary.com')) {
            return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height}/`);
        }
        return url;
    },

    /**
     * Obtenir l'URL optimisée pour l'affichage
     */
    getOptimizedUrl(url: string, maxWidth: number = 1200): string {
        if (url.includes('cloudinary.com')) {
            return url.replace('/upload/', `/upload/c_limit,w_${maxWidth},q_auto,f_auto/`);
        }
        return url;
    },

    /**
     * Formatter la taille d'un fichier
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
};
