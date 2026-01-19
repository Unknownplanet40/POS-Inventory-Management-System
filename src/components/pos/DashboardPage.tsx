import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getAllSales, getAllProducts, getAllUsers, getSettings } from '@/lib/db';
import { BarChart3, Package, Users, TrendingUp, DollarSign, ShoppingCart, AlertTriangle, Sparkles, RefreshCw, Download } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/utils';
import { getBackendUrl } from '@/config/api.config';

export function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalSales: 0,
    todaySales: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalUsers: 0,
  });
  const [monthlyReport, setMonthlyReport] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    net: 0,
    avgTicket: 0,
    orders: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyDailyData, setMonthlyDailyData] = useState<any[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<any[]>([]);
  const [bestMonth, setBestMonth] = useState<{ label: string; net: number } | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [mostBoughtItems, setMostBoughtItems] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    checkFirstVisit();
    // Always load settings to get logo
    getSettings().then((settings) => {
      setStoreLogoUrl(settings?.storeLogoUrl);
    });
  }, []);

  const checkFirstVisit = async () => {
    const hasSeenWelcome = localStorage.getItem('hasSeenDashboardWelcome');
    if (!hasSeenWelcome) {
      const settings = await getSettings();
      setStoreName(settings?.storeName || 'Local Stock Keeper');
      setShowWelcome(true);
    }
  };

  const handleCloseWelcome = () => {
    localStorage.setItem('hasSeenDashboardWelcome', 'true');
    setShowWelcome(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const loadDashboardData = async () => {
    const sales = await getAllSales();
    const products = await getAllProducts();
    const users = await getAllUsers();

    // Calculate today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current month start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    // Filter sales for current month
    const currentMonthSales = sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= monthStart;
    });

    // Build daily data for current month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const dayDate = new Date(today.getFullYear(), today.getMonth(), i + 1);
      dayDate.setHours(0, 0, 0, 0);
      const matches = currentMonthSales.filter((sale) => {
        const d = new Date(sale.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === dayDate.getTime();
      });
      const dayRevenue = matches.reduce((sum, sale) => sum + sale.total, 0);
      return {
        day: i + 1,
        revenue: dayRevenue,
        orders: matches.length,
      };
    });

    // Calculate totals
    const totalRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    const monthlySubtotal = currentMonthSales.reduce((sum, sale) => sum + (sale.subtotal || 0), 0);
    const monthlyDiscount = currentMonthSales.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0);
    const monthlyTax = currentMonthSales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);
    const monthlyNet = Math.max(0, monthlySubtotal - monthlyDiscount + monthlyTax);
    const monthlyAvgTicket = currentMonthSales.length > 0 ? monthlyNet / currentMonthSales.length : 0;
    const todaySales = sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const lowStockItems = products.filter((p) => p.isActive !== false && p.stock <= 5).sort((a, b) => a.stock - b.stock);
    const lowStockProducts = lowStockItems.length;

    // Calculate most bought items
    const itemSales = new Map<string, { product: any; quantity: number; revenue: number }>();
    sales.forEach((sale) => {
      sale.items.forEach((item: any) => {
        const existing = itemSales.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            itemSales.set(item.productId, {
              product,
              quantity: item.quantity,
              revenue: item.price * item.quantity
            });
          }
        }
      });
    });
    const topItems = Array.from(itemSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    setMostBoughtItems(topItems);

    setLowStockItems(lowStockItems);
    setStats({
      totalRevenue,
      todayRevenue,
      totalSales: currentMonthSales.length,
      todaySales: todaySales.length,
      totalProducts: products.length,
      lowStockProducts,
      totalUsers: users.length,
    });

    setMonthlyReport({
      subtotal: monthlySubtotal,
      discount: monthlyDiscount,
      tax: monthlyTax,
      net: monthlyNet,
      avgTicket: monthlyAvgTicket,
      orders: currentMonthSales.length,
    });

    // Get recent sales (last 5)
    setRecentSales(sales.slice(-5).reverse());

    // Prepare chart data - last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const revenueByDay = last7Days.map((date) => {
      const dayRevenue = sales
        .filter((sale) => {
          const saleDate = new Date(sale.createdAt);
          saleDate.setHours(0, 0, 0, 0);
          return saleDate.getTime() === date.getTime();
        })
        .reduce((sum, sale) => sum + sale.total, 0);

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
      };
    });

    setChartData(revenueByDay);
    setMonthlyDailyData(dailyData);

    // 12-month history
    const monthBuckets = Array.from({ length: 12 }, (_, idx) => {
      const ref = new Date(today.getFullYear(), today.getMonth() - (11 - idx), 1);
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
      return { ref, start, end };
    });

    const history = monthBuckets.map(({ ref, start, end }) => {
      const matches = sales.filter((sale) => {
        const d = new Date(sale.createdAt);
        return d >= start && d <= end;
      });
      const subtotal = matches.reduce((sum, sale) => sum + (sale.subtotal || 0), 0);
      const discount = matches.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0);
      const tax = matches.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);
      const net = Math.max(0, subtotal - discount + tax);
      const revenue = matches.reduce((sum, sale) => sum + sale.total, 0);
      return {
        label: `${ref.toLocaleString('en-US', { month: 'short' })} ${ref.getFullYear()}`,
        revenue,
        net,
        tax,
        discount,
        orders: matches.length,
      };
    });

    setMonthlyHistory(history);

    // Most profitable month (by net)
    if (history.length) {
      const top = history.reduce((max, m) => (m.net > max.net ? m : max), history[0]);
      setBestMonth(top);
    } else {
      setBestMonth(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {storeLogoUrl && (
            <img src={resolveAssetUrl(storeLogoUrl)} alt="Store logo" className="h-12 w-auto object-contain rounded" />
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">Overview of your store performance</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-12 w-12 rounded-xl"
          title="Refresh dashboard"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.todaySales} sales today</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalSales} sales for the month of {new Date().toLocaleString('en-US', { month: 'long' })}</p>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-destructive">
              {stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : 'All stocked'}
            </p>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[320px] lg:min-w-0">
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `₱${value}`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: any) => [`₱${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
         
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No sales yet</p>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDate(sale.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₱{sale.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{sale.cashierName}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Today's Sales</span>
                </div>
                <span className="font-bold">{stats.todaySales}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Total Sales</span>
                </div>
                <span className="font-bold">{stats.totalSales}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Products</span>
                </div>
                <span className="font-bold">{stats.totalProducts}</span>
              </div>
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Low Stock Alert</span>
                  </div>
                  <span className="font-bold text-destructive">{stats.lowStockProducts}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items Card */}
        {lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {lowStockItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {product.imageUrl && product.imageUrl.trim() && !product.imageUrl.startsWith('data:') && (
                        <img
                          src={product.imageUrl.startsWith('http') ? product.imageUrl : getBackendUrl(product.imageUrl)}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{product.barcode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`text-right ${
                        product.stock === 0 
                          ? 'text-destructive' 
                          : product.stock <= 3 
                          ? 'text-orange-500' 
                          : 'text-yellow-500'
                      }`}>
                        <p className="font-bold text-lg">{product.stock}</p>
                        <p className="text-xs">{product.stock === 0 ? 'Out' : 'Low'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Most Bought Items Card */}
        {mostBoughtItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {mostBoughtItems.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      {item.product.imageUrl && item.product.imageUrl.trim() && !item.product.imageUrl.startsWith('data:') && (
                        <img
                          src={item.product.imageUrl.startsWith('http') ? item.product.imageUrl : getBackendUrl(item.product.imageUrl)}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover rounded flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">₱{item.revenue.toFixed(2)} total</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{item.quantity}</p>
                        <p className="text-xs text-muted-foreground">sold</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Report & Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Monthly Report
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                const monthLabel = new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit' });
                const rows = [
                  ['Metric', 'Value'],
                  ['Subtotal', monthlyReport.subtotal.toFixed(2)],
                  ['Discount', monthlyReport.discount.toFixed(2)],
                  ['Tax', monthlyReport.tax.toFixed(2)],
                  ['Net', monthlyReport.net.toFixed(2)],
                  ['AvgTicket', monthlyReport.avgTicket.toFixed(2)],
                  ['Orders', monthlyReport.orders.toString()],
                ];
                const csv = rows.map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `monthly-report-${monthLabel}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Subtotal</p>
              <p className="text-2xl font-bold">₱{monthlyReport.subtotal.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Discounts</p>
              <p className="text-2xl font-bold text-destructive">-₱{monthlyReport.discount.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Tax</p>
              <p className="text-2xl font-bold">₱{monthlyReport.tax.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Net</p>
              <p className="text-2xl font-bold">₱{monthlyReport.net.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Avg Ticket</p>
              <p className="text-2xl font-bold">₱{monthlyReport.avgTicket.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Orders This Month</p>
              <p className="text-2xl font-bold">{monthlyReport.orders}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Analytics Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Revenue (this month)</div>
              <div className="font-semibold">₱{stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tax Collected (this month)</div>
              <div className="font-semibold">₱{monthlyReport.tax.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Discounts Given (this month)</div>
              <div className="font-semibold text-destructive">-₱{monthlyReport.discount.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Average Ticket (this month)</div>
              <div className="font-semibold">₱{monthlyReport.avgTicket.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Orders (this month)</div>
              <div className="font-semibold">{monthlyReport.orders}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts: Monthly Breakdown & Orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Monthly Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[320px] lg:min-w-0">
              <ChartContainer
                config={{
                  value: { label: 'Amount', color: 'hsl(var(--primary))' },
                }}
                className="h-[280px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Subtotal', value: monthlyReport.subtotal },
                    { name: 'Discounts', value: monthlyReport.discount * -1 },
                    { name: 'Tax', value: monthlyReport.tax },
                    { name: 'Net', value: monthlyReport.net },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₱${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(v: any, n: any) => [`₱${Number(v).toFixed(2)}`, n]} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Orders & Revenue (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[320px] lg:min-w-0">
              <ChartContainer
                config={{
                  revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
                  orders: { label: 'Orders', color: 'hsl(var(--muted-foreground))' },
                }}
                className="h-[280px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyDailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₱${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value: any, name: any) => {
                      if (name === 'orders') return [`${value} orders`, 'Orders'];
                      return [`₱${Number(value).toFixed(2)}`, 'Revenue'];
                    }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 12-Month History */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Revenue & Orders (12 Months)
          </CardTitle>
          {bestMonth && (
            <div className="text-sm text-muted-foreground">
              Most profitable: <span className="font-semibold text-foreground">{bestMonth.label}</span> · ₱{bestMonth.net.toFixed(2)} net
            </div>
          )}
        </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[420px] lg:min-w-0">
              <ChartContainer
                config={{
                  revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
                  orders: { label: 'Orders', color: 'hsl(var(--muted-foreground))' },
                }}
                className="h-[320px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₱${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value: any, name: any) => {
                      if (name === 'orders') return [`${value} orders`, 'Orders'];
                      return [`₱${Number(value).toFixed(2)}`, 'Revenue'];
                    }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
      </Card>

      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Welcome to {storeName}!
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p className="text-base">
                🎉 Your computer parts POS system is now ready to use!
              </p>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm space-y-2">
                <p className="font-semibold text-foreground">Quick Start Guide:</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>📦 <strong>Products:</strong> Add CPUs, GPUs, RAM, peripherals & more</li>
                  <li>🛒 <strong>Checkout:</strong> Process customer sales</li>
                  <li>👥 <strong>Users:</strong> Manage staff accounts</li>
                  <li>📊 <strong>Sales:</strong> View transaction history</li>
                  <li>💾 <strong>Backup:</strong> Export/import your data</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Products auto-archive when out of stock and can be restored anytime.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseWelcome} className="w-full h-12 rounded-xl">
              Get Started
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
