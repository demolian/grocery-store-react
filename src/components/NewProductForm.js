import React, { useState, useEffect } from 'react';

const NewProductForm = ({ onAddNewProduct, existingProducts }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState('');

  useEffect(() => {
    if (name.trim()) {
      const nameLower = name.trim().toLowerCase();
      const duplicate = existingProducts.some(
        (productName) => productName.toLowerCase() === nameLower
      );
      setDuplicateWarning(duplicate ? 'Product already exists.' : '');
    } else {
      setDuplicateWarning('');
    }
  }, [name, existingProducts]);

  const handleSubmit = async () => {
    if (duplicateWarning) {
      alert('Duplicate product name. Please choose a different name.');
      return;
    }
    if (!name || isNaN(price) || isNaN(inventory)) {
      alert('Please fill in all fields correctly.');
      return;
    }
    await onAddNewProduct({ name, price: parseFloat(price), inventory: parseInt(inventory, 10), imageFile });
    // Clear inputs after submission
    setName('');
    setPrice('');
    setInventory('');
    setImageFile(null);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="mb-4">
        <label className="block text-gray-700">Product Name</label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-400 p-2 rounded w-full"
        />
        {duplicateWarning && (
          <p className="text-red-500 text-sm mt-1">{duplicateWarning}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Price</label>
        <input 
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border border-gray-400 p-2 rounded w-full"
          min="0"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Image</label>
        <input 
          type="file"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="border border-gray-400 p-2 rounded w-full"
          accept="image/*"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Inventory</label>
        <input 
          type="number"
          value={inventory}
          onChange={(e) => setInventory(e.target.value)}
          className="border border-gray-400 p-2 rounded w-full"
          min="1"
        />
      </div>
      <button 
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
        disabled={duplicateWarning !== ''}
      >
        Add Product
      </button>
    </div>
  );
};

export default NewProductForm;