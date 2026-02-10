import { useState, useEffect } from 'react';
import { photoService, type Photo } from '../../services/photoService';
import './PhotoGallery.css';

interface PhotoGalleryProps {
    signalementId: number | string;
    editable?: boolean;
    onPhotoAdded?: (photo: Photo) => void;
    onPhotoDeleted?: (photoId: number) => void;
}

export function PhotoGallery({
    signalementId,
    editable = false,
    onPhotoDeleted,
}: PhotoGalleryProps) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    useEffect(() => {
        loadPhotos();
    }, [signalementId]);

    const loadPhotos = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await photoService.getPhotosForSignalement(signalementId);
            setPhotos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePhoto = async (photoId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

        setIsDeleting(photoId);
        try {
            await photoService.deletePhoto(photoId);
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
            onPhotoDeleted?.(photoId);
            if (selectedPhoto?.id === photoId) {
                setSelectedPhoto(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        } finally {
            setIsDeleting(null);
        }
    };

    const openLightbox = (photo: Photo) => {
        setSelectedPhoto(photo);
    };

    const closeLightbox = () => {
        setSelectedPhoto(null);
    };

    const navigatePhoto = (direction: 'prev' | 'next') => {
        if (!selectedPhoto) return;
        const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex < 0) newIndex = photos.length - 1;
        if (newIndex >= photos.length) newIndex = 0;
        setSelectedPhoto(photos[newIndex]);
    };

    if (isLoading) {
        return <div className="photo-gallery-loading">Chargement des photos...</div>;
    }

    if (error) {
        return (
            <div className="photo-gallery-error">
                <span>{error}</span>
                <button className="retry-btn" onClick={loadPhotos}>
                    Réessayer
                </button>
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className="photo-gallery-empty">
                <p>Aucune photo disponible</p>
            </div>
        );
    }

    return (
        <div className="photo-gallery">
            <div className="photo-gallery-grid">
                {photos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                        <img
                            src={photoService.getThumbnailUrl(photo.url, 300, 200)}
                            alt={photo.file_name || 'Photo'}
                            onClick={() => openLightbox(photo)}
                            loading="lazy"
                        />
                        <div className="photo-overlay">
                            <button
                                className="photo-view-btn"
                                onClick={() => openLightbox(photo)}
                                title="Voir en grand"
                            >
                                🔍
                            </button>
                            {editable && (
                                <button
                                    className="photo-delete-btn"
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    disabled={isDeleting === photo.id}
                                    title="Supprimer"
                                >
                                    {isDeleting === photo.id ? '⏳' : '🗑️'}
                                </button>
                            )}
                        </div>
                        {photo.file_name && (
                            <div className="photo-name">{photo.file_name}</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>
                            ×
                        </button>

                        {photos.length > 1 && (
                            <>
                                <button
                                    className="lightbox-nav lightbox-prev"
                                    onClick={() => navigatePhoto('prev')}
                                >
                                    ‹
                                </button>
                                <button
                                    className="lightbox-nav lightbox-next"
                                    onClick={() => navigatePhoto('next')}
                                >
                                    ›
                                </button>
                            </>
                        )}

                        <img
                            src={photoService.getOptimizedUrl(selectedPhoto.url)}
                            alt={selectedPhoto.file_name || 'Photo'}
                        />

                        <div className="lightbox-info">
                            {selectedPhoto.file_name && (
                                <span className="lightbox-filename">{selectedPhoto.file_name}</span>
                            )}
                            {selectedPhoto.largeur && selectedPhoto.hauteur && (
                                <span className="lightbox-dimensions">
                                    {selectedPhoto.largeur} × {selectedPhoto.hauteur}
                                </span>
                            )}
                            {selectedPhoto.taille_octets && (
                                <span className="lightbox-size">
                                    {photoService.formatFileSize(selectedPhoto.taille_octets)}
                                </span>
                            )}
                            <span className="lightbox-counter">
                                {photos.findIndex((p) => p.id === selectedPhoto.id) + 1} / {photos.length}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
