import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { exportAllData, importAllData, ExportData, getSettings, saveSettings } from "@/lib/db";
import { settingsAPI, salesAPI, authAPI } from "@/lib/api";
import { resolveAssetUrl } from "@/lib/utils";
import { Download, Upload, Database, AlertTriangle, Trash2, Plus, X, Edit2, Tag } from "lucide-react";

export function BackupPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [showFreshStartConfirm, setShowFreshStartConfirm] = useState(false);
  const [freshStartStep, setFreshStartStep] = useState(1);
  const [freshStartPassword, setFreshStartPassword] = useState("");
  const [showClearSalesConfirm, setShowClearSalesConfirm] = useState(false);
  const [isClearingSales, setIsClearingSales] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [taxRate, setTaxRate] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Category management state
  const [primaryCategories, setPrimaryCategories] = useState<string[]>([
    'CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Cooling', 'Case', 'Peripherals', 'Cables', 'Accessories'
  ]);
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, string[]>>({
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
  });
  const [newPrimaryCategory, setNewPrimaryCategory] = useState("");
  const [editingPrimaryCategory, setEditingPrimaryCategory] = useState<string | null>(null);
  const [editingPrimaryCategoryName, setEditingPrimaryCategoryName] = useState("");
  const [selectedPrimaryCategoryForSub, setSelectedPrimaryCategoryForSub] = useState<string | null>(null);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [editingSubCategory, setEditingSubCategory] = useState<{primary: string, sub: string} | null>(null);
  const [editingSubCategoryName, setEditingSubCategoryName] = useState("");
  
  const { toast } = useToast();
  const { logout, session } = useAuth();

  // Load settings on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      if (settings) {
        setStoreName(settings.storeName || "");
        setStoreLogoUrl(settings.storeLogoUrl || "");
        setStoreEmail(settings.storeEmail || "");
        setStorePhone(settings.storePhone || "");
        setStoreAddress(settings.storeAddress || "");
        setStoreDescription(settings.storeDescription || "");
        setCurrency(settings.currency || "PHP");
        setTaxRate(settings.taxRate?.toString() || "");
      }
    };
    loadSettings();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Exported", description: "Backup downloaded successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingImportFile(file);
    setShowImportConfirm(true);
  };

  const cancelImport = () => {
    setShowImportConfirm(false);
    setPendingImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = async () => {
    if (!pendingImportFile) return;

    setIsImporting(true);
    try {
      const text = await pendingImportFile.text();
      const data: ExportData = JSON.parse(text);

      // Basic validation
      if (!data.users || !data.products || !data.sales) {
        throw new Error("Invalid backup file format");
      }

      await importAllData(data);
      
      // Clear all local storage and tokens
      localStorage.clear();
      
      toast({ title: "Imported", description: "Data restored. Redirecting to login..." });

      // Logout and redirect to login
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      cancelImport();
    }
  };

  const handleOpenFreshStart = () => {
    setFreshStartStep(1);
    setShowFreshStartConfirm(true);
  };

  const handleConfirmStep1 = () => {
    setFreshStartStep(2);
  };

  const handleConfirmFreshStart = async () => {
    if (!session?.username || !freshStartPassword) {
      toast({
        title: "Error",
        description: "Password is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verify password first
      await authAPI.login(session.username, freshStartPassword);
      
      // If login succeeds, proceed with reset
      await settingsAPI.reset();
      localStorage.clear();
      logout();
      toast({ title: "Success", description: "Database cleared. Redirecting to setup..." });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Incorrect password or failed to clear database",
        variant: "destructive",
      });
    }
  };

  const handleCancelFreshStart = () => {
    setShowFreshStartConfirm(false);
    setFreshStartStep(1);
    setFreshStartPassword("");
  };

  const handleClearSales = async () => {
    setIsClearingSales(true);
    try {
      await salesAPI.clearAll();
      toast({ title: "Success", description: "All sales data cleared successfully" });
      setShowClearSalesConfirm(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear sales data",
        variant: "destructive",
      });
    } finally {
      setIsClearingSales(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!storeName.trim()) {
      toast({
        title: "Error",
        description: "Store name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      await saveSettings({
        id: 'app-settings',
        storeName: storeName.trim(),
        storeLogoUrl: storeLogoUrl.trim() || undefined,
        storeEmail: storeEmail.trim() || undefined,
        storePhone: storePhone.trim() || undefined,
        storeAddress: storeAddress.trim() || undefined,
        storeDescription: storeDescription.trim() || undefined,
        currency: currency || "PHP",
        taxRate: taxRate ? parseFloat(taxRate) : undefined,
        isSetupComplete: true,
      });
      toast({ title: "Success", description: "Store settings updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveTechnicalTagsToSettings = async (tags: string[]) => {
    try {
      const settings = await getSettings();
      if (settings) {
        await saveSettings({
          ...settings,
          technicalTags: tags,
        });
      }
    } catch (error) {
      console.error("Failed to save technical tags:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Data Backup & Restore</h2>
        <p className="text-muted-foreground mt-2">Export your data for backup or import to restore/migrate</p>
      </div>

      {/* Store Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Store Settings</CardTitle>
          <CardDescription>Update your store information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name *</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter your store name"
              className="h-12 rounded-xl text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeLogoUrl">Store Logo URL (optional)</Label>
            <Input
              id="storeLogoUrl"
              value={storeLogoUrl}
              onChange={(e) => setStoreLogoUrl(e.target.value)}
              placeholder="https://.../logo.png"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <UILabel>Upload Store Logo (PNG/JPG/WEBP)</UILabel>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setLogoFile(f);
              }} className="h-12 rounded-xl" />
              <Button
                variant="outline"
                disabled={!logoFile || isUploadingLogo}
                onClick={async () => {
                  if (!logoFile) return;
                  setIsUploadingLogo(true);
                  try {
                    const res = await settingsAPI.uploadLogo(logoFile);
                    if (res?.storeLogoUrl) {
                      setStoreLogoUrl(res.storeLogoUrl);
                      toast({ title: "Logo uploaded", description: "Store logo updated successfully" });
                    }
                  } catch (err) {
                    toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unable to upload logo", variant: "destructive" });
                  } finally {
                    setIsUploadingLogo(false);
                  }
                }}
              >
                {isUploadingLogo ? "Uploading..." : "Upload Logo"}
              </Button>
            </div>
            {storeLogoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={resolveAssetUrl(storeLogoUrl)} alt="Logo preview" className="h-12 w-auto object-contain rounded" />
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeEmail">Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                placeholder="store@example.com"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storePhone">Phone</Label>
              <Input
                id="storePhone"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="+63 123 456 7890"
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress">Address</Label>
            <Input
              id="storeAddress"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="123 Main St, City, Country"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">Description</Label>
            <Input
              id="storeDescription"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Brief description of your store"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="PHP"
                maxLength={3}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0.00"
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <Button 
            onClick={handleSaveSettings} 
            disabled={isSavingSettings}
            className="w-full h-12 rounded-xl mt-6"
          >
            {isSavingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Category Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" /> Category Management
          </CardTitle>
          <CardDescription>Manage product categories and sub-categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Categories Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Primary Categories</h3>
            </div>
            
            {/* Add New Primary Category */}
            <div className="flex gap-2">
              <Input
                value={newPrimaryCategory}
                onChange={(e) => setNewPrimaryCategory(e.target.value)}
                placeholder="Add new primary category"
                className="h-10 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPrimaryCategory.trim()) {
                    e.preventDefault();
                    if (!primaryCategories.includes(newPrimaryCategory.trim())) {
                      setPrimaryCategories([...primaryCategories, newPrimaryCategory.trim()]);
                      setSubCategoriesMap({...subCategoriesMap, [newPrimaryCategory.trim()]: []});
                      toast({ title: 'Added', description: `Primary category "${newPrimaryCategory}" added` });
                      setNewPrimaryCategory('');
                    } else {
                      toast({ title: 'Exists', description: 'Category already exists', variant: 'destructive' });
                    }
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 rounded-xl"
                onClick={() => {
                  if (newPrimaryCategory.trim() && !primaryCategories.includes(newPrimaryCategory.trim())) {
                    setPrimaryCategories([...primaryCategories, newPrimaryCategory.trim()]);
                    setSubCategoriesMap({...subCategoriesMap, [newPrimaryCategory.trim()]: []});
                    toast({ title: 'Added', description: `Primary category "${newPrimaryCategory}" added` });
                    setNewPrimaryCategory('');
                  } else if (primaryCategories.includes(newPrimaryCategory.trim())) {
                    toast({ title: 'Exists', description: 'Category already exists', variant: 'destructive' });
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* List Primary Categories */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {primaryCategories.map((category) => (
                <div key={category} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                  {editingPrimaryCategory === category ? (
                    <>
                      <Input
                        value={editingPrimaryCategoryName}
                        onChange={(e) => setEditingPrimaryCategoryName(e.target.value)}
                        className="h-8 rounded-lg flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingPrimaryCategoryName.trim()) {
                            const oldName = category;
                            const newName = editingPrimaryCategoryName.trim();
                            if (!primaryCategories.includes(newName) || newName === oldName) {
                              const updatedCategories = primaryCategories.map(c => c === oldName ? newName : c);
                              setPrimaryCategories(updatedCategories);
                              const updatedMap = {...subCategoriesMap};
                              if (oldName !== newName) {
                                updatedMap[newName] = updatedMap[oldName];
                                delete updatedMap[oldName];
                                setSubCategoriesMap(updatedMap);
                              }
                              toast({ title: 'Updated', description: `Category renamed to "${newName}"` });
                              setEditingPrimaryCategory(null);
                              setEditingPrimaryCategoryName('');
                            }
                          } else if (e.key === 'Escape') {
                            setEditingPrimaryCategory(null);
                            setEditingPrimaryCategoryName('');
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          const oldName = category;
                          const newName = editingPrimaryCategoryName.trim();
                          if (newName && (!primaryCategories.includes(newName) || newName === oldName)) {
                            const updatedCategories = primaryCategories.map(c => c === oldName ? newName : c);
                            setPrimaryCategories(updatedCategories);
                            const updatedMap = {...subCategoriesMap};
                            if (oldName !== newName) {
                              updatedMap[newName] = updatedMap[oldName];
                              delete updatedMap[oldName];
                              setSubCategoriesMap(updatedMap);
                            }
                            toast({ title: 'Updated', description: `Category renamed to "${newName}"` });
                            setEditingPrimaryCategory(null);
                            setEditingPrimaryCategoryName('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingPrimaryCategory(null);
                          setEditingPrimaryCategoryName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{category}</span>
                      <Button
                        variant="ghost"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          setSelectedPrimaryCategoryForSub(category);
                          setShowSubCategoryModal(true);
                        }}
                      >
                        {subCategoriesMap[category]?.length === 0 ? "Add Sub-Categories" : `Manage Sub-Categories (${subCategoriesMap[category]?.length})`}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingPrimaryCategory(category);
                          setEditingPrimaryCategoryName(category);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          const updated = primaryCategories.filter(c => c !== category);
                          setPrimaryCategories(updated);
                          const updatedMap = {...subCategoriesMap};
                          delete updatedMap[category];
                          setSubCategoriesMap(updatedMap);
                          toast({ title: 'Deleted', description: `Category "${category}" deleted` });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-Category Management Modal */}
      <Dialog open={showSubCategoryModal} onOpenChange={setShowSubCategoryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Sub-Categories: {selectedPrimaryCategoryForSub}</DialogTitle>
            <DialogDescription>
              Add, edit, or remove sub-categories for {selectedPrimaryCategoryForSub}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add New Sub-Category */}
            <div className="flex gap-2">
              <Input
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                placeholder="Add new sub-category"
                className="h-10 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubCategory.trim() && selectedPrimaryCategoryForSub) {
                    e.preventDefault();
                    const currentSubs = subCategoriesMap[selectedPrimaryCategoryForSub] || [];
                    if (!currentSubs.includes(newSubCategory.trim())) {
                      setSubCategoriesMap({
                        ...subCategoriesMap,
                        [selectedPrimaryCategoryForSub]: [...currentSubs, newSubCategory.trim()]
                      });
                      toast({ title: 'Added', description: `Sub-category "${newSubCategory}" added` });
                      setNewSubCategory('');
                    } else {
                      toast({ title: 'Exists', description: 'Sub-category already exists', variant: 'destructive' });
                    }
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 rounded-xl"
                onClick={() => {
                  if (newSubCategory.trim() && selectedPrimaryCategoryForSub) {
                    const currentSubs = subCategoriesMap[selectedPrimaryCategoryForSub] || [];
                    if (!currentSubs.includes(newSubCategory.trim())) {
                      setSubCategoriesMap({
                        ...subCategoriesMap,
                        [selectedPrimaryCategoryForSub]: [...currentSubs, newSubCategory.trim()]
                      });
                      toast({ title: 'Added', description: `Sub-category "${newSubCategory}" added` });
                      setNewSubCategory('');
                    } else {
                      toast({ title: 'Exists', description: 'Sub-category already exists', variant: 'destructive' });
                    }
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* List Sub-Categories */}
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
              {selectedPrimaryCategoryForSub && (subCategoriesMap[selectedPrimaryCategoryForSub] || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No sub-categories yet. Add one above.
                </div>
              ) : (
                selectedPrimaryCategoryForSub && (subCategoriesMap[selectedPrimaryCategoryForSub] || []).map((subCat) => (
                  <div key={subCat} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                    {editingSubCategory?.primary === selectedPrimaryCategoryForSub && editingSubCategory?.sub === subCat ? (
                      <>
                        <Input
                          value={editingSubCategoryName}
                          onChange={(e) => setEditingSubCategoryName(e.target.value)}
                          className="h-9 rounded-lg flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingSubCategoryName.trim() && selectedPrimaryCategoryForSub) {
                              const currentSubs = subCategoriesMap[selectedPrimaryCategoryForSub] || [];
                              const newName = editingSubCategoryName.trim();
                              if (!currentSubs.includes(newName) || newName === subCat) {
                                const updatedSubs = currentSubs.map(s => s === subCat ? newName : s);
                                setSubCategoriesMap({
                                  ...subCategoriesMap,
                                  [selectedPrimaryCategoryForSub]: updatedSubs
                                });
                                toast({ title: 'Updated', description: `Sub-category renamed to "${newName}"` });
                                setEditingSubCategory(null);
                                setEditingSubCategoryName('');
                              }
                            } else if (e.key === 'Escape') {
                              setEditingSubCategory(null);
                              setEditingSubCategoryName('');
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => {
                            if (selectedPrimaryCategoryForSub) {
                              const currentSubs = subCategoriesMap[selectedPrimaryCategoryForSub] || [];
                              const newName = editingSubCategoryName.trim();
                              if (newName && (!currentSubs.includes(newName) || newName === subCat)) {
                                const updatedSubs = currentSubs.map(s => s === subCat ? newName : s);
                                setSubCategoriesMap({
                                  ...subCategoriesMap,
                                  [selectedPrimaryCategoryForSub]: updatedSubs
                                });
                                toast({ title: 'Updated', description: `Sub-category renamed to "${newName}"` });
                                setEditingSubCategory(null);
                                setEditingSubCategoryName('');
                              }
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditingSubCategory(null);
                            setEditingSubCategoryName('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{subCat}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditingSubCategory({primary: selectedPrimaryCategoryForSub!, sub: subCat});
                            setEditingSubCategoryName(subCat);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (selectedPrimaryCategoryForSub) {
                              const currentSubs = subCategoriesMap[selectedPrimaryCategoryForSub] || [];
                              const updatedSubs = currentSubs.filter(s => s !== subCat);
                              setSubCategoriesMap({
                                ...subCategoriesMap,
                                [selectedPrimaryCategoryForSub]: updatedSubs
                              });
                              toast({ title: 'Deleted', description: `Sub-category "${subCat}" deleted` });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSubCategoryModal(false);
                setEditingSubCategory(null);
                setEditingSubCategoryName('');
                setNewSubCategory('');
              }}
              className="rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Export Data
          </CardTitle>
          <CardDescription>Download all users, products, sales, and settings as a JSON file</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full h-14 text-lg" onClick={handleExport} disabled={isExporting}>
            <Download className="h-5 w-5 mr-2" />
            {isExporting ? "Exporting..." : "Download Backup"}
          </Button>
        </CardContent>
        {/* Info */}
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">What's included in the backup?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• All user accounts (with hashed passwords)</li>
            <li>• All products with stock levels</li>
            <li>• Product images</li>
            <li>• Complete sales history</li>
            <li>• Store settings</li>
          </ul>
        </CardContent>
      </Card>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Import Data
          </CardTitle>
          <CardDescription>Restore data from a previously exported backup file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">Warning</p>
              <p className="text-muted-foreground">Importing will replace ALL existing data. This action cannot be undone. Make sure to export your current data first if needed.</p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          <Button variant="outline" className="w-full h-14 text-lg" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            <Upload className="h-5 w-5 mr-2" />
            {isImporting ? "Importing..." : "Select Backup File"}
          </Button>
        </CardContent>
      </Card>

      {/* Clear Sales Card */}
      <Card className="border-amber-500/50 bg-amber-500/5 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <Trash2 className="h-5 w-5" /> Clear Sales Data
          </CardTitle>
          <CardDescription>Delete all sales records and reset revenue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-600">Warning</p>
              <p className="text-muted-foreground">
                This will permanently delete all sales history. Products, users, and settings will remain intact. This action cannot be undone.
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl border-amber-500/50 text-amber-600 hover:bg-amber-500/10" 
            onClick={() => setShowClearSalesConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Sales Data
          </Button>
        </CardContent>
      </Card>

      {/* Fresh Start Card */}
      <Card className="border-destructive/50 bg-destructive/5 mb-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> Fresh Start
          </CardTitle>
          <CardDescription>Delete all data and start from scratch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">Danger Zone</p>
              <p className="text-muted-foreground">
                This will permanently delete all data including users, products, product images, sales, and settings. This action cannot be undone. Make sure to export your data first if needed.
              </p>
            </div>
          </div>

          <Button variant="destructive" className="w-full h-12 rounded-xl" onClick={handleOpenFreshStart}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Data & Start Fresh
          </Button>
        </CardContent>
      </Card>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportConfirm} onOpenChange={(open) => !open && cancelImport()}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Replace All Data?
            </DialogTitle>
            <DialogDescription>
              Importing <strong>{pendingImportFile?.name}</strong> will overwrite all existing users, products, and sales. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelImport} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmImport} className="rounded-xl" disabled={isImporting}>
              {isImporting ? "Importing..." : "Yes, Replace Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fresh Start Confirmation Dialog */}
      <Dialog open={showFreshStartConfirm} onOpenChange={handleCancelFreshStart}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {freshStartStep === 1 ? "Delete All Data?" : "Final Confirmation"}
            </DialogTitle>
          </DialogHeader>

          {freshStartStep === 1 ? (
            <>
              <DialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete <strong>ALL data</strong> and start fresh? This action cannot be undone!
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-destructive mb-1">This will delete:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• All user accounts</li>
                    <li>• All products and stock levels</li>
                    <li>• Complete sales history</li>
                    <li>• Store settings</li>
                  </ul>
                </div>
              </DialogDescription>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleCancelFreshStart} className="rounded-xl">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmStep1} className="rounded-xl">
                  Continue
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogDescription>
                <p className="font-semibold text-destructive mb-3">Enter your password to confirm deletion.</p>
                <p className="text-sm text-muted-foreground mb-4">This is the final step. There is no going back after this.</p>
                
                <div className="space-y-2">
                  <Label htmlFor="fresh-start-password">Your Password</Label>
                  <Input
                    id="fresh-start-password"
                    type="password"
                    value={freshStartPassword}
                    onChange={(e) => setFreshStartPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="rounded-xl"
                  />
                </div>
              </DialogDescription>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleCancelFreshStart} className="rounded-xl">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmFreshStart} 
                  className="rounded-xl"
                  disabled={!freshStartPassword}
                >
                  Yes, Delete Everything
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Clear Sales Confirmation Dialog */}
      <Dialog open={showClearSalesConfirm} onOpenChange={setShowClearSalesConfirm}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Clear All Sales Data?
            </DialogTitle>
            <DialogDescription>
              <p className="mb-3">
                This will permanently delete <strong>all sales records</strong>. This action cannot be undone!
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                <p className="font-semibold text-amber-600 mb-1">What will be deleted:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Complete sales history</li>
                  <li>• Revenue records</li>
                </ul>
                <p className="font-semibold text-green-600 mt-2 mb-1">What will be kept:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• All products and stock levels</li>
                  <li>• All user accounts</li>
                  <li>• Store settings</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowClearSalesConfirm(false)} 
              className="rounded-xl"
              disabled={isClearingSales}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearSales} 
              className="rounded-xl bg-amber-600 hover:bg-amber-700"
              disabled={isClearingSales}
            >
              {isClearingSales ? "Clearing..." : "Yes, Clear Sales Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
