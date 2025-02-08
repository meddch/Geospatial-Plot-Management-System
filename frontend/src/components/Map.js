import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Paper
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { fetchPlots, createPlot, deletePlot } from '../services/api';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const MapComponent = () => {
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewport, setViewport] = useState({
    latitude: 33.9716,
    longitude: -6.8498,
    zoom: 15
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [plots, setPlots] = useState(() => {
    const savedPlots = localStorage.getItem('plots');
    return savedPlots ? JSON.parse(savedPlots) : [];
  });
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [plotData, setPlotData] = useState({
    name: '',
    exploitation: 'Bouskoura',
    cropType: '',
    hasManager: false
  });
  const [error, setError] = useState('');
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('plots', JSON.stringify(plots));
  }, [plots]);

  // Load plots from backend on mount
  useEffect(() => {
    const loadPlots = async () => {
      try {
        const data = await fetchPlots();
        setPlots(data);
      } catch (error) {
        setError('Erreur lors du chargement des parcelles');
      }
    };
    loadPlots();
  }, []);

  const validatePolygon = useCallback((geometry) => {
    try {
      if (geometry.type !== 'Polygon') {
        return { valid: false, message: 'La forme doit être un polygone fermé' };
      }

      if (geometry.coordinates[0].length < 4) {
        return { valid: false, message: 'Le polygone doit avoir au moins 3 points' };
      }

      const coordinates = geometry.coordinates[0];
      if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
          coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
        return { valid: false, message: 'Le polygone doit être fermé' };
      }

      const polygon = turf.polygon(geometry.coordinates);
      const kinks = turf.kinks(polygon);
      if (kinks.features.length > 0) {
        return { valid: false, message: 'Le polygone ne doit pas s\'intersecter' };
      }

      const area = turf.area(polygon);
      if (area < 100) {
        return { valid: false, message: 'La parcelle est trop petite (minimum 100m²)' };
      }

      return { valid: true, area };
    } catch (err) {
      return { valid: false, message: 'Forme invalide' };
    }
  }, []);

  const handleDrawCreate = useCallback((e) => {
    const [feature] = e.features;
    const validation = validatePolygon(feature.geometry);
    
    if (!validation.valid) {
      setError(validation.message);
      if (drawRef.current) {
        drawRef.current.deleteAll();
        drawRef.current.changeMode('draw_polygon');
      }
      return;
    }

    setCurrentPolygon({ ...feature, area: validation.area });
    setOpenDialog(true);
    setIsDrawing(false);
  }, [validatePolygon]);

  const handleDrawUpdate = useCallback((e) => {
    const [feature] = e.features;
    const validation = validatePolygon(feature.geometry);
    
    if (!validation.valid) {
      setError(validation.message);
      if (drawRef.current) {
        drawRef.current.deleteAll();
        drawRef.current.changeMode('draw_polygon');
      }
      return;
    }

    setCurrentPolygon({ ...feature, area: validation.area });
  }, [validatePolygon]);

  const handleDrawDelete = useCallback(() => {
    setCurrentPolygon(null);
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    if (mapRef.current && !drawRef.current && mapLoaded) {
      const map = mapRef.current.getMap();
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select',
        styles: [
          {
            'id': 'gl-draw-polygon-and-line-vertex-active',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            'paint': {
              'circle-radius': 7,
              'circle-color': '#fff',
              'circle-stroke-color': '#000',
              'circle-stroke-width': 2
            }
          },
          {
            'id': 'gl-draw-polygon-fill',
            'type': 'fill',
            'filter': ['==', '$type', 'Polygon'],
            'paint': {
              'fill-color': '#088',
              'fill-outline-color': '#088',
              'fill-opacity': 0.5
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-active',
            'type': 'line',
            'filter': ['==', '$type', 'Polygon'],
            'paint': {
              'line-color': '#088',
              'line-width': 2
            }
          }
        ]
      });
      
      map.addControl(drawRef.current);

      map.on('draw.create', handleDrawCreate);
      map.on('draw.delete', handleDrawDelete);
      map.on('draw.update', handleDrawUpdate);

      return () => {
        if (map && drawRef.current) {
          map.removeControl(drawRef.current);
        }
      };
    }
  }, [mapLoaded, handleDrawCreate, handleDrawDelete, handleDrawUpdate]);

  const handleStartDrawing = useCallback(() => {
    if (drawRef.current && mapLoaded) {
      setIsDrawing(true);
      drawRef.current.deleteAll();
      drawRef.current.changeMode('draw_polygon');
    }
  }, [mapLoaded]);

  const handleStopDrawing = useCallback(() => {
    if (drawRef.current && mapLoaded) {
      setIsDrawing(false);
      drawRef.current.changeMode('simple_select');
    }
  }, [mapLoaded]);

  const handlePlotDataChange = (field) => (event) => {
    setPlotData(prev => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }));
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
        cropType: plotData.cropType,
        hasManager: plotData.hasManager
      };

      const savedPlot = await createPlot(plotToSave);
      setPlots(prevPlots => [...prevPlots, savedPlot]);
      setPlotData({
        name: '',
        exploitation: 'Bouskoura',
        cropType: '',
        hasManager: false
      });
      setOpenDialog(false);
      setCurrentPolygon(null);
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }
    } catch (error) {
      setError('Erreur lors de la sauvegarde de la parcelle');
    }
  }, [currentPolygon, plotData]);

  const handleDeletePlot = useCallback(async (plotToDelete) => {
    try {
      await deletePlot(plotToDelete.id);
      setPlots(prevPlots => prevPlots.filter(plot => plot.id !== plotToDelete.id));
      if (selectedPlot?.id === plotToDelete.id) {
        setSelectedPlot(null);
      }
    } catch (error) {
      setError('Erreur lors de la suppression de la parcelle');
    }
  }, [selectedPlot]);

  const handlePlotSelect = (plot) => {
    setSelectedPlot(plot);
    // Calculate bounds
    const coordinates = plot.coordinates.coordinates[0];
    const bounds = coordinates.reduce(
      (bounds, coord) => {
        return {
          minLng: Math.min(bounds.minLng, coord[0]),
          maxLng: Math.max(bounds.maxLng, coord[0]),
          minLat: Math.min(bounds.minLat, coord[1]),
          maxLat: Math.max(bounds.maxLat, coord[1])
        };
      },
      {
        minLng: coordinates[0][0],
        maxLng: coordinates[0][0],
        minLat: coordinates[0][1],
        maxLat: coordinates[0][1]
      }
    );

    // Center the viewport on the plot
    setViewport({
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      longitude: (bounds.minLng + bounds.maxLng) / 2,
      zoom: 15,
      transitionDuration: 1000
    });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left Sidebar */}
      <Paper sx={{ width: 300, p: 2, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Mes Exploitations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
          onClick={handleStartDrawing}
          startIcon={<AddIcon />}
        >
          Créer une Parcelle
        </Button>
        <List>
          {plots.map((plot) => (
            <ListItem
              key={plot.id}
              sx={{
                bgcolor: selectedPlot?.id === plot.id ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemText
                primary={plot.name}
                secondary={`Surface: ${(plot.area / 10000).toFixed(2)} ha`}
                onClick={() => handlePlotSelect(plot)}
              />
              <IconButton onClick={() => setEditMode(true)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDeletePlot(plot)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Map
          ref={mapRef}
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/satellite-v9"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onLoad={() => setMapLoaded(true)}
          initialViewState={viewport}
        >
          <NavigationControl position="top-right" />
          {plots.map((plot) => (
            <Source
              key={plot.id}
              type="geojson"
              data={{
                type: 'Feature',
                geometry: plot.coordinates,
                properties: {}
              }}
            >
              <Layer
                id={`fill-${plot.id}`}
                type="fill"
                paint={{
                  'fill-color': selectedPlot?.id === plot.id ? '#f00' : '#088',
                  'fill-opacity': 0.4
                }}
              />
              <Layer
                id={`line-${plot.id}`}
                type="line"
                paint={{
                  'line-color': selectedPlot?.id === plot.id ? '#f00' : '#088',
                  'line-width': 2
                }}
              />
            </Source>
          ))}
        </Map>
      </Box>

      {/* Plot Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Modifier la Parcelle' : 'Nouvelle Parcelle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom"
            fullWidth
            value={plotData.name}
            onChange={handlePlotDataChange('name')}
          />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Surface: {currentPolygon ? (currentPolygon.area / 10000).toFixed(2) : 0} ha
          </Typography>
          <FormControl fullWidth margin="dense">
            <InputLabel>Nom de l'Exploitation</InputLabel>
            <Select
              value={plotData.exploitation}
              onChange={handlePlotDataChange('exploitation')}
            >
              <MenuItem value="Bouskoura">Bouskoura</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Type de culture</InputLabel>
            <Select
              value={plotData.cropType}
              onChange={handlePlotDataChange('cropType')}
            >
              <MenuItem value="cereals">Céréales</MenuItem>
              <MenuItem value="vegetables">Légumes</MenuItem>
              <MenuItem value="fruits">Fruits</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={plotData.hasManager}
                onChange={handlePlotDataChange('hasManager')}
              />
            }
            label="Ajouter un Chef de Parcelle"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setPlotData({
              name: '',
              exploitation: 'Bouskoura',
              cropType: '',
              hasManager: false
            });
            setEditMode(false);
          }}>
            Annuler
          </Button>
          <Button onClick={handleSavePlot} variant="contained" color="primary">
            {editMode ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
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