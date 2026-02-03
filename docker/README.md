# Serveur de cartes hors ligne - Antananarivo

Ce guide explique comment installer et configurer un serveur de cartes hors ligne pour la ville d'Antananarivo.

## Prérequis

- Docker et Docker Compose installés
- Environ 500 Mo d'espace disque pour les données de carte

## Installation

### 1. Créer le dossier pour les données de carte

```bash
mkdir -p docker/map-data
```

### 2. Télécharger les données de Madagascar/Antananarivo

Option A - Télécharger Madagascar complet (recommandé) :
```bash
# Télécharger le fichier MBTiles de Madagascar depuis OpenMapTiles
cd docker/map-data
wget https://download.maptiler.com/osm/africa/madagascar.mbtiles -O madagascar.mbtiles
```

Option B - Utiliser un extrait plus petit via Protomaps :
```bash
cd docker/map-data
# Antananarivo bbox: 47.4,-19.0,47.6,-18.8
wget "https://build.protomaps.com/20240101.pmtiles" -O antananarivo.pmtiles
```

Option C - Télécharger depuis Geofabrik et convertir :
```bash
# Télécharger les données OSM de Madagascar
wget https://download.geofabrik.de/africa/madagascar-latest.osm.pbf

# Utiliser tilemaker pour convertir en MBTiles (nécessite tilemaker installé)
tilemaker --input madagascar-latest.osm.pbf --output madagascar.mbtiles
```

### 3. Créer le fichier de configuration

Le fichier `config.json` est créé automatiquement, mais vous pouvez le personnaliser :

```json
{
  "options": {
    "paths": {
      "root": "/data",
      "fonts": "fonts",
      "sprites": "sprites",
      "styles": "styles",
      "mbtiles": ""
    }
  },
  "styles": {},
  "data": {
    "antananarivo": {
      "mbtiles": "madagascar.mbtiles"
    }
  }
}
```

### 4. Démarrer le serveur

```bash
cd docker
docker-compose up -d
```

### 5. Vérifier l'installation

Ouvrez votre navigateur et accédez à :
- http://localhost:8080 - Interface de prévisualisation
- http://localhost:8080/styles/basic-preview/style.json - Style JSON
- http://localhost:8080/data/antananarivo.json - Métadonnées des tuiles

## Endpoints disponibles

| Endpoint | Description |
|----------|-------------|
| `http://localhost:8080` | Interface web de prévisualisation |
| `http://localhost:8080/styles/{style}/style.json` | Fichier de style Mapbox GL |
| `http://localhost:8080/data/{tileset}.json` | Métadonnées TileJSON |
| `http://localhost:8080/data/{tileset}/{z}/{x}/{y}.pbf` | Tuiles vectorielles |

## Intégration avec React

Voir le composant `MapView` dans `src/components/Map/` pour l'intégration avec l'application React.

## Ressources alternatives pour les données

1. **OpenMapTiles** : https://openmaptiles.org/
2. **Protomaps** : https://protomaps.com/
3. **Geofabrik** : https://download.geofabrik.de/africa/madagascar.html
4. **BBBike Extract** : https://extract.bbbike.org/ (extrait personnalisé)

## Dépannage

### Le serveur ne démarre pas
```bash
docker logs tileserver-antananarivo
```

### Les tuiles ne s'affichent pas
- Vérifiez que le fichier .mbtiles existe dans `docker/map-data/`
- Vérifiez les permissions du fichier

### Réduire la taille des données
Utilisez `osmium` pour extraire uniquement Antananarivo :
```bash
osmium extract -b 47.4,-19.0,47.6,-18.8 madagascar-latest.osm.pbf -o antananarivo.osm.pbf
```
