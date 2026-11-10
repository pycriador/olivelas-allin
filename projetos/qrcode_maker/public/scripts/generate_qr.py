#!/usr/bin/env python3
"""
Olivelas QR Code Studio - CLI Generator
Gera códigos QR Code em alta definição diretamente da linha de comando,
com suporte a encurtamento automático de URL e personalização de cores.

Funciona nativamente com a biblioteca padrão do Python (urllib),
e aproveita 'qrcode' e 'PIL' se estiverem instalados.
"""

import sys
import argparse
import urllib.parse
import urllib.request

try:
    import qrcode
    from PIL import Image
except ImportError:
    qrcode = None

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

def generate_qr(url: str, output: str, fill_color: str, back_color: str, size: int):
    """Gera o QR Code com biblioteca nativa ou fallback via API de alta definição."""
    if qrcode is not None:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=max(10, size // 40),
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color=fill_color, back_color=back_color)
        img.save(output)
        print(f"[OK] QR Code gerado localmente com sucesso em: {output}")
    else:
        # Fallback via QuickChart / API de alta definição (funciona com Python puro sem pip)
        print("[*] Pacote 'qrcode' não detectado localmente. Baixando via API de alta definição...")
        clean_color = fill_color.replace("#", "")
        clean_bg = back_color.replace("#", "")
        safe_url = urllib.parse.quote(url)
        fmt = "svg" if output.lower().endswith(".svg") else "png"
        
        endpoint = f"https://quickchart.io/qr?text={safe_url}&size={size}&format={fmt}&dark={clean_color}&light={clean_bg}"
        
        req = urllib.request.Request(endpoint, headers={"User-Agent": "OlivelasQRCode/2.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            with open(output, "wb") as f:
                f.write(data)
            print(f"[OK] QR Code em alta definição ({size}x{size}) salvo em: {output}")

def main():
    parser = argparse.ArgumentParser(description="Olivelas QR Code Studio - Gerador de Terminal")
    parser.add_argument("--url", "-u", required=True, help="URL ou texto a ser codificado")
    parser.add_argument("--output", "-o", default="qrcode.png", help="Nome do arquivo de saída (padrão: qrcode.png)")
    parser.add_argument("--color", "-c", default="#4f46e5", help="Cor principal (hex, padrão: #4f46e5)")
    parser.add_argument("--bg", "-b", default="#ffffff", help="Cor de fundo (hex, padrão: #ffffff)")
    parser.add_argument("--size", "-s", type=int, default=1024, help="Resolução em pixels (padrão: 1024)")
    parser.add_argument("--shorten", choices=["tinyurl", "isgd", "dagd", "ulvis", "clckru"], help="Encurtar URL antes de gerar")

    args = parser.parse_args()

    target_url = args.url
    if args.shorten:
        target_url = shorten_url(target_url, args.shorten)
        print(f"[+] URL encurtada: {target_url}")

    generate_qr(target_url, args.output, args.color, args.bg, args.size)

if __name__ == "__main__":
    main()
