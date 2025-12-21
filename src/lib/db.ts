import { productsAPI, usersAPI, salesAPI, settingsAPI } from './api';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
  isActive: boolean;
  createdAt: Date;
  activeSessionToken?: string | null;
  lastLoginAt?: Date | null;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  primaryCategory?: string | null;
  subCategory?: string | null;
  technicalTags?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  storeEmail: string;
  storeAddress: string;
  id: string;
  items: SaleItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  cashierId: string;
  cashierName: string;
  createdAt: Date;
}

export interface AppSettings {
  id: string;
  isSetupComplete: boolean;
  storeName: string;
  storeLogoUrl?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  storeDescription?: string;
  currency?: string;
  taxRate?: number;
  technicalTags?: string[];
}

// Product operations
export async function createProduct(product: Product, imageFile?: File): Promise<void> {
  await productsAPI.create({
    name: product.name,
    barcode: product.barcode,
    price: product.price,
    stock: product.stock,
    primaryCategory: product.primaryCategory || undefined,
    subCategory: product.subCategory || undefined,
    technicalTags: product.technicalTags || undefined,
    imageUrl: product.imageUrl || undefined,
    image: imageFile,
  });
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  try {
    return await productsAPI.getByBarcode(barcode);
  } catch {
    return undefined;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  return productsAPI.getAll();
}

export async function updateProduct(product: Product, imageFile?: File): Promise<void> {
  await productsAPI.update(product.id, {
    name: product.name,
    price: product.price,
    stock: product.stock,
    primaryCategory: product.primaryCategory || undefined,
    subCategory: product.subCategory || undefined,
    technicalTags: product.technicalTags || undefined,
    imageUrl: product.imageUrl || undefined,
    image: imageFile,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await productsAPI.delete(id);
}

export async function restoreProduct(id: string): Promise<void> {
  await productsAPI.restore(id);
}

export async function permanentlyDeleteProduct(id: string): Promise<void> {
  await productsAPI.permanentDelete(id);
}

// User operations
export async function createUser(user: User): Promise<void> {
  // User creation is handled via auth.ts registerUser
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  // This would require a backend endpoint - for now it's handled in auth module
  return undefined;
}

export async function getAllUsers(): Promise<User[]> {
  return usersAPI.getAll();
}

export async function updateUser(user: User, newPassword?: string): Promise<void> {
  const updates: { role?: 'admin' | 'cashier'; password?: string } = { role: user.role };
  if (newPassword) {
    updates.password = newPassword;
  }
  await usersAPI.update(user.id, updates);
}

export async function deleteUser(id: string): Promise<void> {
  await usersAPI.delete(id);
}

export async function reactivateUser(id: string): Promise<void> {
  await usersAPI.reactivate(id);
}

// Sale operations
export async function createSale(sale: Sale): Promise<void> {
  await salesAPI.create({
    items: sale.items,
    subtotal: sale.subtotal,
    discountType: sale.discountType,
    discountValue: sale.discountValue,
    discountAmount: sale.discountAmount,
    taxRate: sale.taxRate,
    taxAmount: sale.taxAmount,
    total: sale.total,
    cashierId: sale.cashierId,
    cashierName: sale.cashierName,
  });
}

export async function getAllSales(): Promise<Sale[]> {
  return salesAPI.getAll();
}

export async function getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
  return salesAPI.getAll(startDate, endDate);
}

// Settings operations
export async function getSettings(): Promise<AppSettings | undefined> {
  try {
    const settings = await settingsAPI.get();
    return {
      id: settings.id,
      isSetupComplete: settings.isSetupComplete,
      storeName: settings.storeName,
      storeLogoUrl: settings.storeLogoUrl,
      storeEmail: settings.storeEmail,
      storePhone: settings.storePhone,
      storeAddress: settings.storeAddress,
      storeDescription: settings.storeDescription,
      currency: settings.currency,
      taxRate: settings.taxRate,
      technicalTags: settings.technicalTags,
    };
  } catch {
    return undefined;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await settingsAPI.save({
    isSetupComplete: settings.isSetupComplete,
    storeName: settings.storeName,
    storeLogoUrl: settings.storeLogoUrl,
    storeEmail: settings.storeEmail,
    storePhone: settings.storePhone,
    storeAddress: settings.storeAddress,
    storeDescription: settings.storeDescription,
    currency: settings.currency,
    taxRate: settings.taxRate,
    technicalTags: settings.technicalTags,
  });
}

// Export/Import operations
export interface BackupUser extends User {
  passwordHash: string;
}

export interface ExportData {
  users: BackupUser[];
  products: Product[];
  sales: Sale[];
  settings: AppSettings | undefined;
  images?: { filename: string; data: string }[];
  exportedAt: string;
}

export async function exportAllData(): Promise<ExportData> {
  return settingsAPI.backup();
}

export async function importAllData(data: ExportData): Promise<void> {
  await settingsAPI.restore(data);
}
