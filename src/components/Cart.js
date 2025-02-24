import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const weightOptions = [10, 25, 50, 100, 250, 500, 1000]; // values in grams

const Cart = ({
  cart,
  updateCartItemWeight,
  updateCartItemQuantity,
  removeFromCart,
  exportToExcel,
  exportToPDF,
  checkout
}) => {
  // Initialize customerName from localStorage so it persists across reloads.
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('customerName') || '');
  const [isCustomerNameSet, setIsCustomerNameSet] = useState(() => !!localStorage.getItem('customerName'));

  const handleSetEditClick = () => {
    if (!isCustomerNameSet) {
      if (customerName.trim() !== '') {
        setIsCustomerNameSet(true);
        localStorage.setItem('customerName', customerName);
      } else {
        alert('Please enter a customer name before setting.');
      }
    } else {
      // Allow user to edit: clear stored customer name.
      setIsCustomerNameSet(false);
      localStorage.removeItem('customerName');
    }
  };

  // Optionally, update localStorage whenever customerName changes while set.
  useEffect(() => {
    if (isCustomerNameSet) {
      localStorage.setItem('customerName', customerName);
    }
  }, [customerName, isCustomerNameSet]);

  return (
    <div className="bg-white p-4 rounded shadow">
      {cart.length === 0 ? (
        <p className="text-center text-gray-600">Cart is empty.</p>
      ) : (
        <>
          {/* Customer Name Input with Set/Edit Button */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:space-x-4">
            <div className="flex-1">
              <label className="block mb-2 text-gray-700">Customer Name:</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`border p-2 rounded w-full ${isCustomerNameSet ? 'bg-gray-100' : 'bg-white'}`}
                placeholder="Enter customer name"
                disabled={isCustomerNameSet}
              />
            </div>
            <div className="mt-2 sm:mt-0">
              <button
                onClick={handleSetEditClick}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {isCustomerNameSet ? 'Edit' : 'Set'}
              </button>
            </div>
          </div>

          {/* Cart Items Table */}
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr>
                <th className="border p-2">S.No.</th>
                <th className="border p-2">Product</th>
                <th className="border p-2">Price per Kg</th>
                <th className="border p-2">Weight (g)</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Total Price</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => {
                const totalPrice = (item.price * item.weight * item.quantity) / 1000;
                return (
                  <tr key={index}>
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2">{item.product}</td>
                    <td className="border p-2">₹{item.price.toFixed(2)}</td>
                    <td className="border p-2">
                      <select
                        className="border p-1"
                        value={item.weight}
                        onChange={(e) =>
                          updateCartItemWeight(item.product, parseInt(e.target.value, 10))
                        }
                      >
                        {weightOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt} g
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border p-2 flex items-center">
                      <button
                        className="bg-gray-300 text-black px-2 py-1 rounded"
                        onClick={() =>
                          updateCartItemQuantity(item.product, Math.max(item.quantity - 1, 1))
                        }
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span className="mx-2">{item.quantity}</span>
                      <button
                        className="bg-gray-300 text-black px-2 py-1 rounded"
                        onClick={() => updateCartItemQuantity(item.product, item.quantity + 1)}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </td>
                    <td className="border p-2">₹{totalPrice.toFixed(2)}</td>
                    <td className="border p-2">
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

          {/* Export & Checkout Buttons */}
          <div className="flex flex-col sm:flex-row sm:space-x-4 mt-4">
            <button
              onClick={() => exportToExcel(customerName)}
              className="bg-green-600 text-white px-4 py-2 rounded mb-2 sm:mb-0"
            >
              Export to Excel
            </button>
            <button
              onClick={() => exportToPDF(customerName)}
              className="bg-blue-600 text-white px-4 py-2 rounded mb-2 sm:mb-0"
            >
              Export to PDF
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={checkout}
              className="bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;