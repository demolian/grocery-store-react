//// filepath: /e:/react-js-application/grocery-store/src/Navigation.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-around">
      <Link className="hover:underline" to="/">Products</Link>
      <Link className="hover:underline" to="/cart">Cart</Link>
      <Link className="hover:underline" to="/new-product">Add New Product</Link>
    </nav>
  );
};

export default Navigation;