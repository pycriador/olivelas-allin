import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Receipt,
  QrCode,
  Copy,
  Check,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';
import { Bill } from '../types';

export const BillsView: React.FC = () => {
  const {
    bills,
    payBill,
    currentUser,
    activeCondominium,
    activeMembership,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'open' | 'paid'>('open');
  const [selectedBillForPix, setSelectedBillForPix] = useState<Bill | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter bills for current user/unit
  const userBills = bills.filter(
    (b) => b.condominiumId === activeCondominium.id && (b.userId === currentUser.id || b.unitId === activeMembership?.unitId)
  );

  const openBills = userBills.filter((b) => b.status === 'open' || b.status === 'overdue');
  const paidBills = userBills.filter((b) => b.status === 'paid');

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('info', 'Copiado com Sucesso', `${label} copiado para a área de transferência.`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {activeCondominium.name}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              {activeMembership?.unitNumber ? `Unidade ${activeMembership.unitNumber}` : 'Morador'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Boletos & Taxas Condominiais
            </h1>
            <InfoHelpButton
              title="Boletos & Financeiro da Unidade"
              description="Consulte cobranças ordinárias e extraordinárias, gere 2ª via com código de barras ou pague instantaneamente via PIX QR Code com compensação em tempo real."
              tips={[
                'Boletos vencidos são recalculados automaticamente com juros e multas de acordo com a convenção.',
                'O comprovante e termo de quitação ficam disponíveis na aba Pagos.',
              ]}
            />
          </div>
        </div>

        {/* Tab switcher pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'open'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Em Aberto ({openBills.length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'paid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Histórico Pago ({paidBills.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'open' ? (
        <div className="space-y-4">
          {openBills.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nenhum boleto em aberto!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Todas as suas taxas condominiais estão quitadas.
              </p>
            </Card>
          ) : (
            openBills.map((bill) => (
              <Card
                key={bill.id}
                className="border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/10"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={bill.status === 'overdue' ? 'danger' : 'warning'} dot>
                        {bill.status === 'overdue' ? 'Vencido' : 'Aguardando Pagamento'}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        Referência: {bill.referenceMonth}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        R$ {bill.amount.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Vencimento em {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Breakdown items */}
                    <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <p>• Cota Ordinária: R$ 720,00</p>
                      <p>• Fundo de Reserva (10%): R$ 72,00</p>
                      <p>• Água e Gás Individualizados: R$ 50,35</p>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<QrCode className="w-4 h-4" />}
                      onClick={() => setSelectedBillForPix(bill)}
                      className="w-full"
                    >
                      Pagar com PIX
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={
                        copiedId === bill.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )
                      }
                      onClick={() => handleCopy(bill.barcode, bill.id, 'Linha Digitável')}
                    >
                      {copiedId === bill.id ? 'Código Copiado!' : 'Copiar Código de Barras'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Download className="w-4 h-4" />}
                      onClick={() =>
                        showToast(
                          'success',
                          'PDF Baixado',
                          `Boleto ${bill.referenceMonth}.pdf baixado com sucesso.`
                        )
                      }
                    >
                      Baixar Boleto em PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paidBills.map((bill) => (
            <Card key={bill.id} className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Taxa Condominial — {bill.referenceMonth}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pago via PIX em {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '10/08/2026'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    R$ {bill.amount.toFixed(2).replace('.', ',')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={() =>
                      showToast(
                        'info',
                        'Comprovante Gerado',
                        `Comprovante_Liquidacao_${bill.referenceMonth.replace('/', '_')}.pdf gerado.`
                      )
                    }
                  >
                    Comprovante
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* PIX Modal */}
      {selectedBillForPix && (
        <Modal
          isOpen={!!selectedBillForPix}
          onClose={() => setSelectedBillForPix(null)}
          title="Pagamento Instantâneo via PIX"
          maxWidth="md"
        >
          <div className="text-center space-y-4">
            <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto flex items-center justify-center p-4 border border-slate-200 dark:border-slate-700">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136a196ed7b-53fa-4ed9-8296-fb21e87a9d695204000053039865406842.355802BR5925SOLAR%20PARK%20CONDOMINIO6009RIO%20DE%20JANEIRO62070503***6304E8A2"
                alt="QR Code PIX"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                R$ {selectedBillForPix.amount.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-slate-500">
                Favorecido: {activeCondominium.name} (CNPJ 12.345.678/0001-90)
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Chave Copia e Cola PIX
              </span>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                {selectedBillForPix.pixKey}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(selectedBillForPix.pixKey);
                  showToast('success', 'PIX Copiado', 'Chave PIX copiada para a área de transferência.');
                }}
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copiar Chave
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  payBill(selectedBillForPix.id);
                  setSelectedBillForPix(null);
                }}
              >
                Simular Pagamento
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
