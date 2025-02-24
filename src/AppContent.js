import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ProductList from './components/ProductList';
import CartPage from './pages/CartPage';
import NewProductPage from './pages/NewProductPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function AppContent({
  products,
  cart,
  currentPage,
  itemsPerPage,
  searchTerm,
  setSearchTerm,
  setCurrentPage,
  onAddToCart,
  updateCartItemQuantity,
  updateCartItemWeight,
  removeFromCart,
  exportToExcel,
  exportToPDF,
  checkout,
  onRequestPassword,
  onAddNewProduct
}) {
  const location = useLocation();

  return (
    <div className="container mx-auto p-4 max-w-full sm:max-w-4xl">
      <header className="bg-green-600 text-white p-4 rounded-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          {/* Title */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold">Grocery Store</h1>
          </div>
          {/* Search */}
          <div className="mb-4 sm:mb-0">
            <div className="relative w-full sm:w-64">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                id="search-bar"
                placeholder="Search…"
                className="w-full pl-10 pr-3 py-2 rounded focus:outline-none text-black"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
            <Link to="/" className="text-lg hover:text-yellow-300 transition-colors">
              Products
            </Link>
            <Link to="/cart" className="text-lg hover:text-yellow-300 transition-colors">
              Cart
            </Link>
            <Link to="/new-product" className="text-lg hover:text-yellow-300 transition-colors">
              Add New Product
            </Link>
          </div>
        </div>
      </header>
      <main className="mt-4">
        <Routes>
          <Route
            path="/"
            element={
              <section id="product-list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <ProductList
                  products={products}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onAddToCart={onAddToCart}
                  onRequestPassword={onRequestPassword}
                />
              </section>
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                updateCartItemQuantity={updateCartItemQuantity}
                updateCartItemWeight={updateCartItemWeight}
                removeFromCart={removeFromCart}
                exportToExcel={exportToExcel}
                exportToPDF={exportToPDF}
                checkout={checkout}
              />
            }
          />
          <Route
            path="/new-product"
            element={
              <NewProductPage
                onAddNewProduct={onAddNewProduct}
                existingProducts={products.map((p) => p.product_name)}
              />
            }
          />
        </Routes>
        {location.pathname === "/" && (
          <div className="flex justify-center items-center mt-4 p-4 bg-white bg-opacity-80 rounded">
            <button
              className="mx-2 px-3 py-1 border border-gray-500 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &lt;&lt;
            </button>
            <button
              className="mx-2 px-3 py-1 border border-gray-500 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage * itemsPerPage >= products.length}
            >
              &gt;&gt;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default AppContent;