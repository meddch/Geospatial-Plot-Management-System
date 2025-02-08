FROM python:3.9

# Install PostGIS dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    postgis \
    gdal-bin \
    libgdal-dev

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# Run migrations and start server
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]