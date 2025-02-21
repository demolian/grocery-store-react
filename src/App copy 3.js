import React, { useState, useEffect, useMemo, useCallback } from 'react';
import supabase from './supabaseClient';
import './index.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import ConfirmationDialog from './ConfirmationDialog';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState(null);
  const itemsPerPage = 8;

  useEffect(() => {
    loadProducts();
  }, [currentPage]);

  const loadProducts = useCallback(async () => {
    const { data: products, error } = await supabase
      .from('products')
      .select('*');
    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(products);
    }
  }, []);

  const renderProducts = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return paginatedProducts.map(product => (
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
          onClick={() => addToCart(product)}
          disabled={product.inventory <= 0}
        >
          Add to Cart
        </button>
        {isAdmin && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2 ml-2"
            onClick={() => editProduct(product)}
          >
            <FontAwesomeIcon icon={faEdit} /> Edit
          </button>
        )}
      </div>
    ));
  }, [products, currentPage, isAdmin]);

  const addToCart = useCallback((product) => {
    if (product.inventory <= 0) {
      alert('Product is out of stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product === product.product_name);
      if (existingItem) {
        return prevCart.map(item =>
          item.product === product.product_name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product: product.product_name, price: product.price, quantity: 1 }];
      }
    });

    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === product.id ? { ...p, inventory: Math.max(p.inventory - 1, 0) } : p
      )
    );

    updateProductInventory(product.id, -1);
  }, []);

  const updateProductInventory = useCallback(async (productId, change) => {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('inventory')
      .eq('id', productId)
      .single();
    if (fetchError) {
      console.error('Error fetching product inventory:', fetchError);
      return;
    }
    const newInventory = Math.max(product.inventory + change, 0);
    const { error } = await supabase
      .from('products')
      .update({ inventory: newInventory })
      .match({ id: productId });
    if (error) {
      console.error('Error updating product inventory:', error);
    }
  }, []);

  const cartItems = useMemo(() => {
    return cart.map(item => (
      <tr key={item.product}>
        <td className="p-2">{item.product}</td>
        <td className="p-2">₹{item.price.toFixed(2)}</td>
        <td className="p-2">{item.quantity}</td>
        <td className="p-2">₹{(item.price * item.quantity).toFixed(2)}</td>
        <td className="p-2">
          <button className="text-red-600" onClick={() => removeFromCart(item.product)}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </td>
      </tr>
    ));
  }, [cart]);

  const removeFromCart = useCallback((productName) => {
    const product = cart.find(item => item.product === productName);
    if (product) {
      updateProductInventory(product.id, product.quantity);
    }
    setCart(prevCart => prevCart.filter(item => item.product !== productName));
  }, [cart]);

  const handleSearch = useCallback(async (event) => {
    const searchText = event.target.value.toLowerCase();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .ilike('product_name', `%${searchText}%`);
    if (error) {
      console.error('Error searching products:', error);
      return;
    }
    setProducts(products);
  }, []);

  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(cart.map(item => ({
      Product: item.product,
      Price: item.price,
      Quantity: item.quantity,
      Total: item.price * item.quantity
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cart');
    XLSX.writeFile(wb, 'cart.xlsx');
  }, [cart]);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.text('Cart', 10, 10);
    let y = 20;
    cart.forEach(item => {
      doc.text(`${item.product} - ₹${item.price.toFixed(2)} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`, 10, y);
      y += 10;
    });
    doc.text(`Total: ₹${cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}`, 10, y + 10);
    doc.save('cart.pdf');
  }, [cart]);

  const checkout = useCallback(() => {
    const totalSales = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    alert(`Total Daily Sales: ₹${totalSales.toFixed(2)}`);
  }, [cart]);

  const editProduct = useCallback((product) => {
    const password = prompt('Enter admin password:');
    if (password !== 'admin') {
      alert('Incorrect password');
      return;
    }

    const newName = prompt('Enter new product name:', product.product_name);
    const newPrice = parseFloat(prompt('Enter new product price:', product.price));
    const newInventory = parseInt(prompt('Enter new product inventory:', product.inventory));
    setShowConfirmDialog(true);
    setConfirmCallback(() => async () => {
      let newImageUrl = product.image_url;
      const imageFile = document.createElement('input');
      imageFile.type = 'file';
      imageFile.accept = 'image/*';
      imageFile.onchange = async () => {
        const file = imageFile.files[0];
        if (file) {
          const { data: imageData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(`${file.name}`, file);
          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            alert('Failed to upload image. Please try again.');
            return;
          }
          newImageUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/images/${file.name}`;
        }
      };
      imageFile.click();

      const { error: updateError } = await supabase
        .from('products')
        .update({ product_name: newName, price: newPrice, inventory: newInventory, image_url: newImageUrl })
        .match({ id: product.id });
      if (updateError) {
        console.error("Error updating product:", updateError);
        alert('Failed to update product. Please try again.');
        return;
      }
      loadProducts();
      setShowConfirmDialog(false);
    });
  }, [loadProducts]);

  const handleLogin = () => {
    const password = prompt('Enter admin password:');
    if (password === 'admin') {
      setIsAdmin(true);
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <header className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Grocery Store</h1>
          <input
            type="text"
            id="search-bar"
            placeholder="Search..."
            className="border border-gray-400 p-2 rounded text-black mx-auto"
            onInput={handleSearch}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded ml-2" onClick={handleLogin}>
            Admin Login
          </button>
        </div>
      </header>
      <main>
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4" id="product-list">
          {renderProducts()}
        </section>
        <div className="flex justify-between items-center mt-4">
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= products.length}
          >
            Next
          </button>
        </div>
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Cart</h2>
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
              <tbody id="cart-items">
                {cartItems}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
              <p className="text-xl font-bold" id="cart-total">Total: ₹{cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</p>
              <div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded mr-2" onClick={exportToExcel}>Export to Excel</button>
                <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={exportToPDF}>Export to PDF</button>
                <button className="bg-green-600 text-white px-4 py-2 rounded ml-2" onClick={checkout}>Checkout</button>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
          <div className="bg-white p-4 rounded shadow">
            <div className="mb-4">
              <label className="block text-gray-700">Product Name</label>
              <input type="text" id="new-product-name" className="border border-gray-400 p-2 rounded w-full" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Price</label>
              <input type="number" id="new-product-price" className="border border-gray-400 p-2 rounded w-full" min="0" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Image</label>
              <input type="file" id="new-product-image" className="border border-gray-400 p-2 rounded w-full" accept="image/*" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Inventory</label>
              <input type="number" id="new-product-inventory" className="border border-gray-400 p-2 rounded w-full" min="1" />
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded" id="add-new-product" onClick={addNewProduct}>Add Product</button>
          </div>
        </section>
      </main>
      {showConfirmDialog && (
        <ConfirmationDialog
          message="Do you want to edit the image?"
          onConfirm={confirmCallback}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </div>
  );

  async function addNewProduct() {
    const name = document.getElementById('new-product-name').value;
    const price = parseFloat(document.getElementById('new-product-price').value);
    const inventory = parseInt(document.getElementById('new-product-inventory').value);
    const imageFile = document.getElementById('new-product-image').files[0];

    if (!name || isNaN(price) || isNaN(inventory)) {
      alert('Please fill in all fields correctly.');
      return;
    }

    let imageUrl = '';
    if (imageFile) {
      // Upload image to Supabase Storage
      const { data: imageData, error: uploadError } = await supabase.storage
        .from('images') // Ensure this matches the name of your bucket
        .upload(`${imageFile.name}`, imageFile); // public/

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        alert('Failed to upload image. Please try again.');
        return;
      }

      // Generate the public URL for the uploaded image
      imageUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/images/${imageFile.name}`;
    }

    // Insert new product into Supabase
    const { error: insertError } = await supabase
      .from('products')
      .insert([{ product_name: name, price: price, inventory: inventory, image_url: imageUrl }]);

    if (insertError) {
      console.error("Error adding product:", insertError);
      alert('Failed to add product. Please try again.');
      return;
    }

    // Clear input fields
    document.getElementById('new-product-name').value = '';
    document.getElementById('new-product-price').value = '';
    document.getElementById('new-product-inventory').value = '';
    document.getElementById('new-product-image').value = '';

    loadProducts(); // Reload products to show the new addition
  }
}

export default App;