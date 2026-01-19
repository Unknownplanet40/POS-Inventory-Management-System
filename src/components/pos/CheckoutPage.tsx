import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useScannerGun } from '@/hooks/use-scanner-gun';
import { getProductByBarcode, getAllProducts, createSale, updateProduct, Product, Sale, SaleItem, getSettings } from '@/lib/db';
import { generateId } from '@/lib/auth';
import { BarcodeScanner } from './BarcodeScanner';
import { ReceiptDialog } from './ReceiptDialog';
import { Camera, Search, Plus, Minus, Trash2, Percent, DollarSign, ShoppingBag, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { getBackendUrl } from '@/config/api.config';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutPageProps {
  onCartChange?: (itemCount: number) => void;
}

export function CheckoutPage({ onCartChange }: CheckoutPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const { toast } = useToast();
  const { session } = useAuth();

  // Enable scanner gun support
  useScannerGun({
    onScan: (barcode) => {
      addToCart(barcode);
    },
    onScannerDetected: () => {
      toast({
        title: 'Scanner Gun Connected',
        description: 'Barcode scanner is ready',
        duration: 3000,
      });
    },
    enabled: true,
  });

  useEffect(() => {
    loadProducts();
    // Load tax rate from settings
    const loadTaxRate = async () => {
      const settings = await getSettings();
      if (settings?.taxRate) {
        setTaxRate(settings.taxRate);
      }
    };
    loadTaxRate();
  }, []);

  useEffect(() => {
    // Notify parent of cart changes
    onCartChange?.(cart.length);
  }, [cart, onCartChange]);

  const loadProducts = async () => {
    const allProducts = await getAllProducts();
    // Filter out archived products (isActive === false)
    const activeProducts = allProducts.filter(p => p.isActive !== false);
    setProducts(activeProducts);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
    toast({ title: 'Refreshed', description: 'Product data updated', duration: 2000 });
  };

  const addToCart = async (barcode: string) => {
    const product = await getProductByBarcode(barcode);
    if (!product) {
      toast({ title: 'Not Found', description: 'Product not found', variant: 'destructive' });
      return;
    }

    if (product.stock <= 0) {
      toast({ title: 'Out of Stock', description: `${product.name} is out of stock`, variant: 'destructive' });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ title: 'Limit Reached', description: 'Not enough stock available', variant: 'destructive' });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    
    // Update product stock display in the grid
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, stock: p.stock - 1 }
          : p
      )
    );
    
    setBarcodeInput('');
    toast({ title: 'Added', description: `${product.name} added to cart` });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) {
              // Restore stock to product grid when removing all items
              setProducts((p) =>
                p.map((prod) =>
                  prod.id === productId
                    ? { ...prod, stock: prod.stock + item.quantity }
                    : prod
                )
              );
              return null;
            }
            if (newQty > item.product.stock + item.quantity) {
              toast({ title: 'Limit', description: 'Not enough stock', variant: 'destructive' });
              return item;
            }
            // Update stock display based on quantity change
            setProducts((p) =>
              p.map((prod) =>
                prod.id === productId
                  ? { ...prod, stock: prod.stock - delta }
                  : prod
              )
            );
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const itemToRemove = prev.find((item) => item.product.id === productId);
      if (itemToRemove) {
        // Restore stock to product grid when removing from cart
        setProducts((p) =>
          p.map((prod) =>
            prod.id === productId
              ? { ...prod, stock: prod.stock + itemToRemove.quantity }
              : prod
          )
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  const discountAmount = discountType === 'percentage'
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : discountType === 'fixed'
    ? parseFloat(discountValue) || 0
    : 0;
  
  const total = Math.max(0, subtotal - discountAmount);
  const taxAmountCalc = Math.max(0, ((subtotal - discountAmount) * taxRate) / 100);
  const totalWithTax = Math.max(0, subtotal - discountAmount + taxAmountCalc);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Add items to checkout', variant: 'destructive' });
      return;
    }
    setShowCheckoutConfirm(true);
  };

  const confirmCheckout = async () => {
    const saleItems: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.product.price * item.quantity,
    }));

    const sale: Sale = {
      id: generateId(),
      items: saleItems,
      subtotal,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      discountAmount,
      taxRate,
      taxAmount: Math.round(taxAmountCalc * 100) / 100,
      total: totalWithTax,
      cashierId: session?.userId || '',
      cashierName: session?.username || '',
      createdAt: new Date(),
      storeEmail: '',
      storeAddress: '',
    };

    try {
      // Update stock
      for (const item of cart) {
        const updatedProduct = {
          ...item.product,
          stock: item.product.stock - item.quantity,
          updatedAt: new Date(),
        };
        await updateProduct(updatedProduct);
      }

      await createSale(sale);
      setCompletedSale(sale);
      setCart([]);
      setDiscountType(null);
      setDiscountValue('');
      loadProducts();
      toast({ title: 'Success', description: 'Sale completed!' });
      setShowCheckoutConfirm(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to complete sale', variant: 'destructive' });
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (selectedCategory === 'all' || p.primaryCategory === selectedCategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.technicalTags?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.primaryCategory).filter(Boolean))) as string[];

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 h-full">
      {/* Left: Product Search & Quick Add */}
      <div className="space-y-4">
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> Add Products
              </CardTitle>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-10 w-10 rounded-xl"
                title="Refresh products"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barcode Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToCart(barcodeInput)}
                placeholder="Scan or enter barcode"
                className="h-12 sm:h-14 text-lg flex-1 rounded-xl"
              />
              <div className="flex gap-2">
                <Button size="lg" className="h-12 sm:h-14 w-12 sm:w-14 rounded-xl flex-1 sm:flex-none" onClick={() => setShowScanner(true)}>
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button size="lg" className="h-12 sm:h-14 rounded-xl flex-1 sm:flex-none" onClick={() => addToCart(barcodeInput)}>
                  Add
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Product Search */}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-12 rounded-xl"
            />

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <div key={product.id} className="hidden lg:block">
                  <HoverCard openDelay={300}>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-20 sm:h-24 flex flex-row items-center justify-start p-2 text-left gap-2 sm:gap-3 rounded-xl w-full"
                        onClick={() => addToCart(product.barcode)}
                      >
                        {/* Image on left side */}
                        {product.imageUrl && product.imageUrl.trim() && !product.imageUrl.startsWith('data:') && (
                          <img
                            src={product.imageUrl.startsWith('http') ? product.imageUrl : getBackendUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        
                        {/* Product details on right */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold text-sm sm:text-base truncate w-full">{product.name}</span>
                          <span className="text-muted-foreground text-xs sm:text-sm">₱{product.price.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                        </div>
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      className="w-80 max-w-[90vw] z-50 rounded-xl p-4 shadow-lg border border-border" 
                      side="right" 
                      sideOffset={10}
                      align="start"
                      alignOffset={-10}
                      avoidCollisions={true}
                      collisionPadding={20}
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-base mb-1">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">Barcode: {product.barcode}</p>
                        </div>
                        {product.imageUrl && product.imageUrl.trim() && !product.imageUrl.startsWith('data:') && (
                          <img
                            src={product.imageUrl.startsWith('http') ? product.imageUrl : getBackendUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-full h-32 object-contain rounded-lg"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-semibold">₱{product.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stock:</span>
                            <span className="font-semibold">{product.stock} units</span>
                          </div>
                          {product.primaryCategory && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Category:</span>
                              <Badge variant="secondary">{product.primaryCategory}</Badge>
                            </div>
                          )}
                          {product.subCategory && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Sub-Category:</span>
                              <Badge variant="outline">{product.subCategory}</Badge>
                            </div>
                          )}
                          {product.technicalTags && (
                            <div>
                              <span className="text-muted-foreground">Tags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.technicalTags.split(',').map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{tag.trim()}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              ))}
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-20 sm:h-24 flex flex-row items-center justify-start p-2 text-left gap-2 sm:gap-3 rounded-xl lg:hidden"
                  onClick={() => addToCart(product.barcode)}
                >
                  {/* Image on left side */}
                  {product.imageUrl && product.imageUrl.trim() && !product.imageUrl.startsWith('data:') && (
                    <img
                      src={product.imageUrl.startsWith('http') ? product.imageUrl : getBackendUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  
                  {/* Product details on right */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-sm sm:text-base truncate w-full">{product.name}</span>
                    <span className="text-muted-foreground text-xs sm:text-sm">₱{product.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Cart */}
      <div className="flex flex-col">
        <Card className="flex-1 flex flex-col rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[300px]">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2 sm:p-3 bg-muted/50 border border-border rounded-xl space-y-2"
                  >
                    {/* Top row: Image and basic info */}
                    <div className="flex flex-wrap items-start gap-2 sm:gap-3">
                      {/* Image on left */}
                      <div className="flex-shrink-0">
                        {item.product.imageUrl && item.product.imageUrl.trim() && !item.product.imageUrl.startsWith('data:') && (
                          <img
                            src={item.product.imageUrl.startsWith('http') ? item.product.imageUrl : getBackendUrl(item.product.imageUrl)}
                            alt={item.product.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>

                      {/* Product info in middle */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base">{item.product.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          ₱{item.product.price.toFixed(2)} × {item.quantity} = ₱{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Delete button on right */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex-shrink-0"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    {/* Categories and tags row */}
                    {(item.product.primaryCategory || item.product.subCategory || item.product.technicalTags) && (
                      <div className="flex flex-wrap gap-1">
                        {item.product.primaryCategory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                            {item.product.primaryCategory}
                          </span>
                        )}
                        {item.product.subCategory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary/10 text-secondary">
                            {item.product.subCategory}
                          </span>
                        )}
                        {item.product.technicalTags && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                            {item.product.technicalTags}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quantity controls row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={discountType === 'percentage' ? 'default' : 'outline'}
                className="h-10 sm:h-12 flex-1 rounded-xl text-sm sm:text-base"
                onClick={() => setDiscountType(discountType === 'percentage' ? null : 'percentage')}
              >
                <Percent className="h-4 w-4 mr-1 sm:mr-2" /> %
              </Button>
              <Button
                variant={discountType === 'fixed' ? 'default' : 'outline'}
                className="h-10 sm:h-12 flex-1 rounded-xl text-sm sm:text-base"
                onClick={() => setDiscountType(discountType === 'fixed' ? null : 'fixed')}
              >
                <DollarSign className="h-4 w-4 mr-1 sm:mr-2" /> Fixed
              </Button>
              {discountType && (
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '10' : '5.00'}
                  className="h-10 sm:h-12 w-20 sm:w-24 rounded-xl"
                />
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-base sm:text-lg">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-destructive text-sm sm:text-base">
                  <span>Discount:</span>
                  <span>-₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Tax ({taxRate}%):</span>
                  <span>₱{(Math.round(taxAmountCalc * 100) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl sm:text-2xl font-bold">
                <span>Total:</span>
                <span>₱{(totalWithTax).toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full h-14 sm:h-16 text-lg sm:text-xl mt-4 rounded-xl"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              Complete Sale
            </Button>
          </CardContent>
        </Card>
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={addToCart}
        stayOpen={true}
      />

      {completedSale && (
        <ReceiptDialog
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={(open) => !open && setShowCheckoutConfirm(false)}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Confirm Sale
            </DialogTitle>
            <DialogDescription>
              Please review the sale details before completing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Items:</span>
                <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)} item{cart.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-semibold">₱{subtotal.toFixed(2)}</span>
              </div>
              {discountType && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}):</span>
                  <span className="font-semibold">-₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-semibold">₱{(Math.round(taxAmountCalc * 100) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between text-base">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">₱{(totalWithTax).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCheckoutConfirm(false)} 
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmCheckout} 
              className="rounded-xl"
            >
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

