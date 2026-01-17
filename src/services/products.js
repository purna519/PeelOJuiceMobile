import api from './api';

// Get all categories
export const getCategories = async () => {
  const response = await api.get('/products/categories/');
  return response.data;
};

// Get juices (optionally filter by category)
export const getJuices = async categoryId => {
  let url = '/products/juices/?page_size=100'; // Request 100 items per page
  if (categoryId) {
    url += `&category_id=${categoryId}`; // Backend expects 'category_id' not 'category'
  }
  const response = await api.get(url);
  // Backend returns paginated response with 'results' array
  return response.data.results || response.data;
};

// Get juice detail by ID
export const getJuiceDetail = async id => {
  const response = await api.get(`/products/juices/${id}/`);
  return response.data;
};

// Get branches
export const getBranches = async () => {
  const response = await api.get('/products/branches/');
  return response.data;
};
