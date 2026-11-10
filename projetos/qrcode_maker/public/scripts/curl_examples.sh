#!/usr/bin/env bash
# ==============================================================================
# Olivelas QR Code Studio - Exemplos de Download via cURL (100% Verificados)
# ==============================================================================
set -e

echo "=== 1. Gerando QR Code PNG em Alta Resolução (1024x1024) ==="
curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_1024.png
echo "[OK] Salvo em qrcode_1024.png (1024x1024 px)"

echo "=== 2. Gerando QR Code SVG Vetorial com Cores Customizadas ==="
# Cor #4f46e5 (Índigo) sobre fundo branco
curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=svg&dark=4f46e5&light=ffffff" -o qrcode_vector.svg
echo "[OK] Salvo em qrcode_vector.svg (Vetor puro)"

echo "=== 3. Pipeline: Encurtar URL e Gerar QR Code Automático ==="
ORIGINAL_URL="https://github.com/pycriador/olivelas-qrcode"
SHORT_URL=$(curl -s "https://tinyurl.com/api-create.php?url=$ORIGINAL_URL")
echo "[*] URL Original: $ORIGINAL_URL"
echo "[*] URL Encurtada: $SHORT_URL"

curl -s "https://quickchart.io/qr?text=${SHORT_URL}&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png
echo "[OK] Salvo em qrcode_encurtado.png"

echo "=== 4. Exemplo com QRServer API ==="
curl -s "https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=4f46e5&bgcolor=ffffff&data=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode" -o qrcode_server.png
echo "[OK] Salvo em qrcode_server.png"
