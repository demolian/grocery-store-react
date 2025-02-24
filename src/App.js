import React, { useState, useEffect, useCallback, useMemo } from 'react';
import supabase from './supabaseClient';
import './index.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import ConfirmationDialog from './ConfirmationDialog';
import PasswordDialog from './PasswordDialog';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import NewProductForm from './components/NewProductForm';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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
  }, [currentPage]);

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data);
    }
  }, []);

  const addToCart = useCallback((product) => {
    if (product.inventory <= 0) {
      alert('Product is out of stock');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product === product.product_name
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product === product.product_name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          { product: product.product_name, price: product.price, quantity: 1 },
        ];
      }
    });

    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === product.id
          ? { ...p, inventory: Math.max(p.inventory - 1, 0) }
          : p
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

  const updateCartItemQuantity = useCallback(
    (productName, newQuantity) => {
      setCart((prevCart) => {
        return prevCart.map((item) =>
          item.product === productName
            ? { ...item, quantity: newQuantity }
            : item
        );
      });

      const product = products.find(
        (p) => p.product_name === productName
      );
      if (product) {
        const quantityChange =
          newQuantity - cart.find((item) => item.product === productName)
            .quantity;
        updateProductInventory(product.id, -quantityChange);
      }
    },
    [cart, products]
  );

  const removeFromCart = useCallback(
    (productName) => {
      const productInCart = cart.find((item) => item.product === productName);
      if (productInCart) {
        // Assuming your product record has the id stored in some way
        // Otherwise adjust the logic accordingly.
        updateProductInventory(productInCart.id, productInCart.quantity);
      }
      setCart((prevCart) =>
        prevCart.filter((item) => item.product !== productName)
      );
    },
    [cart]
  );

  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      cart.map((item) => ({
        Product: item.product,
        Price: item.price,
        Quantity: item.quantity,
        Total: item.price * item.quantity,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cart');
    XLSX.writeFile(wb, 'cart.xlsx');
  }, [cart]);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.text('Cart', 10, 10);
    let y = 20;
    cart.forEach((item) => {
      doc.text(
        `${item.product} - ₹${item.price.toFixed(2)} x ${item.quantity} = ₹${(
          item.price * item.quantity
        ).toFixed(2)}`,
        10,
        y
      );
      y += 10;
    });
    doc.text(
      `Total: ₹${cart
        .reduce((total, item) => total + item.price * item.quantity, 0)
        .toFixed(2)}`,
      10,
      y + 10
    );
    doc.save('cart.pdf');
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
          <input
            type="text"
            id="search-bar"
            placeholder="Search..."
            className="border border-gray-400 p-2 rounded text-black mx-auto"
            onInput={async (e) => {
              const searchText = e.target.value.toLowerCase();
              const { data, error } = await supabase
                .from('products')
                .select('*')
                .ilike('product_name', `%${searchText}%`);
              if (error) {
                console.error('Error searching products:', error);
                return;
              }
              setProducts(data);
            }}
          />
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
            updateCartItemQuantity={updateCartItemQuantity}
            removeFromCart={removeFromCart}
            exportToExcel={exportToExcel}
            exportToPDF={exportToPDF}
            checkout={checkout}
          />
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
          <NewProductForm onAddNewProduct={addNewProduct} />
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