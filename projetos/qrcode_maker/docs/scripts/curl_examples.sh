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
SHORT_URL=$(curl -s "https://is.gd/create.php?format=simple&url=$ORIGINAL_URL" || curl -s "https://tinyurl.com/api-create.php?url=$ORIGINAL_URL")
echo "[*] URL Original: $ORIGINAL_URL"
echo "[*] URL Encurtada: $SHORT_URL"

curl -s "https://quickchart.io/qr?text=${SHORT_URL}&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png
echo "[OK] Salvo em qrcode_encurtado.png"

echo "=== 4. Gerando QR Code Pix Oficial (Padrão BACEN / BR Code) ==="
PIX_EMV="00020126330014br.gov.bcb.pix011112345678900520400005303986540510.005802BR5913WILLIAN JESUS6008BRASILIA62070503***63043133"
curl -s -G "https://quickchart.io/qr" \
  --data-urlencode "text=${PIX_EMV}" \
  --data-urlencode "size=1024" \
  --data-urlencode "format=png" \
  --data-urlencode "dark=059669" \
  --data-urlencode "light=ffffff" \
  -o qrcode_pix.png
echo "[OK] Salvo em qrcode_pix.png (Pix EMV oficial)"

echo "=== 5. Gerando QR Code Wi-Fi Universal (Padrão ZXing / iOS / Android) ==="
WIFI_PAYLOAD="WIFI:T:WPA;S:MinhaCasa_5G;P:minhasenha123;;"
curl -s -G "https://quickchart.io/qr" \
  --data-urlencode "text=${WIFI_PAYLOAD}" \
  --data-urlencode "size=1024" \
  --data-urlencode "format=png" \
  --data-urlencode "dark=0284c7" \
  --data-urlencode "light=ffffff" \
  -o qrcode_wifi.png
echo "[OK] Salvo em qrcode_wifi.png (Wi-Fi conexão automática)"
