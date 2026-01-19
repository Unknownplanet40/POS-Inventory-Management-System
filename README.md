# Quick Reference - POS System for Computer Parts & Accessories

First and foremost, If you haven't already, please follow the full setup instructions in [SETUP_GUIDE.md](SETUP_GUIDE.md) to get the application running.

### Terminal 1 - Backend
```bash
cd server
npm run start:dev
# Backend ready at http://localhost:3000 (accessible on network)
```

### Terminal 2 - Frontend
```bash
npm run dev
# Frontend ready at http://localhost:8080 (accessible on network)
```

**That's it!** Open `http://localhost:8080` and follow the setup wizard.

---

## 📱 Access from Other Devices (Phone, Tablet, etc.)

Want to use the POS system on your phone or another computer on the same network?

### Quick Method:
1. Run `get-ip.bat` (Windows) or `./get-ip.sh` (Mac/Linux) to find your IP
2. Start both backend and frontend servers
3. On your other device, open: `http://[YOUR-IP]:8080`

### Detailed Instructions:
See [NETWORK_ACCESS_GUIDE.md](NETWORK_ACCESS_GUIDE.md) for complete setup instructions.

---

## 📱 First Login

1. Fill in store name in setup wizard (e.g., "PC Parts & Accessories")
2. Create admin account with any username/password
3. Login with those credentials
4. You're in!

---

## 🖥️ Product Management

This POS system is optimized for computer parts and accessories inventory:
- CPUs, GPUs, RAM, Storage drives
- Motherboards, Power supplies, Cases
- Peripherals (Keyboards, Mice, Monitors)
- Cables, Adapters, Accessories
- Archive products when out of stock
- Restore or permanently delete archived items

---

## 🧪 Test API with Postman

1. Open Postman
2. Import: `server/POS_System_API.postman_collection.json`
3. Click "Login" request → Send
4. Token auto-saves! ✅
5. Test other endpoints with auto-authentication

---

## 🔑 Default Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | List products |
| POST | `/api/products` | Add product |
| POST | `/api/sales` | Record sale |
| GET | `/api/users` | List users |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

## 💾 Database Location

```
server/pos-database.sqlite
```

Auto-created on first backend start. Delete to reset.

---

## 📚 Documentation

- **Full Setup**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API Reference**: See [API_REFERENCE.md](API_REFERENCE.md)
- **API Testing**: See [API_TESTING.md](API_TESTING.md)

---

testing data 

## 🛠️ Testing Data
You want some testing data to play with? Use the following Json data to populate your database with sample products, users, and sales records. This will help you explore the features of the POS system without having to manually enter data.

Admin Account:

- **Username**: RyanJames
- **Password**: caps@123

Cashier Account:

- **Username**: Riley
- **Password**: @riley2025

Just import the following JSON data into the system using Import feature

- JSON Data: [testing-data.json](pos-backup-2025-12-21.json)

Please Note that You may need to finish the initial setup wizard before importing data.


---

## Credits
Developed by [Unknownplanet40](https://github.com/Unknownplanet40)
- Licensed under [MIT License](LICENSE)