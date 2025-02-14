import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster  } from '@/components/ui/toaster';
import { ShoppingCart, Trash2, Plus, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthForms from './components/AuthForms';
const toast=Toaster
const API_URL = 'http://localhost:3000/api';

const EcommerceApp = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    imageUrl: ''
  });
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const userId = localStorage.getItem('userId') || 'guest-' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    fetchProducts();
    fetchCart();
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_URL}/cart/${userId}`);
      const data = await response.json();
      setCart(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cart",
        variant: "destructive"
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setIsAdmin(true);
        setShowLogin(false);
        toast({
          title: "Success",
          description: "Logged in successfully"
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    toast({
      title: "Success",
      description: "Logged out successfully"
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      
      if (response.ok) {
        fetchProducts();
        setNewProduct({ name: '', price: '', imageUrl: '' });
        toast({
          title: "Success",
          description: "Product added successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchProducts();
        fetchCart();
        toast({
          title: "Success",
          description: "Product deleted successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const addToCart = async (product) => {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: product._id,
          quantity: 1
        })
      });
      
      if (response.ok) {
        fetchCart();
        toast({
          title: "Added to Cart",
          description: `${product.name} added to cart`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/cart/${userId}/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchCart();
        toast({
          title: "Success",
          description: "Item removed from cart"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const cartTotal = cart.reduce((sum, item) => 
    sum + (item.productId.price * item.quantity), 0);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">E-commerce Store</h1>
        <div className="flex gap-4">
          <Button 
            onClick={() => setShowCart(!showCart)}
            className="relative"
          >
            <ShoppingCart className="mr-2" />
            Cart ({cart.length})
          </Button>
          {!isAdmin ? (
            <Button onClick={() => setShowLogin(true)}>
              <LogIn className="mr-2" /> Admin Login
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2" /> Logout
            </Button>
          )}
        </div>
      </div>

      {showLogin && (
  <AuthForms 
    onLoginSuccess={(token) => {
      setToken(token);
      localStorage.setItem('adminToken', token);
      setIsAdmin(true);
      setShowLogin(false);
    }} 
  />
)}

      {isAdmin && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <Input
                placeholder="Product Name"
                value={newProduct.name}
                onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
              />
              <Input
                placeholder="Image URL"
                value={newProduct.imageUrl}
                onChange={e => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
              <Button type="submit">Add Product</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {products.map(product => (
            <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-md"
                />
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="text-lg">${product.price}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={() => addToCart(product)}>
                  <Plus className="mr-2" /> Add to Cart
                </Button>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product._id)}
                  >
                    <Trash2 className="mr-2" /> Delete
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>

    {showCart && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl p-6 overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Shopping Cart</h2>
          <Button variant="ghost" onClick={() => setShowCart(false)}>×</Button>
        </div>
        {cart.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item._id} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-semibold">{item.productId.name}</p>
                  <p>${item.productId.price} × {item.quantity}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFromCart(item._id)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xl font-bold">Total: ${cartTotal.toFixed(2)}</p>
              <Button className="w-full mt-4">Checkout</Button>
            </div>
          </>
        )}
      </motion.div>
    )}
  </div>
);
};

export default EcommerceApp;