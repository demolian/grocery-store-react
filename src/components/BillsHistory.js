import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

const BillsHistory = () => {
  const [bills, setBills] = useState([]);
  const [accessGranted, setAccessGranted] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(true);

  useEffect(() => {
    // No need to ask for password on initial render
  }, []);

  const fetchBills = async () => {
    const { data, error } = await supabase
      .from('cart')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching bills:", error);
    } else {
      setBills(data);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === 'admin') {
      setAccessGranted(true);
      setShowPasswordInput(false);
      fetchBills();
    } else {
      alert("Access Denied");
    }
  };

  if (showPasswordInput) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Enter Superuser Password</h2>
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            placeholder="Superuser Password"
            className="border p-2 rounded text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded ml-2"
          >
            Submit
          </button>
        </form>
      </div>
    );
  }

  if (!accessGranted) {
    return <div className="p-4 text-red-600">Access Denied.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Bills History</h2>
      {bills.length === 0 ? (
        <p>No bills recorded yet.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Sr. No.</th>
              <th className="border p-2">Customer Name</th>
              <th className="border p-2">Product ID</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Price per Kg</th>
              <th className="border p-2">Weight (g)</th>
              <th className="border p-2">Total Price</th>
              <th className="border p-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill, index) => (
              <tr key={bill.id}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{bill.customer_name}</td>
                <td className="border p-2">{bill.product_id}</td>
                <td className="border p-2">{bill.quantity}</td>
                <td className="border p-2">{bill.price_per_kg}</td>
                <td className="border p-2">{bill.weight}</td>
                <td className="border p-2">{bill.total_price}</td>
                <td className="border p-2">
                  {bill.created_at ? new Date(bill.created_at).toLocaleString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BillsHistory;