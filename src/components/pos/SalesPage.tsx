import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAllSales, getSalesByDateRange, Sale } from '@/lib/db';
import { ReceiptDialog } from './ReceiptDialog';
import { History, Receipt, Calendar, DollarSign, Download } from 'lucide-react';

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const allSales = await getAllSales();
    setSales(allSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const filteredSales = (() => {
    if (dateFilter) {
      return sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        return saleDate === dateFilter;
      });
    }
    if (monthFilter) {
      const [yr, mo] = monthFilter.split('-').map(Number);
      return sales.filter((sale) => {
        const d = new Date(sale.createdAt);
        return d.getFullYear() === yr && d.getMonth() + 1 === mo;
      });
    }
    return sales;
  })();

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.items.length, 0);
  const totalSubtotal = filteredSales.reduce((sum, sale) => sum + sale.subtotal, 0);
  const totalDiscount = filteredSales.reduce((sum, sale) => sum + sale.discountAmount, 0);
  const totalTax = filteredSales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);
  const netTotal = totalSubtotal - totalDiscount;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const fetchMonth = async (month: string) => {
    if (!month) return;
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const monthNum = Number(monthStr);
    const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
    const monthSales = await getSalesByDateRange(start, end);
    setSales(monthSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const exportMonthCSV = () => {
    if (!monthFilter) return;
    const rows = [
      ['ReceiptID', 'Date', 'Cashier', 'Items', 'Subtotal', 'Discount', 'TaxRate', 'TaxAmount', 'Total'],
      ...filteredSales.map((s) => [
        s.id,
        new Date(s.createdAt).toISOString(),
        s.cashierName,
        s.items.length.toString(),
        s.subtotal.toFixed(2),
        s.discountAmount.toFixed(2),
        (s.taxRate ?? 0).toFixed(2),
        (s.taxAmount ?? 0).toFixed(2),
        s.total.toFixed(2),
      ]),
      [],
      ['Totals', '', '', totalItems.toString(), totalSubtotal.toFixed(2), totalDiscount.toFixed(2), '', totalTax.toFixed(2), (totalSubtotal - totalDiscount + totalTax).toFixed(2)],
    ];
    const csv = rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const [yr, mo] = monthFilter.split('-');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${yr}-${mo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5" /> Sales History
          </h2>
          <span className="text-muted-foreground">({filteredSales.length} sales)</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setMonthFilter(''); }}
              className="h-12 w-full sm:w-44"
            />
            {dateFilter && (
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setDateFilter('')}>
                Clear
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setDateFilter(''); fetchMonth(e.target.value); }}
              className="h-12 w-full sm:w-44"
            />
            {monthFilter && (
              <Button variant="outline" size="sm" onClick={() => exportMonthCSV()} className="rounded-xl w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="bg-primary text-primary-foreground rounded-xl">
          <CardContent className="p-6">
            <p className="text-primary-foreground/80">Total Revenue</p>
            <p className="text-3xl font-bold">₱{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Total Items</p>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Subtotal</p>
            <p className="text-3xl font-bold">₱{totalSubtotal.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Discounts</p>
            <p className="text-3xl font-bold text-destructive">₱{totalDiscount.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Tax</p>
            <p className="text-3xl font-bold">₱{totalTax.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Net Total</p>
            <p className="text-3xl font-bold">₱{(totalSubtotal - totalDiscount).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <div className="grid gap-3">
        {filteredSales.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No sales found</p>
            </CardContent>
          </Card>
        ) : (
          filteredSales.map((sale) => (
            <Card key={sale.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedSale(sale)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 items-center justify-center bg-muted">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">
                    Receipt ID: {sale.id.slice(0, 8)}
                  </p>
                  <p className="font-light text-muted-foreground">
                    {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(sale.createdAt)} • {sale.cashierName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">₱{sale.total.toFixed(2)}</p>
                  {sale.discountAmount > 0 && (
                    <p className="text-sm text-destructive">
                      -₱{sale.discountAmount.toFixed(2)} discount
                    </p>
                  )}
                  {sale.taxRate > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ₱{(sale.taxAmount ?? 0).toFixed(2)} tax ({(sale.taxRate ?? 0).toFixed(2)}%)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedSale && (
        <ReceiptDialog sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}
