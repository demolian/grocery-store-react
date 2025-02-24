import React from 'react';
import Cart from '../components/Cart';

const CartPage = ({
  cart,
  updateCartItemQuantity,
  updateCartItemWeight,
  removeFromCart,
  exportToExcel,
  exportToPDF,
  checkout,
}) => {
  if (!cart || cart.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Cart
        cart={cart}
        updateCartItemWeight={updateCartItemWeight}
        updateCartItemQuantity={updateCartItemQuantity}
        removeFromCart={removeFromCart}
        exportToExcel={exportToExcel}
        exportToPDF={exportToPDF}
        checkout={checkout}
      />
    </div>
  );
};

export default CartPage;