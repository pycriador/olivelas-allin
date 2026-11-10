import React, { useState } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, Globe, Wifi } from 'lucide-react';
import { AppTunnelItem } from '../types.js';
import { copyToClipboard } from '../lib/utils.js';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppTunnelItem | null;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, app }) => {
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedLan, setCopiedLan] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'lan'>('public');

  if (!isOpen || !app) return null;

  const targetUrl =
    activeTab === 'public' && app.public_url ? app.public_url : app.lan_url || app.local_url;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    targetUrl
  )}`;

  const handleCopy = async (url: string, type: 'public' | 'lan') => {
    await copyToClipboard(url);
    if (type === 'public') {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedLan(true);
      setTimeout(() => setCopiedLan(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Compartilhar Acesso</h3>
              <p className="text-[11px] text-zinc-400 truncate">{app.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seletor URL Pública vs Rede Local */}
        <div className="p-5 space-y-4">
          {app.public_url && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveTab('public')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'public'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                URL Pública (Internet)
              </button>
              <button
                onClick={() => setActiveTab('lan')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'lan'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                Rede Wi-Fi (LAN)
              </button>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mx-auto w-fit shadow-inner">
            <img
              src={qrImageUrl}
              alt="QR Code de acesso"
              className="w-48 h-48 object-contain"
            />
          </div>

          <p className="text-center text-xs text-zinc-400">
            Aponte a câmera do celular ou compartilhe o link abaixo para abrir em qualquer computador:
          </p>

          {/* Link Box */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-emerald-300 truncate">{targetUrl}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(targetUrl, activeTab)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
                >
                  {(activeTab === 'public' ? copiedPublic : copiedLan) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copiar
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  title="Abrir no navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
