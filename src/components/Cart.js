import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const Cart = ({
  cart,
  updateCartItemQuantity,
  removeFromCart,
  exportToExcel,
  exportToPDF,
  checkout
}) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-2">Product</th>
            <th className="text-left p-2">Price</th>
            <th className="text-left p-2">Quantity</th>
            <th className="text-left p-2">Total</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cart.map(item => (
            <tr key={item.product}>
              <td className="p-2">{item.product}</td>
              <td className="p-2">₹{item.price.toFixed(2)}</td>
              <td className="p-2 flex items-center">
                <button
                  className="bg-gray-300 text-black px-2 py-1 rounded"
                  onClick={() =>
                    updateCartItemQuantity(item.product, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="mx-2">{item.quantity}</span>
                <button
                  className="bg-gray-300 text-black px-2 py-1 rounded"
                  onClick={() =>
                    updateCartItemQuantity(item.product, item.quantity + 1)
                  }
                >
                  +
                </button>
              </td>
              <td className="p-2">₹{(item.price * item.quantity).toFixed(2)}</td>
              <td className="p-2">
                <button
                  className="text-red-600"
                  onClick={() => removeFromCart(item.product)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center mt-4">
        <p className="text-xl font-bold">
          Total: ₹
          {cart
            .reduce((total, item) => total + item.price * item.quantity, 0)
            .toFixed(2)}
        </p>
        <div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            onClick={exportToExcel}
          >
            Export to Excel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={exportToPDF}
          >
            Export to PDF
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded ml-2"
            onClick={checkout}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;