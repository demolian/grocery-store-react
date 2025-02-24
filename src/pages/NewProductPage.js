//// filepath: /e:/react-js-application/grocery-store/src/pages/NewProductPage.js
import React from 'react';
import NewProductForm from '../components/NewProductForm';
import { Route } from 'react-router-dom';

const NewProductPage = ({
  onAddNewProduct = () => {},
  existingProducts = []
}) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <NewProductForm onAddNewProduct={onAddNewProduct} existingProducts={existingProducts} />
    </div>
  );
};

const AppRoutes = ({ addNewProduct, products }) => (
  <Route
    path="/new-product"
    element={
      <NewProductPage
        onAddNewProduct={addNewProduct}
        existingProducts={products.map((p) => p.product_name)}
      />
    }
  />
);

export default NewProductPage;