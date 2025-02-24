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
  // Calculate the indexes of the first and last item to display on the current page
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;

  // Slice the products array to get only the items for the current page
  const currentItems = products.slice(firstItemIndex, lastItemIndex);

  return (
    <>
      {currentItems.map((product) => (
        <div key={product.id} className="border p-4 rounded shadow-md">
          <img
            src={product.image_url || 'https://via.placeholder.com/300x200'}
            alt={`Image of ${product.product_name}`}
            className="w-full h-48 object-cover mb-4 rounded"
          />
          <h3 className="text-xl font-semibold mb-2">{product.product_name}</h3>
          <p className="text-gray-700 mb-2">
            Price: ₹{product.price != null ? product.price.toFixed(2) : '0.00'}
          </p>
          <p className="text-gray-700 mb-2">Inventory: {product.inventory} kg</p>
          <div className="flex justify-between items-center">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => onAddToCart(product)}
              disabled={product.inventory <= 0}
            >
              Add to Cart
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => onRequestPassword(product)}
            >
              <FontAwesomeIcon icon={faEdit} /> Edit
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductList;