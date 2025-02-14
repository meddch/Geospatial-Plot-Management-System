## **Project Overview**

This project is a **geospatial application** that allows users to:

1. **Draw and manage plots** (polygons) on an interactive map.
2. **Save, edit, and delete** plots with details like name, area, exploitation, and crop type.
3. **View plot information** in a sidebar.
4. **Integrate with a Django backend** using Django REST Framework (DRF) for data persistence.

The project is **fully dockerized** for easy deployment and development.

---

## **Frontend: `MapComponent`**

### **1. Libraries Used**

- **React**: A JavaScript library for building user interfaces.
- **React Map GL**: A wrapper for Mapbox GL JS, providing React components for maps.
- **Mapbox GL Draw**: A plugin for Mapbox GL JS that allows users to draw and edit shapes on the map.
- **Turf.js**: A geospatial analysis library for calculating areas, distances, and other geospatial operations.
- **Material-UI (MUI)**: A React UI framework for building responsive and visually appealing components.
- **Axios**: A promise-based HTTP client for making API requests.
- **Mapbox GL CSS**: Styles for Mapbox GL JS and Mapbox GL Draw.

---

### **2. Environment Variables**

- `VITE_MAP_BOX_TOKEN`: A Mapbox access token required for using Mapbox services. This should be stored in a `.env` file.

---

### **3. Code Breakdown**

### **Imports**

```jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import {
  TextField,
  Button,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { fetchPlots, createPlot, deletePlot, updatePlot } from '../services/api';

```

- **React Hooks**: `useState`, `useCallback`, `useRef`, and `useEffect` are used for state management and side effects.
- **React Map GL**: Components for rendering the map and layers.
- **Mapbox Draw**: For drawing and editing polygons.
- **Turf.js**: For geospatial calculations (e.g., area of a polygon).
- **Material-UI**: Components for building the UI (e.g., buttons, text fields, lists).
- **Axios**: For making HTTP requests to the backend API.
- **CSS**: Styles for Mapbox GL JS and Mapbox GL Draw.

---

### **Constants**

```jsx
const MAPBOX_TOKEN = import.meta.env.VITE_MAP_BOX_TOKEN;

const INITIAL_VIEWPORT = {
  latitude: 33.9716,
  longitude: -6.8498,
  zoom: 10,
};

const INITIAL_PLOT_DATA = {
  name: '',
  exploitation: '',
  crop_type: '',
};

```

- **MAPBOX_TOKEN**: The Mapbox access token loaded from the environment.
- **INITIAL_VIEWPORT**: Default map viewport (latitude, longitude, and zoom level).
- **INITIAL_PLOT_DATA**: Default values for a new plot.

---

### **State Management**

```jsx
const [mapLoaded, setMapLoaded] = useState(false);
const [viewport, setViewport] = useState(INITIAL_VIEWPORT);
const [plots, setPlots] = useState([]);
const [selectedPlot, setSelectedPlot] = useState(null);
const [plotData, setPlotData] = useState(INITIAL_PLOT_DATA);
const [error, setError] = useState('');
const [currentPolygon, setCurrentPolygon] = useState(null);
const [isDrawing, setIsDrawing] = useState(false);
const [isEditing, setIsEditing] = useState(false);

```

- **mapLoaded**: Tracks whether the map has finished loading.
- **viewport**: Stores the current map viewport (latitude, longitude, zoom).
- **plots**: Stores the list of plots fetched from the backend.
- **selectedPlot**: Stores the currently selected plot.
- **plotData**: Stores the form data for a plot (name, exploitation, crop type).
- **error**: Stores error messages for displaying alerts.
- **currentPolygon**: Stores the currently drawn or edited polygon.
- **isDrawing**: Tracks whether the user is in drawing mode.
- **isEditing**: Tracks whether the user is in edit mode.

---

### **Effects**

### **Fetch Plots on Mount**

```jsx
useEffect(() => {
  const loadPlots = async () => {
    try {
      const data = await fetchPlots();
      setPlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading plots:', err);
      setError('Error loading plots');
      setPlots([]);
    }
  };
  loadPlots();
}, []);

```

