import React, { useState, useEffect, useCallback } from 'react';
import supabase from './supabaseClient';
import './index.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ConfirmationDialog from './ConfirmationDialog';
import PasswordDialog from './PasswordDialog';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import NewProductForm from './components/NewProductForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordCallback, setPasswordCallback] = useState(null);
  const itemsPerPage = 8;

  useEffect(() => {
    loadProducts();
    const subscription = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Change received!', payload);
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentPage, searchTerm]);

  const loadProducts = useCallback(async () => {
    let query = supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true }); // Ensure consistent ordering

    if (searchTerm) {
      query = query.ilike('product_name', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data);
    }
  }, [searchTerm]);

  const addToCart = useCallback((product) => {
    // Prevent adding duplicate items (case insensitive check)
    const exists = cart.find(
      (item) =>
        item.product.toLowerCase() === product.product_name.toLowerCase()
    );
    if (exists) {
      alert('Item already in cart. You can update its weight from the cart.');
      return;
    }

    if (product.inventory <= 0) {
      alert('Product is out of stock');
      return;
    }

    // Default weight chosen is 1000 grams.
    const defaultWeight = 1000;

    // Set default quantity to 1.
    setCart((prevCart) => [
      ...prevCart,
      {
        product: product.product_name,
        price: product.price,
        weight: defaultWeight,
        quantity: 1
      }
    ]);

    // Deduct from inventory: weight (in kg) = defaultWeight/1000
    updateProductInventory(product.id, -(defaultWeight / 1000));
  }, [cart]);

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
    // Allow fractional inventory: newInventory = old inventory + change
    const newInventory = Math.max(product.inventory + change, 0);
    const { error } = await supabase
      .from('products')
      .update({ inventory: newInventory })
      .match({ id: productId });
    if (error) {
      console.error('Error updating product inventory:', error);
    }
  }, []);

  const updateCartItemWeight = useCallback(
    (productName, newWeight) => {
      setCart((prevCart) => {
        return prevCart.map((item) =>
          item.product.toLowerCase() === productName.toLowerCase()
            ? { ...item, weight: newWeight }
            : item
        );
      });

      const product = products.find(
        (p) => p.product_name.toLowerCase() === productName.toLowerCase()
      );
      if (product) {
        // Find previous weight from cart.
        const oldWeight = cart.find(
          (item) => item.product.toLowerCase() === productName.toLowerCase()
        ).weight;
        const weightChange = newWeight - oldWeight;
        // Adjust inventory by the weight change in kg.
        updateProductInventory(product.id, -(weightChange / 1000));
      }
    },
    [cart, products]
  );

  const updateCartItemQuantity = useCallback((productName, newQuantity) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.product.toLowerCase() === productName.toLowerCase()) {
          const oldQuantity = item.quantity;
          const diff = newQuantity - oldQuantity;
          // Find the product details to check inventory
          const product = products.find(
            p => p.product_name.toLowerCase() === productName.toLowerCase()
          );
          if (product) {
            if (diff > 0) {
              // Calculate additional weight in kg required
              const additionalWeightKg = diff * (item.weight / 1000);
              if (product.inventory < additionalWeightKg) {
                alert('Not enough inventory available for additional quantity');
                return item;
              }
              // Deduct additional weight from inventory
              updateProductInventory(product.id, -additionalWeightKg);
            } else if (diff < 0) {
              // Release weight back to inventory when quantity decreases
              const releasedWeightKg = (-diff) * (item.weight / 1000);
              updateProductInventory(product.id, releasedWeightKg);
            }
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, [products, updateProductInventory]);

  const removeFromCart = useCallback((productName) => {
    // Find the cart item and the corresponding product.
    const productInCart = cart.find(
      item => item.product.toLowerCase() === productName.toLowerCase()
    );
    const product = products.find(
      p => p.product_name.toLowerCase() === productName.toLowerCase()
    );
    if (product && productInCart) {
      // Add back the inventory: quantity * (weight in kg)
      const returnAmount = productInCart.quantity * (productInCart.weight / 1000);
      updateProductInventory(product.id, returnAmount);
    }
    setCart(prevCart =>
      prevCart.filter(item => item.product.toLowerCase() !== productName.toLowerCase())
    );
  }, [cart, products, updateProductInventory]);

  // Helper function to get formatted date and time
  const getFormattedDateTime = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    // Format: "24 Feb 2025_15t05m45s"
    return `${day} ${month} ${year}_${hours}t${minutes}m${seconds}s`;
  };

  const exportToExcel = useCallback(() => {
    // Prepare the rows from the cart data including Quantity column
    const data = cart.map((item, index) => ({
      "S.No.": index + 1,
      Product: item.product,
      "Price per Kg": item.price.toFixed(2),
      "Weight (g)": item.weight,
      Quantity: item.quantity,
      "Total Price": ((item.price * item.weight * item.quantity) / 1000).toFixed(2),
    }));

    // Calculate total sales using the new formula with quantity
    const totalSales = cart.reduce(
      (total, item) =>
        total + (item.price * item.weight * item.quantity) / 1000,
      0
    );

    // Add a total row at the end (leaving S.No., Price per Kg, Weight and Quantity blank)
    data.push({
      "S.No.": "",
      Product: "Total",
      "Price per Kg": "",
      "Weight (g)": "",
      Quantity: "",
      "Total Price": "\u20B9" + totalSales.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cart");

    const fileName = `${getFormattedDateTime()}_cart.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [cart]);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();

    // Set font—note: using Times may not support Marathi; embed a custom font for that
    doc.setFont("Times", "normal");
    doc.setFontSize(12);

    // Prepare the data for export including the Quantity column
    const exportData = cart.map((item, index) => ({
      "S.No.": index + 1,
      "Product": item.product,
      "Price per Kg": item.price.toFixed(2),
      "Weight (g)": item.weight,
      "Quantity": item.quantity,
      "Total Price": ((item.price * item.weight * item.quantity) / 1000).toFixed(2),
    }));

    // Calculate total sales using the new formula with quantity
    const totalSales = cart.reduce(
      (total, item) =>
        total + (item.price * item.weight * item.quantity) / 1000,
      0
    );

    // Use the keys from the first object as table headers
    const columns = Object.keys(exportData[0]);
    const rows = exportData.map((row) => columns.map((col) => row[col]));

    // Create the table using autoTable
    doc.autoTable({
      head: [columns],
      body: rows,
      styles: { font: 'Times', fontSize: 12 },
      theme: 'grid',
    });

    // Write total sales below the table. finalY is from the autoTable plugin.
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 20;
    doc.text(`Total: \u20B9${totalSales.toFixed(2)}`, 10, finalY);

    const fileName = `${getFormattedDateTime()}_cart.pdf`;
    doc.save(fileName);
  }, [cart]);

  const checkout = useCallback(() => {
    const totalSales = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    alert(`Total Daily Sales: ₹${totalSales.toFixed(2)}`);
  }, [cart]);

  const editProduct = useCallback(
    (product) => {
      const newName = prompt('Enter new product name:', product.product_name);
      const newPrice = parseFloat(
        prompt('Enter new product price:', product.price)
      );
      const newInventory = parseInt(
        prompt('Enter new product inventory:', product.inventory)
      );

      const updateProductWithoutImage = async () => {
        const { error: updateError } = await supabase
          .from('products')
          .update({ product_name: newName, price: newPrice, inventory: newInventory })
          .match({ id: product.id });
        if (updateError) {
          console.error('Error updating product:', updateError);
          alert('Failed to update product. Please try again.');
          return;
        }
        loadProducts();
      };

      updateProductWithoutImage();

      setShowConfirmDialog(true);
      setConfirmCallback(() => async (confirm) => {
        if (!confirm) {
          setShowConfirmDialog(false);
          return;
        }

        let newImageUrl = product.image_url;
        const imageFile = document.createElement('input');
        imageFile.type = 'file';
        imageFile.accept = 'image/*';
        imageFile.onchange = async () => {
          const file = imageFile.files[0];
          if (file) {
            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(`${file.name}`, file);
            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              alert('Failed to upload image. Please try again.');
              return;
            }
            newImageUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/images/${file.name}`;
            updateProductWithImage();
          }
        };
        imageFile.click();

        const updateProductWithImage = async () => {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              product_name: newName,
              price: newPrice,
              inventory: newInventory,
              image_url: newImageUrl,
            })
            .match({ id: product.id });
          if (updateError) {
            console.error('Error updating product:', updateError);
            alert('Failed to update product. Please try again.');
            return;
          }
          loadProducts();
          setShowConfirmDialog(false);
        };
      });
    },
    [loadProducts]
  );

  // Handle password before editing
  const handleRequestPassword = (product) => {
    setShowPasswordDialog(true);
    setPasswordCallback(() => (password) => {
      if (password === 'admin') {
        editProduct(product);
      } else {
        alert('Incorrect password');
      }
      setShowPasswordDialog(false);
    });
  };

  // New product form logic moved to a separate component.
  const addNewProduct = useCallback(
    async ({ name, price, inventory, imageFile }) => {
      let imageUrl = '';
      if (imageFile) {
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(`${imageFile.name}`, imageFile);
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Failed to upload image. Please try again.');
          return;
        }
        imageUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/images/${imageFile.name}`;
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert([
          { product_name: name, price: price, inventory: inventory, image_url: imageUrl },
        ]);
      if (insertError) {
        console.error('Error adding product:', insertError);
        alert('Failed to add product. Please try again.');
        return;
      }
      loadProducts();
    },
    [loadProducts]
  );

  return (
    <div className="container mx-auto p-4">
      <header className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Grocery Store</h1>
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute top-3 left-2 text-gray-500"
            />
            <input
              type="text"
              id="search-bar"
              placeholder="Search..."
              className="border border-gray-400 p-2 rounded pl-8 text-black"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </header>
      <main>
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4" id="product-list">
          <ProductList
            products={products}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onAddToCart={addToCart}
            onRequestPassword={handleRequestPassword}
          />
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
          <Cart
            cart={cart}
            updateCartItemWeight={updateCartItemWeight}
            updateCartItemQuantity={updateCartItemQuantity} // Add this line
            removeFromCart={removeFromCart}
            exportToExcel={exportToExcel}
            exportToPDF={exportToPDF}
            checkout={checkout}
          />
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
          <NewProductForm 
            onAddNewProduct={addNewProduct} 
            existingProducts={products.map(p => p.product_name)} 
          />
        </section>
      </main>
      {showConfirmDialog && (
        <ConfirmationDialog
          message="Do you want to edit the image?"
          onConfirm={confirmCallback}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
      {showPasswordDialog && (
        <PasswordDialog
          onConfirm={passwordCallback}
          onCancel={() => setShowPasswordDialog(false)}
        />
      )}
    </div>
  );
}

export default App;