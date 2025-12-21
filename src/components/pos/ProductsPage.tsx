import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagsInput } from '@/components/ui/tags-input';
import { useToast } from '@/hooks/use-toast';
import { getAllProducts, createProduct, updateProduct, deleteProduct, restoreProduct, permanentlyDeleteProduct, Product, getSettings, saveSettings } from '@/lib/db';
import { generateId } from '@/lib/auth';
import { BarcodeScanner } from './BarcodeScanner';
import { Plus, Edit, Trash2, Package, Search, Barcode, Camera, Archive, RotateCcw, Tag, X, Upload } from 'lucide-react';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const csvInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restoringProduct, setRestoringProduct] = useState<Product | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    stock: '',
    primaryCategory: '',
    subCategory: '',
    technicalTags: '',
    imageUrl: '',
  });
  
  const primaryCategories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Cooling', 'Case', 'Peripherals', 'Cables', 'Accessories'];
  const subCategoriesMap: Record<string, string[]> = {
    'CPU': ['Intel Core', 'AMD Ryzen', 'Intel Xeon', 'AMD Threadripper'],
    'GPU': ['NVIDIA', 'AMD Radeon', 'Intel Arc'],
    'Motherboard': ['LGA1700', 'LGA1200', 'AM5', 'AM4', 'TRX40'],
    'RAM': ['DDR5', 'DDR4', 'DDR3'],
    'Storage': ['NVMe SSD', 'SATA SSD', 'HDD', 'M.2'],
    'PSU': ['Modular', 'Semi-Modular', 'Non-Modular'],
    'Cooling': ['Air Cooler', 'AIO Liquid', 'Custom Loop', 'Case Fans'],
    'Case': ['ATX', 'Micro-ATX', 'Mini-ITX', 'Full Tower'],
    'Peripherals': ['Keyboard', 'Mouse', 'Monitor', 'Headset', 'Webcam'],
    'Cables': ['USB', 'DisplayPort', 'HDMI', 'Power'],
    'Accessories': ['Thermal Paste', 'Cable Management', 'RGB', 'Tools']
  };
  const [categories, setCategories] = useState<string[]>(['Accessories', 'Cables', 'GPU', 'CPU', 'Case', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Cooling']);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const allProducts = await getAllProducts();
    setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
    
    // Load technical tags from settings
    const settings = await getSettings();
    if (settings && settings.technicalTags && settings.technicalTags.length > 0) {
      setTagSuggestions(settings.technicalTags);
    } else {
      // Fallback: Extract unique tag suggestions from all products if not in settings
      const tagsSet = new Set<string>();
      allProducts.forEach(product => {
        if (product.technicalTags) {
          product.technicalTags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
            .forEach(tag => tagsSet.add(tag));
        }
      });
      setTagSuggestions(Array.from(tagsSet).sort());
    }
  };

  const saveTagsToSettings = async (tagsString: string) => {
    if (!tagsString.trim()) return;
    
    try {
      const newTags = tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
      
      const settings = await getSettings();
      const existingTags = settings?.technicalTags || [];
      const combinedTags = Array.from(new Set([...existingTags, ...newTags])).sort();
      
      if (settings) {
        await saveSettings({
          ...settings,
          technicalTags: combinedTags,
        });
        setTagSuggestions(combinedTags);
      }
    } catch (error) {
      console.error('Failed to save tags to settings:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', barcode: '', price: '', stock: '', primaryCategory: '', subCategory: '', technicalTags: '', imageUrl: '' });
    setEditingProduct(null);
    setRestoringProduct(null);
    setSelectedImageFile(null);
    setImagePreview('');
    setShowAddCategory(false);
    setNewCategory('');
  };

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        barcode: product.barcode,
        price: product.price.toString(),
        stock: product.stock.toString(),
        primaryCategory: product.primaryCategory || '',
        subCategory: product.subCategory || '',
        technicalTags: product.technicalTags || '',
        imageUrl: product.imageUrl || '',
      });
      // Set proper preview URL for existing images
      if (product.imageUrl && !product.imageUrl.startsWith('data:')) {
        const previewUrl = product.imageUrl.startsWith('http') 
          ? product.imageUrl 
          : `http://localhost:3000${product.imageUrl}`;
        setImagePreview(previewUrl);
      } else {
        setImagePreview('');
      }
      setSelectedImageFile(null);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { name, barcode, price, stock, primaryCategory, subCategory, technicalTags, imageUrl } = formData;
    
    if (!name.trim() || !barcode.trim() || !price || !stock) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct({
          ...editingProduct,
          name: name.trim(),
          barcode: barcode.trim(),
          price: parseFloat(price),
          stock: parseInt(stock),
          primaryCategory: primaryCategory?.trim() || undefined,
          subCategory: subCategory?.trim() || undefined,
          technicalTags: technicalTags?.trim() || undefined,
          imageUrl: selectedImageFile ? undefined : (imageUrl?.trim() || undefined),
          updatedAt: new Date(),
        }, selectedImageFile || undefined);
        
        // Save new tags to settings
        if (technicalTags?.trim()) {
          await saveTagsToSettings(technicalTags);
        }
        
        // If this was a restore operation and stock is now > 0, restore the product
        if (restoringProduct && parseInt(stock) > 0) {
          await restoreProduct(editingProduct.id);
          toast({ title: 'Restored', description: 'Product updated and restored successfully' });
        } else {
          toast({ title: 'Updated', description: 'Product updated successfully' });
        }
      } else {
        await createProduct({
          id: generateId(),
          name: name.trim(),
          barcode: barcode.trim(),
          price: parseFloat(price),
          stock: parseInt(stock),
          primaryCategory: primaryCategory?.trim() || undefined,
          subCategory: subCategory?.trim() || undefined,
          technicalTags: technicalTags?.trim() || undefined,
          imageUrl: selectedImageFile ? undefined : (imageUrl?.trim() || undefined),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }, selectedImageFile || undefined);
        
        // Save new tags to settings
        if (technicalTags?.trim()) {
          await saveTagsToSettings(technicalTags);
        }
        
        toast({ title: 'Created', description: 'Product created successfully' });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      });
    }
  };

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    
    // Store the actual file object
    setSelectedImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      toast({ title: 'Image added', description: 'Image ready to upload' });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (product: Product) => {
    setShowArchiveConfirm(product);
  };

  const confirmArchive = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      toast({ title: 'Archived', description: 'Product archived successfully' });
      setShowArchiveConfirm(null);
      loadProducts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive product', variant: 'destructive' });
    }
  };

  const handleRestore = async (product: Product) => {
    // If stock is 0, open edit dialog to update stock first
    if (product.stock <= 0) {
      setRestoringProduct(product);
      openDialog(product);
      toast({ 
        title: 'Update Required', 
        description: 'Please update stock before restoring', 
        variant: 'default' 
      });
      return;
    }
    
    try {
      await restoreProduct(product.id);
      toast({ title: 'Restored', description: 'Product restored successfully' });
      loadProducts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore product', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (product: Product) => {
    setShowDeleteConfirm(product);
  };

  const confirmPermanentDelete = async (product: Product) => {

      const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
          toast({ title: 'Invalid File', description: 'Please select a CSV file', variant: 'destructive' });
          return;
        }

        setIsImporting(true);
        try {
          const text = await file.text();
          const lines = text.split('\n').filter(line => line.trim());
      
          if (lines.length < 2) {
            toast({ title: 'Empty File', description: 'CSV file is empty or has no data', variant: 'destructive' });
            setIsImporting(false);
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const requiredHeaders = ['name', 'barcode', 'price', 'stock'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            toast({ 
              title: 'Invalid CSV Format', 
              description: `Missing columns: ${missingHeaders.join(', ')}. Required: name, barcode, price, stock`,
              variant: 'destructive' 
            });
            setIsImporting(false);
            return;
          }

          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          for (let i = 1; i < lines.length; i++) {
            try {
              const values = lines[i].split(',').map(v => v.trim());
              const product: any = {};

              headers.forEach((header, index) => {
                product[header] = values[index] || '';
              });

              if (!product.name || !product.barcode || !product.price || !product.stock) {
                errors.push(`Row ${i + 1}: Missing required fields`);
                errorCount++;
                continue;
              }

              const price = parseFloat(product.price);
              const stock = parseInt(product.stock);

              if (isNaN(price) || isNaN(stock)) {
                errors.push(`Row ${i + 1}: Invalid price or stock value`);
                errorCount++;
                continue;
              }

              await createProduct({
                id: generateId(),
                name: product.name,
                barcode: product.barcode,
                price: price,
                stock: stock,
                primaryCategory: product.primarycategory?.trim() || product.category?.trim() || undefined,
                subCategory: product.subcategory?.trim() || undefined,
                technicalTags: product.technicaltags?.trim() || product.tags?.trim() || undefined,
                imageUrl: product.imageurl?.trim() || undefined,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              if (product.technicaltags || product.tags) {
                await saveTagsToSettings(product.technicaltags || product.tags);
              }

              successCount++;
            } catch (error) {
              errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Failed to import'}`);
              errorCount++;
            }
          }

          await loadProducts();
      
          if (successCount > 0) {
            toast({ 
              title: 'Import Complete', 
              description: `Successfully imported ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : ''}` 
            });
          }

          if (errors.length > 0 && errors.length <= 5) {
            errors.forEach(err => {
              toast({ title: 'Import Error', description: err, variant: 'destructive' });
            });
          } else if (errors.length > 5) {
            toast({ 
              title: 'Multiple Errors', 
              description: `${errorCount} rows failed to import. Check CSV format.`,
              variant: 'destructive' 
            });
          }

          setShowImportDialog(false);
        } catch (error) {
          toast({ 
            title: 'Import Failed', 
            description: error instanceof Error ? error.message : 'Failed to parse CSV file',
            variant: 'destructive' 
          });
        } finally {
          setIsImporting(false);
          if (csvInputRef.current) csvInputRef.current.value = '';
        }
      };

      const downloadCSVTemplate = () => {
        const template = 'name,barcode,price,stock,primaryCategory,subCategory,technicalTags,imageUrl\nSample Product,123456789,99.99,10,CPU,AMD Ryzen,"6-Core, 3.7GHz",https://example.com/image.jpg';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product-import-template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Downloaded', description: 'CSV template downloaded successfully' });
      };
    try {
      await permanentlyDeleteProduct(product.id);
      toast({ title: 'Deleted', description: 'Product permanently deleted' });
      setShowDeleteConfirm(null);
      loadProducts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.isActive === !showArchived &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        (p.primaryCategory?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.technicalTags?.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Invalid File', description: 'Please select a CSV file', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast({ title: 'Empty File', description: 'CSV file is empty or has no data', variant: 'destructive' });
        setIsImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'barcode', 'price', 'stock'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast({ 
          title: 'Invalid CSV Format', 
          description: `Missing columns: ${missingHeaders.join(', ')}. Required: name, barcode, price, stock`,
          variant: 'destructive' 
        });
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const product: any = {};

          headers.forEach((header, index) => {
            product[header] = values[index] || '';
          });

          if (!product.name || !product.barcode || !product.price || !product.stock) {
            errors.push(`Row ${i + 1}: Missing required fields`);
            errorCount++;
            continue;
          }

          const price = parseFloat(product.price);
          const stock = parseInt(product.stock);

          if (isNaN(price) || isNaN(stock)) {
            errors.push(`Row ${i + 1}: Invalid price or stock value`);
            errorCount++;
            continue;
          }

          await createProduct({
            id: generateId(),
            name: product.name,
            barcode: product.barcode,
            price: price,
            stock: stock,
            primaryCategory: product.primarycategory || product.category || undefined,
            subCategory: product.subcategory || undefined,
            technicalTags: product.technicaltags || product.tags || undefined,
            imageUrl: product.imageurl || undefined,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          if (product.technicaltags || product.tags) {
            await saveTagsToSettings(product.technicaltags || product.tags);
          }

          successCount++;
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Failed to import'}`);
          errorCount++;
        }
      }

      await loadProducts();

      if (successCount > 0) {
        toast({ 
          title: 'Import Complete', 
          description: `Successfully imported ${successCount} product${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : ''}` 
        });
      }

      if (errors.length > 0 && errors.length <= 5) {
        errors.forEach(err => {
          toast({ title: 'Import Error', description: err, variant: 'destructive' });
        });
      } else if (errors.length > 5) {
        toast({ 
          title: 'Multiple Errors', 
          description: `${errorCount} rows failed to import. Check CSV format.`,
          variant: 'destructive' 
        });
      }

      setShowImportDialog(false);
    } catch (error) {
      toast({ 
        title: 'Import Failed', 
        description: error instanceof Error ? error.message : 'Failed to parse CSV file',
        variant: 'destructive' 
      });
    } finally {
      setIsImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const downloadCSVTemplate = () => {
    const template = 'name,barcode,price,stock,primaryCategory,subCategory,technicalTags,imageUrl\nSample Product,123456789,99.99,10,CPU,AMD Ryzen,"6-Core, 3.7GHz",https://example.com/image.jpg';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'CSV template downloaded successfully' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-10 h-10 sm:h-10 rounded-xl w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
                    {/* <Button 
                      variant="outline" 
                      className="h-10 rounded-xl text-sm sm:text-base flex-1 sm:flex-none" 
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Import CSV</span>
                      <span className="sm:hidden">Import</span>
                    </Button> */}
          <Button 
            variant="outline" 
            className="h-10 rounded-xl text-sm sm:text-base flex-1 sm:flex-none" 
            onClick={() => setShowArchived(!showArchived)}
          >
            <span className="sm:hidden">{showArchived ? 'Active' : 'Archived'}</span>
            <span className="hidden sm:inline">{showArchived ? 'Show Active' : 'Show Archived'}</span>
            {showArchived ? <Package className="h-4 w-4 ml-1 sm:ml-2" /> : <Archive className="h-4 w-4 ml-1 sm:ml-2" />}
          </Button>
          {!showArchived && (
            <Button className="h-10 rounded-xl text-sm sm:text-base flex-1 sm:flex-none" onClick={() => openDialog()}>
              <Plus className="h-5 w-5 mr-2" /> Add Product
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {filteredProducts.length === 0 ? (
          !showArchived && (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No products found</p>
                <Button className="mt-4" onClick={() => openDialog()}>
                  Add your first product
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="rounded-xl">
              <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 flex-wrap">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {product.imageUrl && product.imageUrl.trim() && !product.imageUrl.startsWith('data:') ? (
                    <img
                      src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:3000${product.imageUrl}`}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg sm:text-xl truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Barcode className="h-4 w-4" />
                    <span>{product.barcode}</span>
                  </div>
                  {(product.primaryCategory || product.subCategory || product.technicalTags) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.primaryCategory && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {product.primaryCategory}
                        </span>
                      )}
                      {product.subCategory && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                          {product.subCategory}
                        </span>
                      )}
                      {product.technicalTags && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.technicalTags}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-lg sm:text-2xl font-bold">₱{product.price.toFixed(2)}</p>
                  <p className={`text-xs sm:text-sm ${product.stock <= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>Stock: {product.stock}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  {product.isActive ? (
                    <>
                      <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" onClick={() => openDialog(product)}>
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" onClick={() => handleDelete(product)}>
                        <Archive className="h-5 w-5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="default" className="h-10 sm:h-12 rounded-xl text-xs sm:text-sm flex-1 sm:flex-none" onClick={() => handleRestore(product)}>
                        <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        Restore
                      </Button>
                      <Button variant="destructive" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" onClick={() => handlePermanentDelete(product)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-sm sm:max-w-md md:max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{restoringProduct ? 'Update Product to Restore' : editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., AMD Ryzen 5 5600X, RTX 3060, USB-C Cable"
                className="h-14 text-lg rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or enter barcode/SKU"
                  className="h-12 sm:h-14 text-lg flex-1 rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-full sm:h-14 sm:w-14 rounded-xl"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryCategory" className="text-sm sm:text-base">Primary Category</Label>
              <Select 
                value={formData.primaryCategory} 
                onValueChange={(value) => {
                  setFormData({ ...formData, primaryCategory: value, subCategory: '' });
                }}
              >
                <SelectTrigger className="h-12 sm:h-14 text-sm sm:text-lg rounded-xl w-full">
                  <SelectValue placeholder="Select primary category" />
                </SelectTrigger>
                <SelectContent className="w-full sm:w-auto">
                  <SelectItem value=" ">None</SelectItem>
                  {primaryCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.primaryCategory && formData.primaryCategory.trim() && subCategoriesMap[formData.primaryCategory] && (
              <div className="space-y-2">
                <Label htmlFor="subCategory" className="text-sm sm:text-base">Sub-Category</Label>
                <Select 
                  value={formData.subCategory} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, subCategory: value });
                  }}
                >
                  <SelectTrigger className="h-12 sm:h-14 text-sm sm:text-lg rounded-xl w-full">
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent className="w-full sm:w-auto">
                    <SelectItem value=" ">None</SelectItem>
                    {subCategoriesMap[formData.primaryCategory].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="technicalTags" className="text-sm sm:text-base">Technical Tags</Label>
              <TagsInput
                id="technicalTags"
                value={formData.technicalTags}
                onChange={(e) => setFormData({ ...formData, technicalTags: e.target.value })}
                suggestions={tagSuggestions}
                placeholder="Add tags or select from suggestions"
                className="text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">Type to search suggestions or add custom tags by separating with commas.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="h-14 text-lg rounded-xl"
              />
              <div className="flex flex-wrap gap-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={handleFilePick}>
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                {imagePreview && (
                  <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-border bg-muted">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₱)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="h-14 text-lg rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  className="h-14 text-lg rounded-xl"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button type="button" variant="outline" className="flex-1 h-12 sm:h-14 rounded-xl" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12 sm:h-14 rounded-xl">
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(barcode) => {
          setFormData({ ...formData, barcode });
          toast({ title: 'Barcode Scanned', description: `Barcode: ${barcode}` });
        }}
      />

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!showArchiveConfirm} onOpenChange={() => setShowArchiveConfirm(null)}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Archive Product?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to archive <strong>"{showArchiveConfirm?.name}"</strong>? You can restore it later from the archived products list.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl" 
                onClick={() => setShowArchiveConfirm(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 h-12 rounded-xl" 
                onClick={() => showArchiveConfirm && confirmArchive(showArchiveConfirm)}
              >
                Archive Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}

            {/* CSV Import Dialog */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle>Import Products from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file to import multiple products at once. 
                  </p>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold">Required Columns:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>name</li>
                      <li>barcode</li>
                      <li>price</li>
                      <li>stock</li>
                    </ul>
                    <p className="text-xs font-semibold mt-3">Optional Columns:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>primaryCategory</li>
                      <li>subCategory</li>
                      <li>technicalTags</li>
                      <li>imageUrl</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl" 
                      onClick={downloadCSVTemplate}
                    >
                      Download Template
                    </Button>
                    <Button 
                      className="flex-1 h-10 rounded-xl" 
                      onClick={() => csvInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      {isImporting ? 'Importing...' : 'Choose CSV File'}
                    </Button>
                  </div>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                </div>
              </DialogContent>
            </Dialog>
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Permanently Delete Product?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <strong>"{showDeleteConfirm?.name}"</strong>? This action cannot be undone!
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl" 
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 h-12 rounded-xl" 
                onClick={() => showDeleteConfirm && confirmPermanentDelete(showDeleteConfirm)}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
