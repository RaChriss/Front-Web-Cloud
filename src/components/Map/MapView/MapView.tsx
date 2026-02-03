import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Report, ReportStatus } from '../../../types';
import 'leaflet/dist/leaflet.css';
import '../../../assets/styles/components/MapView.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on status
const createCustomIcon = (status: ReportStatus, isHovered: boolean = false) => {
    const colors: Record<ReportStatus, string> = {
        new: '#ef4444',
        in_progress: '#f59e0b',
        completed: '#10b981',
    };

    const size = isHovered ? 40 : 30;

    return L.divIcon({
        className: `custom-marker ${isHovered ? 'marker-hovered' : ''}`,
        html: `
            <div class="marker-pin ${isHovered ? 'hovered' : ''}" style="background-color: ${colors[status]}; width: ${size}px; height: ${size}px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="${isHovered ? 20 : 16}" height="${isHovered ? 20 : 16}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
            </div>
        `,
        iconSize: [size, size + 12],
        iconAnchor: [size / 2, size + 12],
        popupAnchor: [0, -(size + 12)],
    });
};

// Icône pour le marqueur de création
const createNewMarkerIcon = () => {
    return L.divIcon({
        className: 'custom-marker new-marker',
        html: `
            <div class="marker-pin creating" style="background-color: #3b82f6;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -42],
    });
};

const statusLabels: Record<ReportStatus, string> = {
    new: 'Nouveau',
    in_progress: 'En cours',
    completed: 'Terminé',
};

export interface NewReportLocation {
    latitude: number;
    longitude: number;
}

interface MapViewProps {
    reports: Report[];
    center?: [number, number];
    zoom?: number;
    onReportClick?: (report: Report) => void;
    // Mode création pour les utilisateurs connectés
    isCreationMode?: boolean;
    onLocationSelect?: (location: NewReportLocation) => void;
    pendingLocation?: NewReportLocation | null;
}

// Component to handle map centering
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);

    return null;
}

// Component to handle map clicks for creating reports
function MapClickHandler({ onLocationSelect, isCreationMode }: { onLocationSelect?: (location: NewReportLocation) => void; isCreationMode: boolean }) {
    useMapEvents({
        click(e) {
            if (isCreationMode && onLocationSelect) {
                onLocationSelect({
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng,
                });
            }
        },
    });
    return null;
}

export function MapView({
    reports,
    center = [-18.8792, 47.5079], // Antananarivo coordinates
    zoom = 13,
    onReportClick,
    isCreationMode = false,
    onLocationSelect,
    pendingLocation,
}: MapViewProps) {
    const [hoveredReportId, setHoveredReportId] = useState<number | null>(null);

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-MG', {
            style: 'currency',
            currency: 'MGA',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleMarkerMouseOver = useCallback((reportId: number) => {
        setHoveredReportId(reportId);
    }, []);

    const handleMarkerMouseOut = useCallback(() => {
        setHoveredReportId(null);
    }, []);

    return (
        <div className={`map-container ${isCreationMode ? 'creation-mode' : ''}`}>
            {isCreationMode && (
                <div className="creation-mode-banner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Cliquez sur la carte pour placer votre signalement</span>
                </div>
            )}
            <MapContainer
                center={center}
                zoom={zoom}
                className="map"
                scrollWheelZoom={true}
            >
                {/* Serveur de tuiles hors ligne (tileserver-gl) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | SignalRoute'
                    url="http://localhost:9080/styles/basic/{z}/{x}/{y}.png"
                />
                <MapController center={center} />
                <MapClickHandler onLocationSelect={onLocationSelect} isCreationMode={isCreationMode} />

                {/* Marqueur pour la création */}
                {pendingLocation && (
                    <Marker
                        position={[pendingLocation.latitude, pendingLocation.longitude]}
                        icon={createNewMarkerIcon()}
                    >
                        <Popup>
                            <div className="popup-content creating-popup">
                                <h3>Nouveau signalement</h3>
                                <p>Position sélectionnée</p>
                                <p className="coordinates">
                                    {pendingLocation.latitude.toFixed(6)}, {pendingLocation.longitude.toFixed(6)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {reports
                    .filter((report) => {
                        const lat = report.latitude;
                        const lng = report.longitude;
                        // Vérifier que les coordonnées sont valides (non nulles, non NaN, et pas 0,0)
                        return lat != null && lng != null &&
                            !isNaN(lat) && !isNaN(lng) &&
                            (lat !== 0 || lng !== 0);
                    })
                    .map((report) => {
                        const isHovered = hoveredReportId === report.id;
                        return (
                            <Marker
                                key={report.id}
                                position={[report.latitude, report.longitude]}
                                icon={createCustomIcon(report.clientStatus, isHovered)}
                                eventHandlers={{
                                    click: () => {
                                        onReportClick?.(report);
                                    },
                                    mouseover: () => handleMarkerMouseOver(report.id),
                                    mouseout: handleMarkerMouseOut,
                                }}
                            >
                                <Popup className="report-popup">
                                    <div className="popup-content">
                                        <div className={`popup-status status-${report.clientStatus}`}>
                                            {report.status?.libelle || statusLabels[report.clientStatus]}
                                        </div>
                                        <p className="popup-description">{report.description}</p>
                                        <div className="popup-details">
                                            <div className="popup-detail">
                                                <span className="detail-label">Date:</span>
                                                <span className="detail-value">{formatDate(report.createdAt)}</span>
                                            </div>
                                            {report.reparation?.surface_m2 && (
                                                <div className="popup-detail">
                                                    <span className="detail-label">Surface:</span>
                                                    <span className="detail-value">{report.reparation.surface_m2} m²</span>
                                                </div>
                                            )}
                                            {report.reparation?.budget && (
                                                <div className="popup-detail">
                                                    <span className="detail-label">Budget:</span>
                                                    <span className="detail-value">{formatCurrency(report.reparation.budget)}</span>
                                                </div>
                                            )}
                                            {report.reparation?.entreprise_nom && (
                                                <div className="popup-detail">
                                                    <span className="detail-label">Entreprise:</span>
                                                    <span className="detail-value">{report.reparation.entreprise_nom}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
            </MapContainer>

            {/* Légende */}
            <div className="map-legend">
                <h4>Légende</h4>
                <div className="legend-items">
                    <div className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                        <span>Nouveau</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                        <span>En cours</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                        <span>Terminé</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
