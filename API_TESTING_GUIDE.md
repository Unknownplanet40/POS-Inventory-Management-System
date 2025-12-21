# Testing Your API - Step by Step

## 📱 Option 1: Using Postman (Recommended)

### Setup

1. **Open Postman**
2. **Import Collection**
   - Click "Import" button
   - Select: `server/POS_System_API.postman_collection.json`
   - Click "Import"

3. **Create Environment**
   - Click "Environments" → "Create"
   - Name it: "POS Development"
   - Add variables:
     ```
     baseUrl: http://localhost:3000
     token: (leave empty)
     ```
   - Save

4. **Select Environment**
   - Top right, select "POS Development" environment

### Test Authentication

1. **Register User**
   ```
   Collection → Auth → Register
   ```
   - Body:
     ```json
     {
       "username": "admin",
       "password": "admin123",
       "role": "admin"
     }
     ```
   - Click "Send"
   - ✅ Should return: User created

2. **Login**
   ```
   Collection → Auth → Login
   ```
   - Body:
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - Click "Send"
   - ✅ Should return: Token (auto-saved to `{{token}}`)

### Test Products

3. **Create Product**
   ```
   Collection → Products → Create Product
   ```
   - Body:
     ```json
     {
       "name": "Laptop",
       "barcode": "123456789",
       "price": 999.99,
       "stock": 10
     }
     ```
   - Click "Send"
   - ✅ Should return: Product created with ID

4. **Get All Products**
   ```
   Collection → Products → Get All Products
   ```
   - Click "Send"
   - ✅ Should return: List of all products

5. **Get by Barcode**
   ```
   Collection → Products → Get Product by Barcode
   ```
   - Click "Send"
   - ✅ Should return: The product you created

### Test Sales

6. **Create Sale**
   ```
   Collection → Sales → Create Sale
   ```
   - Body (use the product ID from step 3):
     ```json
     {
       "items": [
         {
           "productId": "UUID_FROM_STEP_3",
           "productName": "Laptop",
           "quantity": 2,
           "unitPrice": 999.99,
           "total": 1999.98
         }
       ],
       "subtotal": 1999.98,
       "discountType": "percentage",
       "discountValue": 10,
       "discountAmount": 199.998,
       "total": 1799.982,
       "cashierId": "admin-id-here",
       "cashierName": "Admin"
     }
     ```
   - Click "Send"
   - ✅ Should return: Sale created

### Test Settings & Store Configuration

7. **Get Store Settings**
   ```
   Collection → Settings → Get Settings
   ```
   - Click "Send"
   - ✅ Should return: Current store settings including logo URL

8. **Update Store Settings**
   ```
   Collection → Settings → Update Settings
   ```
   - Body:
     ```json
     {
       "storeName": "My Computer Shop",
       "storeEmail": "info@myshop.com",
       "storePhone": "+1-555-0123",
       "storeAddress": "123 Tech Street, Tech City",
       "storeLogoUrl": "/product-image/store-logo-abc123.png",
       "taxRate": 12
     }
     ```
   - Click "Send"
   - ✅ Should return: Updated settings

9. **Upload Store Logo**
   ```
   Collection → Settings → Upload Logo
   ```
   - Form Data:
     - Key: `file`
     - Value: Select your logo image file
   - Click "Send"
   - ✅ Should return: Logo URL (e.g., `/product-image/store-logo-abc123.png`)

---

## 🖨️ Receipt Printing Workflow

The receipt printing uses the store settings endpoint to retrieve logo and store information:

### Backend Flow:
1. **Frontend** requests settings via `/api/settings` → Returns `storeLogoUrl`
2. **Frontend** converts image to base64 using `imageToBase64()` utility
3. **Frontend** generates receipt HTML with embedded logo
4. **Print preview** displays with 500ms render delay
5. **User** clicks print in browser

### Testing Receipt Logo:

1. **Upload a logo** (Step 9 above)
2. Open frontend at `http://localhost:5173`
3. Login and complete a sale
4. Click "Print Receipt"
5. ✅ Logo should appear in print preview

### Common Issues:

| Issue | API Endpoint to Check |
|-------|----------------------|
| Logo not showing | `GET /api/settings` → verify `storeLogoUrl` value |
| Wrong logo | `PUT /api/settings` → update `storeLogoUrl` |
| Missing store info | `GET /api/settings` → verify all fields populated |

---

### 401 Unauthorized
**Problem**: Your token is expired or missing
**Solution**: 
1. Login again
2. Copy the new token
3. Add to request header: `Authorization: Bearer <new_token>`

### 400 Bad Request
**Problem**: Request body is invalid
**Solution**:
1. Check JSON syntax
2. Verify all required fields are present
3. Ensure data types match (numbers not strings, etc)

### 500 Internal Server Error
**Problem**: Server error
**Solution**:
1. Check backend terminal for error logs
2. Ensure database is accessible
3. Restart backend: `npm run start:dev`

### Cannot POST /api/products
**Problem**: Backend not running
**Solution**:
1. Open terminal
2. Run: `cd server && npm run start:dev`
3. Wait for "Application is running on: http://localhost:3000"

---
