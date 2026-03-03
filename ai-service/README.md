# Ankece AI Service - Guide de démarrage

Ce service Python utilise FastAPI pour fournir des analyses avancées de reconnaissance de mouvement pour l'application Ankece.

## Installation

1. Assurez-vous d'avoir Python 3.9+ installé.
2. Naviguez dans le dossier `ai-service`.
3. Créez un environnement virtuel :
   ```bash
   python -m venv venv
   source venv/bin/activate  # Sur Windows: venv\Scripts\activate
   ```
4. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

## Lancement

Lancez le serveur avec Uvicorn :
```bash
python main.py
```
Le serveur sera disponible sur `http://localhost:8000`.

## Endpoints

- `GET /` : Vérifie si le service est en ligne.
- `POST /analyze-shot` : Envoie une image pour analyse de tir.
