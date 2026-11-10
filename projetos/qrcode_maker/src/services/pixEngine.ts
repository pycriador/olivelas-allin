/**
 * Motor oficial de geração de payload Pix (Padrão BACEN / BR Code / EMV QRCPS-MPM)
 * Compatível com 100% dos aplicativos bancários brasileiros (Nubank, Itaú, Bradesco,
 * Santander, Inter, Mercado Pago, PicPay, Caixa, Banco do Brasil, etc.)
 */

export interface PixOptions {
  key: string;
  keyType?: 'auto' | 'cpf' | 'cnpj' | 'phone' | 'email' | 'evp';
  name?: string;
  city?: string;
  amount?: string | number | null;
  txid?: string;
  description?: string;
}

/**
 * Cálculo do CRC16-CCITT (Polinômio 0x1021, Valor inicial 0xFFFF, padrão ISO/IEC 13239)
 * Requisito estrito do Banco Central do Brasil para validação do payload Pix.
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata campo no padrão TLV (Tag-Length-Value) do EMV®
 */
function formatEMV(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Remove acentos, caracteres especiais e limita o tamanho da string
 * Exigido para compatibilidade bancária estrita.
 */
function sanitizeText(text: string, maxLength: number): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .substring(0, maxLength);
}

/**
 * Normaliza e sanitiza a chave Pix de acordo com as regras do BACEN
 */
export function normalizePixKey(rawKey: string, keyType: PixOptions['keyType'] = 'auto'): string {
  let key = (rawKey || '').trim();
  if (!key) return '';

  if (keyType === 'email' || (keyType === 'auto' && key.includes('@'))) {
    return key.toLowerCase().trim();
  }

  if (keyType === 'cpf') {
    return key.replace(/\D/g, '').substring(0, 11);
  }

  if (keyType === 'cnpj') {
    return key.replace(/\D/g, '').substring(0, 14);
  }

  if (keyType === 'phone') {
    let digits = key.replace(/\D/g, '');
    if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
      digits = '55' + digits;
    }
    return '+' + digits;
  }

  if (keyType === 'evp') {
    return key.toLowerCase().trim();
  }

  // Detecção Automática Inteligente
  if (key.startsWith('+')) {
    return '+' + key.replace(/\D/g, '');
  }

  const digits = key.replace(/\D/g, '');

  // CNPJ formatado ou 14 dígitos
  if (digits.length === 14) {
    return digits;
  }

  // Telefone celular com DDD (11 dígitos, inicia com DDD comum e 9) ou telefone fixo (10 dígitos)
  if (key.includes('(') || key.includes('-') && digits.length >= 10 && digits.length <= 11 && !key.includes('.')) {
    let phoneDigits = digits;
    if (!phoneDigits.startsWith('55')) {
      phoneDigits = '55' + phoneDigits;
    }
    return '+' + phoneDigits;
  }

  // CPF formatado (ex: 000.000.000-00)
  if (key.includes('.') && digits.length === 11) {
    return digits;
  }

  // 11 dígitos puros (pode ser CPF)
  if (digits.length === 11 && key === digits) {
    return digits;
  }

  // Chave Aleatória (EVP / UUID) ou E-mail
  return key;
}

/**
 * Gera o payload oficial do Pix Copia e Cola / BR Code (EMV QRCPS-MPM)
 * Retorna uma string que pode ser codificada em QR Code ou copiada pelo usuário.
 */
export function generatePixBRCode(options: PixOptions): string {
  const normalizedKey = normalizePixKey(options.key, options.keyType);
  if (!normalizedKey) {
    return '';
  }

  const merchantName = sanitizeText(options.name || 'RECEBEDOR', 25) || 'RECEBEDOR';
  const merchantCity = sanitizeText(options.city || 'BRASILIA', 15) || 'BRASILIA';
  const txid = (options.txid || '***').replace(/[^A-Za-z0-9]/g, '').substring(0, 25) || '***';

  // 1. Campo 26: Merchant Account Information
  // 00: GUI (br.gov.bcb.pix)
  // 01: Chave Pix
  // 02: Descrição adicional (opcional)
  let merchantInfo = formatEMV('00', 'br.gov.bcb.pix') + formatEMV('01', normalizedKey);
  if (options.description) {
    const desc = sanitizeText(options.description, 25);
    if (desc) {
      merchantInfo += formatEMV('02', desc);
    }
  }

  // 2. Montagem dos campos padrão
  let payload = 
    formatEMV('00', '01') +                       // 00: Payload Format Indicator (01)
    formatEMV('26', merchantInfo) +               // 26: Informações da conta Pix
    formatEMV('52', '0000') +                     // 52: Merchant Category Code (0000)
    formatEMV('53', '986');                       // 53: Moeda (986 = Real BRL)

  // 3. Campo 54: Valor da transação (Opcional no Pix estático)
  if (options.amount !== undefined && options.amount !== null && options.amount !== '') {
    const parsedAmount = typeof options.amount === 'number' 
      ? options.amount 
      : parseFloat(String(options.amount).replace(',', '.'));

    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      payload += formatEMV('54', parsedAmount.toFixed(2));
    }
  }

  // 4. Campos de identificação territorial e recebedor
  payload += 
    formatEMV('58', 'BR') +                       // 58: Código do País (BR)
    formatEMV('59', merchantName) +               // 59: Nome do Recebedor (máx 25)
    formatEMV('60', merchantCity) +               // 60: Cidade do Recebedor (máx 15)
    formatEMV('62', formatEMV('05', txid)) +      // 62: Dados adicionais (05 = txid)
    '6304';                                       // 63: Início do checksum CRC16

  // 5. Cálculo e anexação do CRC16
  const checksum = calculateCRC16(payload);
  return payload + checksum;
}
