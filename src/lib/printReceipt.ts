import { Sale } from "@/lib/db";

export function printReceiptHTML(
  sale: Sale,
  options?: { paper?: "58mm" | "80mm"; logoUrl?: string | undefined; storeName?: string; storeEmail?: string | undefined; storePhone?: string | undefined; storeAddress?: string | undefined }
) {
  const width = options?.paper === "80mm" ? 380 : 300;

  const itemsHTML = sale.items
    .map(
      (item) => `
      <div class="item-row">
        <div>
          <div class="name">${item.productName}</div>
          <div class="item-sub">${item.quantity} × ₱${item.unitPrice.toFixed(2)}</div>
        </div>
        <div class="price">₱${item.total.toFixed(2)}</div>
      </div>
    `
    )
    .join("");

  return `
<html>
<head>
  <title>Receipt</title>
  <style>
    body {
      font-family: "Courier New", monospace;
      font-size: 13px;
      width: ${width}px;
      margin: 0 auto;
      padding: 16px;
      color: #000;
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    h2 {
      margin: 0;
      font-size: 16px;
    }

    p {
      margin: 2px 0;
      font-size: 12px;
    }

    .logo {
      height: 50px;
      width: auto;
      max-width: 100px;
      object-fit: contain;
      margin-top: 20px;
      border-radius: 4px;
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
    }

    .name {
      font-weight: bold;
    }

    .item-sub {
      font-size: 12px;
      margin-left: 8px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .discount {
      color: #c00;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: bold;
      margin-top: 8px;
    }

    .footer {
      text-align: center;
      margin-top: 16px;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h3>${options?.storeName ?? "Store Name"}</h3>
      <h2>Receipt</h2>
      <p>${new Date(sale.createdAt).toLocaleString()}</p>
      <p>Cashier: ${sale.cashierName}</p>
    </div>
    ${options?.logoUrl ? `<img src="${options.logoUrl}" class="logo" alt="Store Logo" />` : ""}
  </div>

  <div class="divider"></div>

  ${itemsHTML}

  <div class="divider"></div>

  <div class="summary-row">
    <span>Subtotal:</span>
    <span>₱${sale.subtotal.toFixed(2)}</span>
  </div>

  ${
    sale.discountAmount > 0
      ? `<div class="summary-row discount">
          <span>Discount:</span>
          <span>-₱${sale.discountAmount.toFixed(2)}</span>
        </div>`
      : ""
  }

  ${
    sale.taxAmount > 0
      ? `<div class="summary-row">
          <span>Tax:</span>
          <span>₱${sale.taxAmount.toFixed(2)}</span>
        </div>`
      : ""
  }

  <div class="divider"></div>

  <div class="total-row">
    <span>TOTAL:</span>
    <span>₱${sale.total.toFixed(2)}</span>
  </div>

  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>Receipt ID: ${sale.id.slice(0, 8)}</p>
  </div>

    <div class="footer" style="margin-top: 8px;">
    <p>Email: ${options?.storeEmail ?? ""}</p>
    <p>${options?.storeAddress ?? ""}</p>
  </div>

</body>
</html>
`;
}
