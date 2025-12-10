import axios from 'axios';

// Base URL injected by Vite from environment variable
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Axios instance with baseURL (if API_BASE is empty, axios will use relative paths)
export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export default api;
