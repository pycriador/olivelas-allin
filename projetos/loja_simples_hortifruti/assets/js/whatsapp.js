/**
 * Whatsapp - build and open WhatsApp messages
 */
export class Whatsapp {
  constructor(number) {
    this.number = String(number).replace(/[^\d]/g, '');
  }

  /** Build a single-product inquiry message */
  productMessage(product) {
    const lines = [
      '👋 *Olá, Hortifruti Natural!*',
      '',
      'Tenho interesse no seguinte produto fresquinho:',
      '',
      `🍓 *Produto:* ${product.nome}`,
      `🏷️ *Código:* ${product.codigo}`,
      `📦 *Opção:* ${product.descricaoUnidade || product.unidadeVenda || '1 un.'}`,
      `💰 *Preço:* ${formatBRL(product.precoPacote ?? product.preco)}`,
      '',
      'Gostaria de verificar a disponibilidade para entrega/retirada.',
    ];
    return lines.join('\n');
  }

  /** Build the order message from cart items */
  orderMessage(items, total, currency = 'BRL') {
    let msg = [
      '🛒 *NOVO PEDIDO - Hortifruti Natural*',
      '',
      'Olá! Gostaria de fazer o seguinte pedido pelo catálogo:',
      '',
    ];

    items.forEach((item, i) => {
      const unitPrice = item.price ?? (item.product.precoPacote ?? item.product.preco);
      const subtotal = unitPrice * item.quantity;
      const unitDesc = item.unit ? ` (${item.unit})` : '';
      msg.push(`*${i + 1}. ${item.product.nome}*${unitDesc}`);
      msg.push(`   Cód: ${item.product.codigo}`);
      msg.push(`   Qtd: ${item.quantity} x ${formatBRL(unitPrice, currency)} = *${formatBRL(subtotal, currency)}*`);
      msg.push('');
    });

    msg.push('────────────────────────');
    msg.push(`💰 *TOTAL ESTIMADO: ${formatBRL(total, currency)}*`);
    msg.push('────────────────────────');
    msg.push('');
    msg.push('📍 Por favor, confirme a disponibilidade e o valor/tempo de entrega.');
    msg.push('Obrigado!');

    return msg.join('\n');
  }

  /** Open WhatsApp with a message */
  open(message) {
    const url = `https://wa.me/${this.number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return url;
  }
}

function formatBRL(value, currency) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(value);
}

function currency2Decimal(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
