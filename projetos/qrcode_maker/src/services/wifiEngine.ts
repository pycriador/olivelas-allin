/**
 * Motor oficial de geração de Wi-Fi QR Code (Padrão Internacional ZXing / Android / iOS / Wi-Fi Alliance)
 * Compatível com câmeras nativas do iPhone (iOS 11+), Android (Samsung, Xiaomi, Motorola, Pixel, etc.)
 * e leitores universais de QR Code.
 */

export type WifiEncryption = 'WPA2' | 'WPA' | 'WPA3' | 'WEP' | 'nopass';

export interface WifiOptions {
  ssid: string;
  password?: string;
  encryption?: WifiEncryption;
  hidden?: boolean;
}

/**
 * Escapa caracteres especiais (\, ;, ,, :, ") de acordo com o padrão estrito ZXing
 * Substitui barra invertida primeiro para evitar escape duplicado.
 */
export function escapeWifiString(value: string): string {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"');
}

/**
 * Gera a string de conexão Wi-Fi universal padronizada
 * Suporta WPA2 (mais comum em roteadores modernos), WPA, WPA3 (SAE), WEP e Redes Abertas (nopass)
 * Formato padrão: WIFI:T:<tipo>;S:<ssid_escapado>;P:<senha_escapada>;H:<true|false>;;
 */
export function generateWifiString(options: WifiOptions): string {
  const cleanSsid = (options.ssid || '').trim();
  if (!cleanSsid) {
    return '';
  }

  const enc = options.encryption || 'WPA2';
  
  // WPA3 utiliza a tag SAE segundo especificação da Wi-Fi Alliance
  const encTag = enc === 'WPA3' ? 'SAE' : enc;

  let payload = `WIFI:T:${encTag};S:${escapeWifiString(cleanSsid)};`;

  // Campo de senha (P) - Obrigatório apenas se não for rede aberta
  if (enc !== 'nopass') {
    const rawPass = options.password !== undefined ? options.password : '';
    payload += `P:${escapeWifiString(rawPass)};`;
  }

  // Rede Oculta (H)
  if (options.hidden) {
    payload += 'H:true;';
  }

  // Finalizador de registro duplo ponto-e-vírgula obrigatório
  payload += ';';

  return payload;
}
