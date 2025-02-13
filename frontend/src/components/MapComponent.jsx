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

const MapComponent = () => {
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plotData, setPlotData] = useState(INITIAL_PLOT_DATA);
  const [error, setError] = useState('');
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const validatePolygon = useCallback((geometry) => {
    try {
      if (!geometry || geometry.type !== 'Polygon') {
        return { valid: false, message: 'La forme doit être un polygone fermé' };
      }

      const coordinates = geometry.coordinates[0];
      if (coordinates.length < 4) {
        return { valid: false, message: 'Le polygone doit avoir au moins 3 points' };
      }

      const polygon = turf.polygon(geometry.coordinates);
      const area = turf.area(polygon);
      if (area < 10) {
        return { valid: false, message: 'La parcelle est trop petite (minimum 10m²)' };
      }

      return { valid: true, area };
    } catch (err) {
      return { valid: false, message: 'Forme invalide' };
    }
  }, []);

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

  const handleDrawCreate = useCallback(
    async (e) => {
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
    },
    [validatePolygon],
  );

  const handleDrawUpdate = useCallback(
    async (e) => {
      const [feature] = e.features;
      const validation = validatePolygon(feature.geometry);

      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      const nearestLocation = await fetchNearestLocation(feature.geometry.coordinates[0]);
      setPlotData((prev) => ({
        ...prev,
        exploitation: nearestLocation,
      }));

      setCurrentPolygon({ ...feature, area: validation.area });
    },
    [validatePolygon],
  );

  useEffect(() => {
    if (mapRef.current && !drawRef.current && mapLoaded) {
      const map = mapRef.current.getMap();
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'simple_select',
        styles: [
          {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['==', '$type', 'Polygon'],
            paint: {
              'fill-color': '#088',
              'fill-outline-color': '#088',
              'fill-opacity': 0.5,
            },
          },
          {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['==', '$type', 'Polygon'],
            paint: {
              'line-color': '#088',
              'line-width': 2,
            },
          },
        ],
      });

      map.addControl(drawRef.current);

      map.on('draw.create', handleDrawCreate);
      map.on('draw.update', handleDrawUpdate);

      return () => {
        if (map && drawRef.current) {
          map.removeControl(drawRef.current);
        }
      };
    }
  }, [mapLoaded, handleDrawCreate, handleDrawUpdate]);

  const handlePlotDataChange = (field) => (event) => {
    setPlotData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const resetState = () => {
    setSelectedPlot(null);
    setPlotData(INITIAL_PLOT_DATA);
    setCurrentPolygon(null);
    setIsDrawing(false);
    setIsEditing(false);
    drawRef.current?.deleteAll();
  };

  const handleSavePlot = useCallback(async () => {
    if (!currentPolygon || !plotData.name) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const plotToSave = {
        name: plotData.name,
        coordinates: currentPolygon.geometry,
        area: currentPolygon.area,
        exploitation: plotData.exploitation,
        crop_type: plotData.crop_type,
      };

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

  const handlePlotSelect = useCallback((plot) => {
    setSelectedPlot(plot);
    setPlotData({
      name: plot.name,
      exploitation: plot.exploitation,
      crop_type: plot.crop_type || '',
    });
    setIsDrawing(false);
    setIsEditing(false);

    // Calculate the bounds of the polygon
    const polygon = turf.polygon(plot.coordinates.coordinates);
    const [minLng, minLat, maxLng, maxLat] = turf.bbox(polygon);
    
    // Calculate the center point
    const center = turf.center(polygon);
    
    // Calculate appropriate zoom level based on the polygon's size
    const bounds = {
      width: Math.abs(maxLng - minLng),
      height: Math.abs(maxLat - minLat)
    };
    
    const maxBound = Math.max(bounds.width, bounds.height);
    let zoom = Math.floor(8 - Math.log2(maxBound));
    
    // Ensure zoom stays within reasonable bounds
    zoom = Math.min(Math.max(zoom, 10), 18);

    // Update viewport with new coordinates and zoom
    setViewport({
      longitude: center.geometry.coordinates[0],
      latitude: center.geometry.coordinates[1],
      zoom: zoom,
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      duration: 1000
    });

    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
  }, []);

  const handleDeletePlot = async (plotToDelete) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette parcelle ?')) {
      try {
        await deletePlot(plotToDelete.id);
        setPlots((prevPlots) => prevPlots.filter((plot) => plot.id !== plotToDelete.id));
        resetState();
      } catch (error) {
        setError('Erreur lors de la suppression de la parcelle');
      }
    }
  };

  const handleEditPlot = (plot) => {
    setIsEditing(true);
    setCurrentPolygon({ geometry: plot.coordinates, area: plot.area });
    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.add(plot.coordinates);
      drawRef.current.changeMode('direct_select', {
        featureId: drawRef.current.getAll().features[0]?.id,
      });
    }
  };

  const renderPlotForm = () => {
    if (!isDrawing && !isEditing) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <TextField
          autoFocus
          margin="dense"
          label="Nom"
          fullWidth
          value={plotData.name}
          onChange={handlePlotDataChange('name')}
          required
        />
        <TextField
          margin="dense"
          label="Nom de l'Exploitation"
          fullWidth
          value={plotData.exploitation}
          onChange={handlePlotDataChange('exploitation')}
          disabled
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Type de culture</InputLabel>
          <Select value={plotData.crop_type} onChange={handlePlotDataChange('crop_type')}>
            <MenuItem value="cereals">Céréales</MenuItem>
            <MenuItem value="vegetables">Légumes</MenuItem>
            <MenuItem value="fruits">Fruits</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Surface: {currentPolygon ? (currentPolygon.area / 10000).toFixed(2) : 0} ha
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSavePlot} sx={{ mr: 1 }}>
            Sauvegarder
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              if (selectedPlot) {
                setIsEditing(false);
                handlePlotSelect(selectedPlot);
              } else {
                resetState();
              }
            }}
          >
            Annuler
          </Button>
        </Box>
      </Box>
    );
  };

  const renderPlotInfo = () => {
    if (isDrawing || isEditing || !selectedPlot) return null;

    return (
      <Box>
        <Typography variant="body1">
          <strong>Nom:</strong> {selectedPlot.name}
        </Typography>
        <Typography variant="body1">
          <strong>Surface:</strong> {(selectedPlot.area / 10000).toFixed(2)} ha
        </Typography>
        <Typography variant="body1">
          <strong>Exploitation:</strong> {selectedPlot.exploitation}
        </Typography>
        <Typography variant="body1">
          <strong>Type de culture:</strong> {selectedPlot.crop_type}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => handleEditPlot(selectedPlot)}
            sx={{ mr: 1 }}
          >
            Modifier
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeletePlot(selectedPlot)}
          >
            Supprimer
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Paper sx={{ width: 300, p: 2, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Mes Exploitations
        </Typography>
        <Tooltip title="Click to start drawing a new plot">
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => {
              resetState();
              if (drawRef.current) {
                drawRef.current.changeMode('draw_polygon');
              }
              setIsDrawing(true);
            }}
            startIcon={<AddIcon />}
          >
            Créer une Parcelle
          </Button>
        </Tooltip>

        <List>
          {Array.isArray(plots) && plots.map((plot) => (
            <ListItem
              key={plot.id}
              sx={{
                bgcolor: selectedPlot?.id === plot.id ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
                cursor: 'pointer',
              }}
              onClick={() => handlePlotSelect(plot)}
            >
              <ListItemText primary={plot.name} secondary={`Surface: ${(plot.area / 10000).toFixed(2)} ha`} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ flex: 1, position: 'relative' }}>
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
            <Source
              key={plot.id}
              type="geojson"
              data={{
                type: 'Feature',
                geometry: plot.coordinates,
                properties: {},
              }}
            >
              <Layer
                id={`fill-${plot.id}`}
                type="fill"
                paint={{
                  'fill-color': selectedPlot?.id === plot.id ? '#f00' : '#088',
                  'fill-opacity': 0.4,
                }}
              />
              <Layer
                id={`line-${plot.id}`}
                type="line"
                paint={{
                  'line-color': selectedPlot?.id === plot.id ? '#f00' : '#088',
                  'line-width': 2,
                }}
              />
            </Source>
          ))}
        </Map>
      </Box>

      <Paper sx={{ width: 300, p: 2, overflowY: 'auto', ml: 2 }}>
      <Typography variant="h6" gutterBottom>
          {isDrawing ? 'Nouvelle Parcelle' : isEditing ? 'Modifier la Parcelle' : 'Informations de la Parcelle'}
        </Typography>
        {renderPlotForm()}
        {renderPlotInfo()}
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapComponent;