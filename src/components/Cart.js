import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const weightOptions = [10, 25, 50, 100, 250, 500, 1000]; // values in grams

const Cart = ({
  cart,
  updateCartItemWeight,
  updateCartItemQuantity, // new prop for quantity adjustment
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
            <th className="text-left p-2">Price per Kg</th>
            <th className="text-left p-2">Weight (g)</th>
            <th className="text-left p-2">Quantity</th>
            <th className="text-left p-2">Total Price</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cart.map(item => {
            // Total price = (price per kg) * (weight in kg) * quantity
            const totalPrice = (item.price * item.weight * item.quantity) / 1000;
            return (
              <tr key={item.product}>
                <td className="p-2">{item.product}</td>
                <td className="p-2">₹{item.price.toFixed(2)}</td>
                <td className="p-2">
                  <select
                    className="border p-1"
                    value={item.weight}
                    onChange={(e) =>
                      updateCartItemWeight(item.product, parseInt(e.target.value, 10))
                    }
                  >
                    {weightOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt} g
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 flex items-center">
                  <button
                    className="bg-gray-300 text-black px-2 py-1 rounded"
                    onClick={() =>
                      updateCartItemQuantity(
                        item.product,
                        Math.max(item.quantity - 1, 1)
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <span className="mx-2">{item.quantity}</span>
                  <button
                    className="bg-gray-300 text-black px-2 py-1 rounded"
                    onClick={() =>
                      updateCartItemQuantity(item.product, item.quantity + 1)
                    }
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </td>
                <td className="p-2">₹{totalPrice.toFixed(2)}</td>
                <td className="p-2">
                  <button
                    className="text-red-600"
                    onClick={() => removeFromCart(item.product)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex justify-between items-center mt-4">
        <p className="text-xl font-bold">
          Total: ₹
          {cart
            .reduce(
              (total, item) =>
                total + (item.price * item.weight * item.quantity) / 1000,
              0
            )
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