import api from './api';

// Get all branches
export const getBranches = async () => {
  const response = await api.get('/products/branches/');
  return response.data;
};

// Get products available at a specific branch with pagination
export const getBranchProducts = async (branchId, categoryId = null, page = 1, pageSize = 20) => {
  const params = {page, page_size: pageSize};
  if (categoryId) {
    params.category_id = categoryId;
  }
  const response = await api.get(`/products/branches/${branchId}/products/`, {params});
  return response.data;
};
