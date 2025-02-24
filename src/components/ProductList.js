import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

const ProductList = ({
  products,
  currentPage,
  itemsPerPage,
  onAddToCart,
  onEditProduct,
  onRequestPassword
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);

  return (
    <>
      {paginatedProducts.map(product => (
        <div key={product.id} className="bg-white p-4 rounded shadow">
          <img
            src={product.image_url || 'https://via.placeholder.com/300x200'}
            alt={`Image of ${product.product_name}`}
            className="w-full h-48 object-cover rounded"
          />
          <h2 className="text-xl font-bold mt-2">{product.product_name}</h2>
          <p className="text-gray-700">₹{product.price.toFixed(2)} / lb</p>
          <p className="text-gray-700">Inventory: {product.inventory}</p>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mt-2"
            onClick={() => onAddToCart(product)}
            disabled={product.inventory <= 0}
          >
            Add to Cart
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2 ml-2"
            onClick={() => onRequestPassword(product)}
          >
            <FontAwesomeIcon icon={faEdit} /> Edit
          </button>
        </div>
      ))}
    </>
  );
};

export default ProductList;