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
      'Olá!',
      '',
      'Tenho interesse no seguinte produto:',
      '',
      `Nome: ${product.nome}`,
      `Código: ${product.codigo}`,
      `Peso: ${product.pesoUnitario}`,
      `${currency2Decimal(product.precoPacote)}`,
      `Quantidade por pacote: ${product.unidadesPorPacote}`,
      '',
      'Gostaria de mais informações.',
    ];
    return lines.join('\n');
  }

  /** Build the order message from cart items */
  orderMessage(items, total, currency = 'BRL') {
    let msg = ['Olá!', '', 'Gostaria de realizar o seguinte pedido:', ''];

    items.forEach((item, i) => {
      msg.push(`${i + 1}. ${item.product.nome}`);
      msg.push(`   Código: ${item.product.codigo}`);
      msg.push(`   Quantidade: ${item.quantity}`);
      msg.push('');
    });

    msg.push(`Total estimado: ${formatBRL(total, currency)}`);
    msg.push('');
    msg.push('Gostaria de confirmar o pedido.');

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
