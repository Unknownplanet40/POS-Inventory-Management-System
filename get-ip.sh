#!/bin/bash

echo "========================================"
echo "POS System - Network Information"
echo "========================================"
echo ""

echo "Finding your local IP address..."
echo ""

# Try to get the local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
else
    # Linux
    IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$IP" ]; then
    echo "Could not automatically detect IP address."
    echo "Run 'ifconfig' or 'ip addr' to find it manually."
else
    echo "Your IP Address: $IP"
fi

echo ""
echo "========================================"
echo "Access your POS system from other devices:"
echo ""
echo "1. Start the backend: cd server && npm run start:dev"
echo "2. Start the frontend: npm run dev"
echo "3. Open on other device: http://$IP:8080"
echo "========================================"
echo ""
