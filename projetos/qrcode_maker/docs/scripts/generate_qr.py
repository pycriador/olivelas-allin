#!/usr/bin/env python3
"""
Olivelas QR Code Studio - CLI Generator
Gera códigos QR Code em alta definição diretamente da linha de comando,
com suporte a URLs, encurtamento automático, personalização de cores,
geração de Pix Oficial (Padrão BACEN / BR Code / EMV QRCPS-MPM)
e Wi-Fi Automático (Padrão Universal ZXing / iOS / Android).

Funciona nativamente com a biblioteca padrão do Python (urllib),
e aproveita 'qrcode' e 'PIL' se estiverem instalados.
"""

import sys
import argparse
import unicodedata
import urllib.parse
import urllib.request

try:
    import qrcode
    from PIL import Image
except ImportError:
    qrcode = None

def crc16_ccitt(data: str) -> str:
    """Calcula o checksum CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)."""
    crc = 0xFFFF
    for ch in data:
        crc ^= (ord(ch) << 8)
        for _ in range(8):
            if (crc & 0x8000) != 0:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return f"{crc:04X}"

def emv_field(field_id: str, value: str) -> str:
    """Formata campo no padrão TLV (Tag-Length-Value) do EMV."""
    return f"{field_id}{len(value):02d}{value}"

def sanitize_pix_text(text: str, max_len: int) -> str:
    """Remove acentos e caracteres não-alfanuméricos para conformidade bancária."""
    nfd = unicodedata.normalize("NFD", text or "")
    clean = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    clean = "".join(c for c in clean if c.isalnum() or c == " ").strip().upper()
    return clean[:max_len]

def build_pix_brcode(key: str, name: str = "RECEBEDOR", city: str = "BRASILIA", amount: str = None, txid: str = "***") -> str:
    """Gera o payload oficial do Pix Copia e Cola / BR Code (EMV QRCPS-MPM)."""
    clean_key = key.strip()
    s_name = sanitize_pix_text(name or "RECEBEDOR", 25) or "RECEBEDOR"
    s_city = sanitize_pix_text(city or "BRASILIA", 15) or "BRASILIA"
    s_txid = "".join(c for c in (txid or "***") if c.isalnum())[:25] or "***"

    merchant_info = emv_field("00", "br.gov.bcb.pix") + emv_field("01", clean_key)
    payload = (
        emv_field("00", "01") +
        emv_field("26", merchant_info) +
        emv_field("52", "0000") +
        emv_field("53", "986")
    )
    if amount:
        try:
            val = float(str(amount).replace(",", "."))
            if val > 0:
                payload += emv_field("54", f"{val:.2f}")
        except ValueError:
            pass

    payload += (
        emv_field("58", "BR") +
        emv_field("59", s_name) +
        emv_field("60", s_city) +
        emv_field("62", emv_field("05", s_txid)) +
        "6304"
    )
    return payload + crc16_ccitt(payload)

def escape_wifi(text: str) -> str:
    """Escapa caracteres especiais no padrão ZXing: \\, ;, ,, :, \"."""
    if not text:
        return ""
    for ch in ["\\", ";", ",", ":", '"']:
        text = text.replace(ch, f"\\{ch}")
    return text

def build_wifi_payload(ssid: str, password: str = "", encryption: str = "WPA2", hidden: bool = False) -> str:
    """Gera a string padronizada ZXing para conexão automática de Wi-Fi."""
    esc_ssid = escape_wifi(ssid.strip())
    enc = encryption or "WPA2"
    enc_tag = "SAE" if enc == "WPA3" else enc
    payload = f"WIFI:T:{enc_tag};S:{esc_ssid};"
    if enc != "nopass":
        payload += f"P:{escape_wifi(password.strip())};"
    if hidden:
        payload += "H:true;"
    return payload + ";"

def shorten_url(url: str, provider: str = "tinyurl") -> str:
    """Encurta a URL informada usando o provedor solicitado."""
    print(f"[*] Encurtando URL via {provider}...")
    safe_target = urllib.parse.quote(url)
    api_map = {
        "tinyurl": f"https://tinyurl.com/api-create.php?url={safe_target}",
        "isgd": f"https://is.gd/create.php?format=simple&url={safe_target}",
        "dagd": f"https://da.gd/s?url={safe_target}",
        "ulvis": f"https://ulvis.net/api.php?url={safe_target}",
        "clckru": f"https://clck.ru/--?url={safe_target}"
    }

    endpoint = api_map.get(provider, api_map["tinyurl"])
    try:
        req = urllib.request.Request(endpoint, headers={"User-Agent": "OlivelasQRCode/2.0"})
        with urllib.request.urlopen(req, timeout=6) as response:
            result = response.read().decode("utf-8").strip()
            if result.startswith("http"):
                return result
    except Exception as e:
        print(f"[!] Erro ao encurtar ({e}). Usando URL original.")
    return url

