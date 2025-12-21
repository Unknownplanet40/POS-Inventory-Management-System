import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sale, getSettings } from "@/lib/db";
import { Printer } from "lucide-react";
import { resolveAssetUrl, imageToBase64 } from "@/lib/utils";
import { printReceiptHTML } from "@/lib/printReceipt";

interface ReceiptDialogProps {
  sale: Sale;
  onClose: () => void;
}

export function ReceiptDialog({ sale, onClose }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [storeName, setStoreName] = useState("Store");
  const [taxRate, setTaxRate] = useState(0);
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | undefined>(undefined);
  const [storeEmail, setStoreEmail] = useState<string | undefined>(undefined);
  const [storePhone, setStorePhone] = useState<string | undefined>(undefined);
  const [storeAddress, setStoreAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.storeName) setStoreName(settings.storeName);
      if (settings?.taxRate) setTaxRate(settings.taxRate);
      setStoreLogoUrl(settings?.storeLogoUrl);
      setStoreEmail(settings?.storeEmail);
      setStorePhone(settings?.storePhone);
      setStoreAddress(settings?.storeAddress);
    });
  }, []);

  const handlePrint = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Show loading state while converting image
    printWindow.document.write(`
      <html>
        <head><title>Loading Receipt...</title></head>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial;">
          <p>Loading receipt...</p>
        </body>
      </html>
    `);

    // Convert logo URL to base64 BEFORE opening the print window
    const resolvedUrl = storeLogoUrl ? resolveAssetUrl(storeLogoUrl) : undefined;
    const logoBase64 = resolvedUrl ? await imageToBase64(resolvedUrl) : undefined;

    // Write the actual receipt
    printWindow.document.open();
    printWindow.document.write(
      printReceiptHTML(sale, {
        paper: "58mm", // change to "80mm" if needed
        logoUrl: logoBase64 || resolvedUrl,
        storeName: storeName,
        storePhone: storePhone,
        storeEmail: storeEmail,
        storeAddress: storeAddress,
      })
    );

    printWindow.document.close();
    printWindow.focus();
    
    // Delay print to ensure content is rendered
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="font-mono text-sm p-4 bg-card border border-border">
          <div className="header flex items-start justify-between gap-3">
            <div className="store-info flex-1">
              <h2 className="text-lg font-bold">{storeName}</h2>
              <p className="text-muted-foreground">{formatDate(sale.createdAt)}</p>
              <p className="text-muted-foreground">Cashier: {sale.cashierName}</p>
              {storePhone && (
                <div className="mt-1 text-muted-foreground">
                  <p>Phone: {storePhone}</p>
                </div>
              )}
            </div>
            {storeLogoUrl && <img src={resolveAssetUrl(storeLogoUrl)} alt="Store logo" className="logo h-12 w-auto object-contain rounded" />}
          </div>

          <div className="border-t border-dashed border-border my-3" />

          {sale.items.map((item, index) => (
            <div key={index} className="flex justify-between my-2">
              <div className="flex-1">
                <p>{item.productName}</p>
                <p className="text-muted-foreground">
                  {item.quantity} × ₱{item.unitPrice.toFixed(2)}
                </p>
              </div>
              <p className="font-medium">₱{item.total.toFixed(2)}</p>
            </div>
          ))}

          <div className="border-t border-dashed border-border my-3" />

          <div className="flex justify-between my-1">
            <span>Subtotal:</span>
            <span>₱{sale.subtotal.toFixed(2)}</span>
          </div>

          {sale.discountAmount > 0 && (
            <div className="flex justify-between my-1 text-destructive">
              <span>Discount ({sale.discountType === "percentage" ? `${sale.discountValue}%` : "Fixed"}):</span>
              <span>-₱{sale.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {sale.taxRate > 0 && (
            <div className="flex justify-between my-1">
              <span>Tax ({sale.taxRate}%):</span>
              <span>₱{sale.taxAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-dashed border-border my-3" />

          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL:</span>
            <span>₱{sale.total.toFixed(2)}</span>
          </div>

          <div className="text-center mt-6 text-muted-foreground">
            <p>Thank you for your purchase!</p>
            <p>Receipt ID: {sale.id.slice(0, 8)}</p>
            {(storeEmail || storeAddress) && (
              <div className="mt-2 space-y-1">
                {storeEmail && <p>Email: {storeEmail}</p>}
                {storeAddress && <p className="whitespace-pre-line">{storeAddress}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-md border border-border">
          <p className="text-xs font-semibold text-foreground mb-2">Print Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ensure your printer supports thermal receipts (58mm or 80mm)</li>
            <li>• Adjust browser print settings to match paper size</li>
            <li>• Disable headers/footers in print settings</li>
            <li>• Preview may differ slightly from printed output</li>
          </ul>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1 h-12" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1 h-12" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
