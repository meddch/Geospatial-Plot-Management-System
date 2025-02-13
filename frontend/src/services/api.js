import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const fetchPlots = async () => {
  console.log(API_URL);
  const response = await axios.get(API_URL);
  return response.data;
};

export const createPlot = async (plot) => {
  const response = await axios.post(API_URL, plot);
  return response.data;
};

export const updatePlot = async (id, plot) => {
  const response = await axios.put(`${API_URL}${id}/`, plot);
  return response.data;
};

export const deletePlot = async (id) => {
  const response = await axios.delete(`${API_URL}${id}/`);
  return response.data;
};