def generate_qr(data: str, output: str, fill_color: str, back_color: str, size: int):
    """Gera o QR Code com biblioteca nativa ou fallback via API de alta definição."""
    if qrcode is not None:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=max(10, size // 40),
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color=fill_color, back_color=back_color)
        img.save(output)
        print(f"[OK] QR Code gerado localmente com sucesso em: {output}")
    else:
        # Fallback via QuickChart / API de alta definição (funciona com Python puro sem pip)
        print("[*] Pacote 'qrcode' não detectado localmente. Baixando via API de alta definição...")
        clean_color = fill_color.replace("#", "")
        clean_bg = back_color.replace("#", "")
        safe_data = urllib.parse.quote(data)
        fmt = "svg" if output.lower().endswith(".svg") else "png"
        
        endpoint = f"https://quickchart.io/qr?text={safe_data}&size={size}&format={fmt}&dark={clean_color}&light={clean_bg}"
        
        req = urllib.request.Request(endpoint, headers={"User-Agent": "OlivelasQRCode/2.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read()
            with open(output, "wb") as f:
                f.write(content)
            print(f"[OK] QR Code em alta definição ({size}x{size}) salvo em: {output}")

def main():
    parser = argparse.ArgumentParser(description="Olivelas QR Code Studio - Gerador de Terminal")
    parser.add_argument("--url", "-u", help="URL ou texto genérico a ser codificado")
    parser.add_argument("--output", "-o", default="qrcode.png", help="Nome do arquivo de saída (padrão: qrcode.png)")
    parser.add_argument("--color", "-c", default="#4f46e5", help="Cor principal (hex, padrão: #4f46e5)")
    parser.add_argument("--bg", "-b", default="#ffffff", help="Cor de fundo (hex, padrão: #ffffff)")
    parser.add_argument("--size", "-s", type=int, default=1024, help="Resolução em pixels (padrão: 1024)")
    parser.add_argument("--shorten", choices=["tinyurl", "isgd", "dagd", "ulvis", "clckru"], help="Encurtar URL antes de gerar")

    # Parâmetros de Pix Oficial BACEN
    parser.add_argument("--pix-key", help="Chave Pix (E-mail, CPF, CNPJ, Celular +55 ou EVP)")
    parser.add_argument("--pix-name", default="RECEBEDOR", help="Nome do beneficiário do Pix")
    parser.add_argument("--pix-city", default="BRASILIA", help="Cidade do beneficiário do Pix")
    parser.add_argument("--pix-amount", help="Valor em R$ (ex: 25.00)")
    parser.add_argument("--pix-txid", default="***", help="Identificador / TxID da transação (padrão: ***)")

    # Parâmetros de Wi-Fi Universal ZXing
    parser.add_argument("--wifi-ssid", help="Nome da rede Wi-Fi (SSID)")
    parser.add_argument("--wifi-pass", default="", help="Senha da rede Wi-Fi")
    parser.add_argument("--wifi-enc", default="WPA2", choices=["WPA2", "WPA", "WPA3", "WEP", "nopass"], help="Criptografia (padrão: WPA2)")
    parser.add_argument("--wifi-hidden", action="store_true", help="Definir rede como oculta")

    args = parser.parse_args()

    if args.pix_key:
        target_data = build_pix_brcode(
            key=args.pix_key,
            name=args.pix_name,
            city=args.pix_city,
            amount=args.pix_amount,
            txid=args.pix_txid
        )
        print(f"[Pix] Código EMV BR Code gerado:")
        print(f"      {target_data}")
    elif args.wifi_ssid:
        target_data = build_wifi_payload(
            ssid=args.wifi_ssid,
            password=args.wifi_pass,
            encryption=args.wifi_enc,
            hidden=args.wifi_hidden
        )
        print(f"[Wi-Fi] String ZXing gerada:")
        print(f"        {target_data}")
    elif args.url:
        target_data = args.url
        if args.shorten:
            target_data = shorten_url(target_data, args.shorten)
            print(f"[+] URL encurtada: {target_data}")
    else:
        print("[!] Erro: Você deve informar uma --url, uma --pix-key ou um --wifi-ssid.")
        print("    Exemplo Wi-Fi: python scripts/generate_qr.py --wifi-ssid 'MinhaCasa_5G' --wifi-pass 'minhasenha123' -o wifi.png")
        print("    Exemplo Pix:   python scripts/generate_qr.py --pix-key 'meuemail@pix.com' --pix-amount 10.00 -o pix.png")
        print("    Exemplo URL:   python scripts/generate_qr.py --url 'https://meusite.com' -o site.png")
        sys.exit(1)

    generate_qr(target_data, args.output, args.color, args.bg, args.size)

if __name__ == "__main__":
    main()
