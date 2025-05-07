import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useCart } from '../contexts/CartContext';
import { Product, ProductVariant } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
        if (response.data.variants.length > 0) {
          const firstVariant = response.data.variants[0];
          setSelectedColor(firstVariant.color);
          setSelectedSize(firstVariant.size);
          setSelectedVariant(firstVariant);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Get unique colors and sizes from variants
  const colors = product ? Array.from(new Set(product.variants.map(v => v.color))) : [];
  const sizes = product ? Array.from(new Set(product.variants.map(v => v.size))) : [];

  // Find available variants based on selected color and size
  const availableVariants = product?.variants.filter(v => 
    (!selectedColor || v.color === selectedColor) &&
    (!selectedSize || v.size === selectedSize)
  ) || [];

  // Update selected variant when color or size changes
  useEffect(() => {
    if (product && selectedColor && selectedSize) {
      const variant = product.variants.find(
        v => v.color === selectedColor && v.size === selectedSize
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedColor, selectedSize, product]);

  const handleAddToCart = () => {
    if (product && selectedVariant) {
      addItem({
        product,
        variant: selectedVariant,
        quantity,
      });
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
        {/* Image gallery */}
        <div className="flex flex-col-reverse">
          <div className="w-full aspect-w-1 aspect-h-1">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-96 h-96 object-center object-cover rounded-lg"
            />
          </div>
          <div className="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
            <div className="grid grid-cols-4 gap-6">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    selectedImage === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-32 h-32 object-center object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {product.name}
          </h1>
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl text-gray-900">
              ${selectedVariant?.price || 'Select options'}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="text-base text-gray-700 space-y-6">
              <p>{product.description}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center">
              <h3 className="text-sm text-gray-900 font-medium">Category:</h3>
              <p className="ml-2 text-sm text-gray-500">{product.category}</p>
            </div>
          </div>

          <div className="mt-6">
            {/* Color selector */}
            <div className="mt-6">
              <h3 className="text-sm text-gray-900 font-medium">Color</h3>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a color</option>
                {colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>

            {/* Size selector */}
            <div className="mt-6">
              <h3 className="text-sm text-gray-900 font-medium">Size</h3>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a size</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock information */}
            {selectedVariant && (
              <div className="mt-4">
                <p className={`text-sm ${
                  selectedVariant.stock > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {selectedVariant.stock > 0 
                    ? `${selectedVariant.stock} in stock` 
                    : 'Out of stock'}
                </p>
              </div>
            )}

            {/* Quantity selector */}
            <div className="mt-6">
              <label htmlFor="quantity" className="text-sm text-gray-900 font-medium">
                Quantity
              </label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                disabled={!selectedVariant || selectedVariant.stock === 0}
              >
                {[...Array(Math.min(selectedVariant?.stock || 0, 10))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Add to cart button */}
            <div className="mt-6">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {selectedVariant?.stock === 0 
                  ? 'Out of Stock' 
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 