- Fetches the list of plots from the backend when the component mounts.

### **Initialize Mapbox Draw**

```jsx
useEffect(() => {
  if (mapRef.current && !drawRef.current && mapLoaded) {
    const map = mapRef.current.getMap();
    drawRef.current = new MapboxDraw({ ... });
    map.addControl(drawRef.current);
    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
  }
}, [mapLoaded, handleDrawCreate, handleDrawUpdate]);

```

- Initializes Mapbox Draw when the map is loaded and sets up event listeners for drawing and updating polygons.

---

### **Helper Functions**

### **Validate Polygon**

```jsx
const validatePolygon = useCallback((geometry) => {
  if (!geometry || geometry.type !== 'Polygon') {
    return { valid: false, message: 'La forme doit être un polygone fermé' };
  }
  // Additional validation logic...
}, []);

```

- Validates whether the drawn shape is a valid polygon.

### **Fetch Nearest Location**

```jsx
const fetchNearestLocation = async (coordinates) => {
  const [lng, lat] = coordinates[0];
  const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`, {
    params: {
      access_token: MAPBOX_TOKEN,
      limit: 1,
    },
  });
  return response.data.features[0]?.place_name || 'Unknown Location';
};

```

- Fetches the nearest location name using Mapbox's geocoding API.

---

### **Event Handlers**

### **Handle Draw Create**

```jsx
const handleDrawCreate = useCallback(async (e) => {
  const [feature] = e.features;
  const validation = validatePolygon(feature.geometry);
  if (!validation.valid) {
    setError(validation.message);
    drawRef.current?.deleteAll();
    return;
  }
  const nearestLocation = await fetchNearestLocation(feature.geometry.coordinates[0]);
  setPlotData((prev) => ({
    ...prev,
    exploitation: nearestLocation,
  }));
  setCurrentPolygon({ ...feature, area: validation.area });
  setIsDrawing(true);
  setSelectedPlot(null);
}, [validatePolygon]);

```

- Handles the creation of a new polygon and sets the plot data.

### **Handle Save Plot**

```jsx
const handleSavePlot = useCallback(async () => {
  if (!currentPolygon || !plotData.name) {
    setError('Veuillez remplir tous les champs obligatoires');
    return;
  }
  try {
    const plotToSave = { ... };
    if (selectedPlot) {
      const updatedPlot = await updatePlot(selectedPlot.id, plotToSave);
      setPlots((prev) => prev.map((plot) => (plot.id === updatedPlot.id ? updatedPlot : plot)));
    } else {
      const newPlot = await createPlot(plotToSave);
      setPlots((prev) => [...prev, newPlot]);
    }
    resetState();
  } catch (error) {
    setError('Erreur lors de la sauvegarde de la parcelle');
  }
}, [currentPolygon, plotData, selectedPlot]);

```

- Saves or updates a plot and resets the state.

---

### **UI Components**

### **Plot List**

```jsx
<List>
  {plots.map((plot) => (
    <ListItem key={plot.id} onClick={() => handlePlotSelect(plot)}>
      <ListItemText primary={plot.name} secondary={`Surface: ${(plot.area / 10000).toFixed(2)} ha`} />
    </ListItem>
  ))}
</List>

```

- Displays a list of plots with their names and areas.

### **Plot Form**

```jsx
<Box sx={{ mt: 2 }}>
  <TextField label="Nom" value={plotData.name} onChange={handlePlotDataChange('name')} />
  <TextField label="Exploitation" value={plotData.exploitation} disabled />
  <FormControl fullWidth>
    <InputLabel>Type de culture</InputLabel>
    <Select value={plotData.crop_type} onChange={handlePlotDataChange('crop_type')}>
      <MenuItem value="cereals">Céréales</MenuItem>
      <MenuItem value="vegetables">Légumes</MenuItem>
      <MenuItem value="fruits">Fruits</MenuItem>
    </Select>
  </FormControl>
  <Button onClick={handleSavePlot}>Sauvegarder</Button>
</Box>

