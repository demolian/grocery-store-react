// filepath: /e:/react-js-application/grocery-store/src/PasswordDialog.js
import React, { useState } from 'react';

const PasswordDialog = ({ onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');

  const handleConfirm = () => {
    if (password === 'admin') {
      onConfirm(password);
    } else {
      alert('Incorrect password');
    }
    setPassword('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow">
        <p>Enter admin password:</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-400 p-2 rounded w-full"
        />
        <div className="flex justify-end mt-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded mr-2" onClick={onCancel}>
            Cancel
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordDialog;