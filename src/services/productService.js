import supabase from '../supabaseClient';

export const loadProducts = async (searchTerm) => {
  let query = supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (searchTerm) {
    query = query.ilike('product_name', `%${searchTerm}%`);
  }

  const { data, error } = await query;
  return { data, error };
};

// Add a new product
export const addNewProduct = async (newProductData) => {
  const { data, error } = await supabase
    .from('products')
    .insert(newProductData);
  return { data, error };
};

// Update an existing product (e.g., inventory, price, etc.)
export const updateProduct = async (productId, updateData) => {
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .match({ id: productId });
  return { data, error };
};

// Delete a product (if needed)
export const deleteProduct = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .match({ id: productId });
  return { data, error };
};