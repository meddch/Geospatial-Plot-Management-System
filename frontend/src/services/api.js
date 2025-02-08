import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const fetchPlots = async () => {
  try {
    const response = await axios.get(`${API_URL}/plots/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plots:', error);
    throw error;
  }
};

export const createPlot = async (plotData) => {
  try {
    const response = await axios.post(`${API_URL}/plots/`, plotData);
    return response.data;
  } catch (error) {
    console.error('Error creating plot:', error);
    throw error;
  }
};

export const deletePlot = async (plotId) => {
  try {
    await axios.delete(`${API_URL}/plots/${plotId}/`);
  } catch (error) {
    console.error('Error deleting plot:', error);
    throw error;
  }
}; 