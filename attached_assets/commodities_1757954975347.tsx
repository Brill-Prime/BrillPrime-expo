import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, Filter, ShoppingCart, Plus, Minus, Star, MapPin, Shirt, Palette, Sparkles, GraduationCap, Calendar, DollarSign, ShoppingBasket, Building2, Heart, Users, Fuel, UtensilsCrossed, Store, Ticket, Car, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import LiveMap from "@/components/ui/live-map";
import type { Category, Product } from "@shared/schema";

interface ExtendedProduct extends Product {
  categoryName?: string;
  sellerName?: string;
  sellerLocation?: string;
}

interface CartItem {
  id?: number;
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
  productUnit?: string;
}

export default function Commodities() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewMode, setViewMode] = useState<"categories" | "products">("categories");
  const [showMap, setShowMap] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch categories from API
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      const data = await response.json();
      return data.success ? data.categories : [];
    }
  });

  // Fetch products based on selected category and search
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory.toString());
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      return data.success ? data.products : [];
    },
    enabled: viewMode === "products"
  });

  // Fetch user's cart
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/cart/${user.id}`);
      const data = await response.json();
      return data.success ? data.cartItems : [];
    },
    enabled: !!user?.id
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (item: { productId: string; quantity: number }) => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          productId: item.productId,
          quantity: item.quantity
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
    }
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("commodities-cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("commodities-cart", JSON.stringify(cart));
  }, [cart]);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setViewMode("products");
  };

  const handleAddToCart = (product: ExtendedProduct) => {
    if (user?.id) {
      addToCartMutation.mutate({
        productId: product.id,
        quantity: 1
      });
    } else {
      // Fallback to local cart for non-logged users
      const existingItem = cart.find(item => item.productId === product.id);
      if (existingItem) {
        setCart(cart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, {
          productId: product.id,
          quantity: 1,
          price: parseFloat(product.price),
          productName: product.name,
          productUnit: product.unit
        }]);
      }
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.productId !== productId));
    }
  };

  const getCartQuantity = (productId: string) => {
    if (user?.id) {
      const dbItem = cartItems.find((item: any) => item.productId === productId);
      return dbItem?.quantity || 0;
    } else {
      const localItem = cart.find(item => item.productId === productId);
      return localItem?.quantity || 0;
    }
  };

  const getTotalCartItems = () => {
    if (user?.id) {
      return cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
    } else {
      return cart.reduce((total, item) => total + item.quantity, 0);
    }
  };

  // Icon mapping for category icons
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      Shirt,
      Palette,
      Sparkles,
      GraduationCap,
      Calendar,
      DollarSign,
      ShoppingBasket,
      Building2,
      Heart,
      Users,
      Fuel,
      UtensilsCrossed,
      Store,
      Ticket,
      Car,
      Briefcase
    };
    
    return iconMap[iconName] || Store;
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto px-2 sm:px-4">{/*Responsive container*/}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-[#131313]">
              {viewMode === "categories" ? "Business Marketplace" : "Products"}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Live Map Toggle - Only for Vendors and Drivers */}
            {(user?.role === "MERCHANT" || user?.role === "DRIVER") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>{showMap ? "Hide Map" : "Live Map"}</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/cart")}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalCartItems() > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-[#4682b4] hover:bg-[#0b1a51] text-white"
                >
                  {getTotalCartItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={viewMode === "categories" ? "Search business categories..." : "Search products..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Live Map for Vendors and Drivers */}
        {showMap && (user?.role === "MERCHANT" || user?.role === "DRIVER") && (
          <div className="px-4 pb-4">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-3 border-b bg-gray-50">
                <h3 className="font-medium text-[#131313]">Live Location Tracking</h3>
                <p className="text-sm text-gray-600">
                  {user?.role === "MERCHANT" ? "Track nearby customers and drivers" : "View nearby merchants and customers"}
                </p>
              </div>
              <div className="h-64">
                <LiveMap
                  showUserLocation={true}
                  showNearbyUsers={true}
                  userRole={user?.role}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories View */}
      {viewMode === "categories" && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories
              .filter((cat: Category) => 
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((category: Category) => (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 border-blue-100 hover:border-blue-200"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-50 rounded-xl flex items-center justify-center">
                      {(() => {
                        const IconComponent = getIconComponent(category.icon);
                        return <IconComponent className="w-6 h-6 text-[#4682b4]" />;
                      })()}
                    </div>
                    <h3 className="font-medium text-sm text-[#131313] mb-1">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      View products
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Products View */}
      {viewMode === "products" && (
        <div className="p-4">
          {/* Back to Categories */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode("categories");
                setSelectedCategory(null);
              }}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Categories</span>
            </Button>
            
            <div className="text-sm text-gray-600">
              {productsLoading ? "Loading..." : `${products.length} products found`}
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: ExtendedProduct) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow border-2 border-blue-100 hover:border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#131313] text-sm">
                        {product.name}
                      </h3>
                      <Badge 
                        variant={product.inStock ? "default" : "secondary"}
                        className={product.inStock ? "bg-green-100 text-green-800" : ""}
                      >
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">
                        {product.rating} ({product.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-[#4682b4]">
                          ₦{parseFloat(product.price).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">/ {product.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {product.sellerName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#131313] truncate">
                          {product.sellerName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {product.sellerLocation}
                        </p>
                      </div>
                    </div>

                    {getCartQuantity(product.id) > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromCart(product.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[1rem] text-center">
                            {getCartQuantity(product.id)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            className="h-8 w-8 p-0 bg-[#4682b4] hover:bg-[#0b1a51] text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Min: {product.minimumOrder} {product.unit}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock || addToCartMutation.isPending}
                          className="flex-1 bg-[#4682b4] hover:bg-[#0b1a51] text-white disabled:bg-gray-400"
                        >
                          {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                        </Button>
                        <p className="text-xs text-gray-500 ml-2">
                          Min: {product.minimumOrder}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-[#131313] mb-2">No products found</h3>
              <p className="text-gray-600">
                Try adjusting your search or browse different categories
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}