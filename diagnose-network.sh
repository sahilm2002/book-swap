#!/bin/bash

echo "=== Network Diagnostics for localhost Issues ==="
echo ""

echo "1. Testing basic connectivity:"
ping -c 2 127.0.0.1

echo ""
echo "2. Checking if any process is listening on common ports:"
lsof -i :3000 2>/dev/null && echo "Port 3000 is in use" || echo "Port 3000 is free"
lsof -i :8080 2>/dev/null && echo "Port 8080 is in use" || echo "Port 8080 is free"

echo ""
echo "3. Testing with curl:"
echo "Testing localhost:8080..."
curl -I -m 5 http://localhost:8080 2>&1 | head -3

echo ""
echo "4. Checking hosts file:"
grep localhost /etc/hosts

echo ""
echo "5. Checking for proxy settings:"
echo "HTTP_PROXY: ${HTTP_PROXY:-not set}"
echo "HTTPS_PROXY: ${HTTPS_PROXY:-not set}"
echo "http_proxy: ${http_proxy:-not set}"
echo "https_proxy: ${https_proxy:-not set}"

echo ""
echo "6. Checking running VPN/proxy processes:"
ps aux | grep -i vpn | grep -v grep || echo "No VPN processes found"
ps aux | grep -i proxy | grep -v grep || echo "No proxy processes found"

echo ""
echo "7. Network interface info:"
ifconfig en0 | grep inet || echo "No en0 interface"

echo ""
echo "=== End Diagnostics ==="