```

- Displays a form for entering or editing plot details.

---

### **Map Rendering**

```jsx
<Map
  ref={mapRef}
  {...viewport}
  onMove={(evt) => setViewport(evt.viewState)}
  mapStyle="mapbox://styles/mapbox/streets-v11"
  mapboxAccessToken={MAPBOX_TOKEN}
  style={{ width: '100%', height: '100%' }}
  onLoad={() => setMapLoaded(true)}
>
  <NavigationControl position="top-right" />
  {plots.map((plot) => (
    <Source key={plot.id} type="geojson" data={{ type: 'Feature', geometry: plot.coordinates }}>
      <Layer id={`fill-${plot.id}`} type="fill" paint={{ 'fill-color': '#088', 'fill-opacity': 0.4 }} />
      <Layer id={`line-${plot.id}`} type="line" paint={{ 'line-color': '#088', 'line-width': 2 }} />
    </Source>
  ))}
</Map>

```

- Renders the Mapbox map with navigation controls and plot layers.

---

### **Error Handling**

```jsx
<Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
  <Alert onClose={() => setError('')} severity="error">
    {error}
  </Alert>
</Snackbar>

```

- Displays error messages in a snackbar.

---

## **Backend: Django Models and Serializers**

### **1. Models**

```python
from django.contrib.gis.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

class Plot(models.Model):
    # Crop type choices
    class CropType(models.TextChoices):
        CEREALS = 'cereals', _('Cereals')
        VEGETABLES = 'vegetables', _('Vegetables')
        FRUITS = 'fruits', _('Fruits')
        OTHER = 'other', _('Other')

    # Fields
    name = models.CharField(max_length=255, unique=True, verbose_name=_('Plot Name'))
    coordinates = models.GeometryField(srid=4326, verbose_name=_('Coordinates'))
    area = models.FloatField(validators=[MinValueValidator(0)], verbose_name=_('Area (ha)'))
    exploitation = models.CharField(max_length=255, default='', verbose_name=_('Exploitation'))
    crop_type = models.CharField(
        max_length=255,
        choices=CropType.choices,
        blank=True,
        verbose_name=_('Crop Type')
    )
    has_manager = models.BooleanField(default=False, verbose_name=_('Has Manager'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    # Custom manager
    objects = models.Manager()

    class Meta:
        verbose_name = _('Plot')
        verbose_name_plural = _('Plots')
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['exploitation']),
            models.Index(fields=['crop_type']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Add custom logic before saving (if needed)
        super().save(*args, **kwargs)

```

- **Plot Model**: Represents a plot with fields like `name`, `coordinates`, `area`, `exploitation`, and `crop_type`.

---

### **2. Serializers**

```python
from rest_framework import serializers
from django.contrib.gis.geos import GEOSGeometry, GEOSException
from .models import Plot
import json

class PlotSerializer(serializers.ModelSerializer):
    coordinates = serializers.JSONField()

    class Meta:
        model = Plot
        fields = ['id', 'name', 'coordinates', 'area', 'exploitation',
                 'crop_type', 'has_manager', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Convert GeoJSON to GEOS geometry
        geojson = validated_data.pop('coordinates')
        try:
            coordinates = GEOSGeometry(str(geojson))  # Convert GeoJSON to GEOS geometry
        except GEOSException as e:
            raise serializers.ValidationError({'coordinates': 'Invalid GeoJSON data.'})
        return Plot.objects.create(coordinates=coordinates, **validated_data)

    def update(self, instance, validated_data):
        geojson = validated_data.pop('coordinates', None)
        if geojson:
            try:
                coordinates = GEOSGeometry(str(geojson))  # Convert GeoJSON to GEOS geometry
                instance.coordinates = coordinates
            except GEOSException as e:
                raise serializers.ValidationError({'coordinates': 'Invalid GeoJSON data.'})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        # Convert GEOS geometry to GeoJSON
        representation = super().to_representation(instance)
        representation['coordinates'] = json.loads(instance.coordinates.json)  # Safe conversion
        return representation

```

- **PlotSerializer**: Handles serialization and deserialization of `Plot` objects, including GeoJSON conversion.