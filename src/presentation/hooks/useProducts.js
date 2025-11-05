import { useState, useEffect, useCallback } from 'react';
import {
  listProductsUseCase,
  createProductUseCase,
  updateProductUseCase,
  deleteProductUseCase
} from '../../infrastructure/services/useCasesService.js';
import { toast } from '../components/common/Toaster.jsx';
import { confirm } from '../components/common/ConfirmDialog.jsx';

/**
 * Custom Hook: useProducts
 * Quản lý state và operations cho Products
 */
export function useProducts({ accessibleProjectIds = '*', projectId = null, clientId = null } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products
  const loadProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listProductsUseCase.execute({
        ...filters,
        accessibleProjectIds,
        projectId,
        clientId
      });
      setProducts(result);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message);
      toast.error('Lỗi tải danh sách sản phẩm: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [accessibleProjectIds, projectId, clientId]);

  // Create product
  const createProduct = useCallback(async (productData, user) => {
    try {
      const newProduct = await createProductUseCase.execute(productData, user);
      await loadProducts(); // Reload list
      toast.success('Đã tạo sản phẩm thành công!');
      return newProduct;
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Lỗi tạo sản phẩm: ' + err.message);
      throw err;
    }
  }, [loadProducts]);

  // Update product
  const updateProduct = useCallback(async (id, productData, user) => {
    try {
      const updatedProduct = await updateProductUseCase.execute(id, productData, user);
      await loadProducts(); // Reload list
      toast.success('Đã cập nhật sản phẩm thành công!');
      return updatedProduct;
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Lỗi cập nhật sản phẩm: ' + err.message);
      throw err;
    }
  }, [loadProducts]);

  // Delete product
  const deleteProduct = useCallback(async (id) => {
    const confirmed = await confirm('Xóa sản phẩm này?');
    if (!confirmed) return;

    try {
      await deleteProductUseCase.execute(id);
      await loadProducts(); // Reload list
      toast.success('Đã xóa sản phẩm thành công!');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Lỗi xóa sản phẩm: ' + err.message);
      throw err;
    }
  }, [loadProducts]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh: loadProducts
  };
}

