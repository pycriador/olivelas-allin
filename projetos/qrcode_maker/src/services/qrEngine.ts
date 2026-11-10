import QRCodeStyling from 'qr-code-styling';
import { QRState, ExportFormat } from '../types';
import { getWikipediaLogoById } from './wikipediaLogos';

export class QREngine {
  private instance: QRCodeStyling | null = null;
  private container: HTMLElement | null = null;

  init(container: HTMLElement, state: QRState): void {
    this.container = container;
    this.container.innerHTML = '';

    this.instance = new QRCodeStyling(this.buildOptions(state, 240, 240));
    this.instance.append(this.container);
  }

  update(state: QRState): void {
    if (!this.instance) return;
    this.instance.update(this.buildOptions(state, 240, 240));
  }

  private buildOptions(state: QRState, width: number, height: number): any {
    // 1. Logo
    let logoUrl = '';
    if (state.logoType === 'wikipedia' && state.selectedWikipediaLogoId) {
      const wiki = getWikipediaLogoById(state.selectedWikipediaLogoId);
      if (wiki) logoUrl = wiki.badgeDataUrl;
    } else if (state.logoType === 'custom' && state.customLogoDataUrl) {
      logoUrl = state.customLogoDataUrl;
    }

    // Garante correção de erro robusta quando há logotipo para leitura instantânea por câmeras
    const errorCorrection = logoUrl && state.errorCorrectionLevel === 'L' ? 'Q' : state.errorCorrectionLevel;

    // 2. Dots
    const dotsOptions: any = {
      type: state.dotsType
    };

    if (state.dotsGradientEnabled && state.dotsColor2) {
      dotsOptions.gradient = {
        type: state.dotsGradientType || 'linear',
        rotation: (state.dotsGradientRotation || 0) * (Math.PI / 180),
        colorStops: [
          { offset: 0, color: state.dotsColor },
          { offset: 1, color: state.dotsColor2 }
        ]
      };
    } else {
      dotsOptions.color = state.dotsColor;
    }

    // 3. Cantos
    const cornersSquareColor = state.cornersSync ? state.dotsColor : state.cornersSquareColor;
    const cornersDotColor = state.cornersSync ? state.dotsColor : state.cornersDotColor;

    return {
      width,
      height,
      type: 'canvas',
      data: state.data || 'https://github.com/pycriador/olivelas-qrcode',
      margin: state.margin,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: errorCorrection
      },
      image: logoUrl || undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: state.logoSize,
        margin: logoUrl ? 4 : 0,
        crossOrigin: 'anonymous'
      },
      dotsOptions,
      cornersSquareOptions: {
        type: state.cornersSquareType,
        color: cornersSquareColor
      },
      cornersDotOptions: {
        type: state.cornersDotType,
        color: cornersDotColor
      },
      backgroundOptions: {
        color: state.bgTransparent ? 'transparent' : state.bgColor
      }
    };
  }

  async download(state: QRState, format: ExportFormat = 'png'): Promise<void> {
    if (!this.instance) return;

    // Se for exportação vetorial SVG
    if (format === 'svg') {
      const svgQr = new QRCodeStyling({
        ...this.buildOptions(state, state.exportSize, state.exportSize),
        type: 'svg'
      });
      await svgQr.download({
        name: 'olivelas-qrcode',
        extension: 'svg'
      });
      return;
    }

    // Se não tiver moldura, usa download direto em alta resolução
    if (state.frameStyle === 'none') {
      const highResQr = new QRCodeStyling(this.buildOptions(state, state.exportSize, state.exportSize));
      await highResQr.download({
        name: 'olivelas-qrcode',
        extension: format
      });
      return;
    }

    // Com moldura: sintetiza canvas composto de alta resolução
    const canvas = await this.createFramedCanvas(state, state.exportSize);
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `olivelas-qrcode-moldura.${format}`;
    link.href = canvas.toDataURL(format === 'webp' ? 'image/webp' : 'image/png', 0.95);
    link.click();
  }

  async copyToClipboard(state: QRState): Promise<boolean> {
    try {
      const canvas = await this.createFramedCanvas(state, 1024);
      if (!canvas) return false;

      return new Promise<boolean>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            resolve(true);
          } catch (e) {
            resolve(false);
          }
        }, 'image/png');
      });
    } catch {
      return false;
    }
  }

  async print(state: QRState): Promise<void> {
    const canvas = await this.createFramedCanvas(state, 800);
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir QR Code - Olivelas Studio</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
            img { max-width: 480px; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 12px; }
            h2 { margin-top: 1.5rem; color: #0f172a; font-size: 1.4rem; }
            p { color: #64748b; font-size: 0.95rem; max-width: 500px; word-break: break-all; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code" />
          <h2>${state.frameText || 'Escaneie para Acessar'}</h2>
          <p>${state.data}</p>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  private async createFramedCanvas(state: QRState, qrSize: number = 1000): Promise<HTMLCanvasElement | null> {
    // Cria instância dedicada em alta resolução para renderizar o canvas isolado
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    const highResQr = new QRCodeStyling(this.buildOptions(state, qrSize, qrSize));
    highResQr.append(tempContainer);

    // Aguarda desenho inicial do canvas
    await new Promise((r) => setTimeout(r, 80));
    const qrCanvas = tempContainer.querySelector('canvas');
    if (!qrCanvas) {
      document.body.removeChild(tempContainer);
      return null;
    }

    const padding = Math.round(qrSize * 0.08);
    const textHeight = state.frameStyle !== 'none' ? Math.round(qrSize * 0.16) : 0;
    const width = qrSize + (padding * 2);
    const height = qrSize + (padding * 2) + textHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      document.body.removeChild(tempContainer);
      return null;
    }

    // Fundo
    if (state.frameStyle === 'bottom') {
      ctx.fillStyle = state.frameBgColor || '#4f46e5';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // Estilo Card com contorno
    if (state.frameStyle === 'card') {
      ctx.lineWidth = Math.round(qrSize * 0.015);
      ctx.strokeStyle = state.dotsColor;
      ctx.strokeRect(padding / 2, padding / 2, width - padding, height - padding);
    }

    // Desenhar QR Code
    const qrOffsetY = state.frameStyle === 'top' ? textHeight + padding : padding;
    ctx.drawImage(qrCanvas, padding, qrOffsetY, qrSize, qrSize);

    // Texto da Moldura
    if (state.frameStyle !== 'none') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fontSize = Math.round(qrSize * 0.05);
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      if (state.frameStyle === 'bottom') {
        ctx.fillStyle = state.frameTextColor || '#ffffff';
        ctx.fillText(state.frameText || 'ESCANEIE-ME', width / 2, height - (textHeight / 2));
      } else if (state.frameStyle === 'top') {
        ctx.fillStyle = state.frameBgColor || '#4f46e5';
        ctx.fillText(state.frameText || 'SCAN HERE', width / 2, textHeight / 2);
      } else if (state.frameStyle === 'card') {
        ctx.fillStyle = state.dotsColor;
        ctx.fillText(state.frameText || 'APONTE A CÂMERA', width / 2, height - (textHeight / 2));
      }
    }

    document.body.removeChild(tempContainer);
    return canvas;
  }
}
