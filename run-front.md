# Guide de lancement du projet avec Docker

## Lancement avec Docker

### 1. Construire l'image Docker

```bash
docker build -t signalement-web-app .
```

### 2. Lancer le conteneur

```bash
docker run -p 3000:3000 signalement-web-app
```

### 3. Lancer avec Docker Compose (si disponible)

```bash
docker-compose up
```

Pour lancer en arrière-plan :

```bash
docker-compose up -d
```

### 4. Arrêter les conteneurs

```bash
docker-compose down
```

## Prérequis

- Node.js installé sur votre machine
- npm installé

## Commandes pour lancer le projet

### 1. Installer les dépendances

```bash
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

### 3. Construire pour la production

```bash
npm run build
```

### 4. Lancer en mode production

```bash
npm start
```

## Accès à l'application

Une fois lancée, l'application sera accessible à l'adresse : `http://localhost:3000` (ou le port configuré dans votre projet)

## Résumé rapide

Pour lancer l'application en mode développement :

```bash
npm install && npm run dev
```
