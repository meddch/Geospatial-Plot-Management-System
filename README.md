# Geospatial Plot Management System 🗺️

A full-stack dockerized application for managing and visualizing geospatial plots with an interactive map interface. The system allows users to draw, edit, and manage agricultural plots while storing their geographical data and attributes.

## Features ✨

- Interactive map interface with drawing tools for plot creation
- Real-time area calculation and location detection
- Plot management (create, read, update, delete)
- Detailed plot information tracking (name, exploitation, crop type)
- Responsive design with Material-UI components
- Full backend API with Django REST Framework
- GeoDjango integration for spatial operations
- Docker containerization for easy deployment

## Prerequisites 📋

Before you begin, ensure you have the following installed:
- Docker
- Docker Compose
- A valid Mapbox API token

## Environment Setup 🔧

1. Clone the repository:
```bash
git clone <repository-url>
cd geospatial-plot-system
```

2. Create environment files:

Frontend (.env):
```bash
VITE_MAP_BOX_TOKEN=your_mapbox_token_here
VITE_API_URL=http://localhost:8000/api/plots/
```

Backend (.env):
```bash
DEBUG=1
SECRET_KEY=your_secret_key_here
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgis://postgres:postgres@db:5432/plots_db
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Docker Setup 🐳

The project includes three main services:
- Frontend (React)
- Backend (Django)
- Database (PostGIS)

1. Build and start the containers:
```bash
docker compose up --build
```

2. Run database migrations:
```bash
docker compose exec backend python manage.py migrate
```

3. Create a superuser (optional):
```bash
docker compose exec backend python manage.py createsuperuser
```

## Services and Ports 🔌

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432


## Project Structure 📁

```
.
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    └── src/
```

## API Endpoints 🛣️

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plots/` | GET | List all plots |
| `/api/plots/` | POST | Create a new plot |
| `/api/plots/{id}/` | GET | Retrieve a specific plot |
| `/api/plots/{id}/` | PUT | Update a specific plot |
| `/api/plots/{id}/` | DELETE | Delete a specific plot |

## Development 🔧

To run the project in development mode:

1. Start development containers:
```bash
docker compose -f docker-compose.dev.yml up --build
```

2. Watch logs:
```bash
docker compose logs -f
```

## Production Deployment 🚀

1. Update the production environment variables
2. Build and deploy:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Troubleshooting 🔍

Common issues and solutions:

1. **Database connection issues**
   - Ensure PostGIS container is running: `docker compose ps`
   - Check database logs: `docker compose logs db`

2. **Map not loading**
   - Verify Mapbox token in frontend .env file
   - Check browser console for errors

3. **API connection errors**
   - Ensure CORS settings are correct
   - Verify API URL in frontend environment



