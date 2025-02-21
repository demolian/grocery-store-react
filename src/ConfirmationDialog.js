// filepath: /e:/react-js-application/grocery-store/src/ConfirmationDialog.js
import React from 'react';

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow">
        <p>{message}</p>
        <div className="flex justify-end mt-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded mr-2" onClick={onCancel}>Cancel</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;