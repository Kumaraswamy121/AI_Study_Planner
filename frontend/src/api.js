/**
 * api.js - Axios instance and API helper functions.
 * All backend communication goes through this file.
 */

import axios from 'axios';

// Base URL for the Flask backend - Uses environment variable or defaults to localhost
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, 
});

// ---- Study Plans ----

/** Create a new study plan */
export const createPlan = (data) => API.post('/plans', data);

/** Get all saved plans */
export const getPlans = () => API.get('/plans');

/** Get a specific plan by ID */
export const getPlan = (id) => API.get(`/plans/${id}`);

/** Delete a plan */
export const deletePlan = (id) => API.delete(`/plans/${id}`);

/** Export a plan as PDF */
export const exportPlan = (id) => API.get(`/plans/${id}/export`, { responseType: 'blob' });

// ---- Progress ----

/** Get progress for a specific plan */
export const getProgress = (planId) => API.get(`/plans/${planId}/progress`);

/** Toggle task completion */
export const toggleTask = (progressId) => API.patch(`/progress/${progressId}/toggle`);

/** Update a progress entry (edit timetable) */
export const updateEntry = (progressId, data) => API.patch(`/progress/${progressId}`, data);

/** AI Topic Suggestions */
export const suggestTopics = (subject_name) => API.post('/ai/suggest', { subject_name });

// ---- Reminders ----

/** Get reminders for a plan */
export const getReminders = (planId) => API.get(`/plans/${planId}/reminders`);

/** Create a new reminder */
export const createReminder = (planId, data) => API.post(`/plans/${planId}/reminders`, data);

/** Delete a reminder */
export const deleteReminder = (reminderId) => API.delete(`/reminders/${reminderId}`);

/** Dismiss a reminder */
export const dismissReminder = (reminderId) => API.patch(`/reminders/${reminderId}/dismiss`);

export default API;
