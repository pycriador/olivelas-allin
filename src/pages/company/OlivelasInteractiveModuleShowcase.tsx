import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Box,
  Calendar,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Clock,
  Cpu,
  CreditCard,
  Database,
  Dumbbell,
  FileCheck2,
  Flame,
  Home,
  Layers,
  MapPin,
  Package,
  Play,
  Plus,
  QrCode,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Ticket,
  Truck,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react';
import { OlivelasEcosystemModuleSpec } from '../../services/olivelasEcosystemService';
import { formatCurrency } from '../../i18n/translations';

interface ShowcaseProps {
  module: OlivelasEcosystemModuleSpec;
  records: Record<string, unknown>[];
  onQuickPersist: (payload: Record<string, unknown>, message: string) => Promise<void>;
  onOpenNewModal: () => void;
}

export const OlivelasInteractiveModuleShowcase: React.FC<ShowcaseProps> = ({
  module,
  records,
  onQuickPersist,
  onOpenNewModal,
}) => {
  const [busy, setBusy] = useState(false);

  // Estados interativos para simulação das interfaces
  // 1. Gestão de Estoque & PDV
  const [cartQty, setCartQty] = useState<Record<string, number>>({ 'SKU-101': 2, 'SKU-204': 1 });
  const [selectedBatch, setSelectedBatch] = useState<string>('LOTE-2026-11A (FEFO Prioritário)');
  const [paymentMode, setPaymentMode] = useState<'PIX' | 'CREDITO' | 'CREDIARIO'>('PIX');

  // 2. Personal Trainer
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<'A' | 'B' | 'C'>('A');
  const [studentLoadKg, setStudentLoadKg] = useState<number>(85);
  const [completedSets, setCompletedSets] = useState<string[]>(['Supino Inclinado Halteres']);

  // 3. Clínicas / Odonto
  const [selectedSlot, setSelectedSlot] = useState<string>('14:30');
  const [patientNameInput, setPatientNameInput] = useState<string>('Mariana Costa');
  const [selectedTooth, setSelectedTooth] = useState<number>(16);

  // 4. Restaurante & KDS
  const [selectedTable, setSelectedTable] = useState<number>(4);
  const [kdsFilter, setKdsFilter] = useState<'all' | 'preparing' | 'ready'>('all');

  // 5. Rifas & Sorteios
  const [selectedTickets, setSelectedTickets] = useState<number[]>([7, 14, 28, 77]);

  // 6. Ordem de Serviço
  const [osStage, setOsStage] = useState<'triagem' | 'bancada' | 'teste' | 'pronto'>('bancada');
  const [partsCost, setPartsCost] = useState<number>(280);
  const [laborCost, setLaborCost] = useState<number>(170);

  // 7. Art Hub / Vitrine Digital IA
  const [aiPrompt, setAiPrompt] = useState<string>(
    'Gerar descrição persuasiva com SEO, tags de marketplace e estimativa de dimensões logísticas',
  );
  const [aiConfidence, setAiConfidence] = useState<number>(98.4);

  // 8. Contratos / Especificações / Condomínio / Casa / Delivery / Mercado
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickValue, setQuickValue] = useState<number>(350);

  const triggerPersist = async (payload: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      await onQuickPersist(payload, msg);
    } finally {
      setBusy(false);
    }
  };

  const buildAlignedPayload = (customTitle: string, customMetric: number) => {
    const payload: Record<string, unknown> = {};
    module.fields.forEach((f, idx) => {
      if (f.type === 'currency' || f.type === 'number') {
        payload[f.key] = customMetric;
      } else if (f.type === 'select') {
        payload[f.key] = f.options?.[0]?.value || 'active';
      } else if (idx === 0) {
        payload[f.key] = customTitle;
      } else if (idx === 1) {
        payload[f.key] = `${module.brandName.replace('Olivelas - ', '')} — Operação Interativa`;
      } else {
        payload[f.key] = f.placeholder?.replace('Ex.: ', '') || 'Demonstração Ao Vivo';
      }
    });
    return payload;
  };

  // =========================================================================
  // 1. INTERFACE INTERATIVA: OLIVELAS - GESTÃO DE ESTOQUE & PDV (gestao_estoque)
  // =========================================================================
  if (module.dbSchema === 'gestao_estoque') {
    const catalogItems = [
      { sku: 'SKU-101', name: 'Óleo Essencial Lavanda Francesa 30ml', price: 89.9, stock: 142, lot: 'LOTE-2026-11A' },
      { sku: 'SKU-204', name: 'Difusor Ultrassônico Cerâmica Zen', price: 249.0, stock: 38, lot: 'LOTE-2026-12B' },
      { sku: 'SKU-309', name: 'Kit Spa Botânico Olivelas Premium', price: 329.9, stock: 19, lot: 'LOTE-2027-01C' },
    ];
    const cartTotal = catalogItems.reduce(
      (acc, item) => acc + item.price * (cartQty[item.sku] || 0),
      0,
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Catálogo FEFO & Lotes */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Frente de Caixa (PDV) & Alocação Automática FEFO</h3>
                  <p className="text-xs text-muted">
                    Selecione itens para o cupom fiscal. O motor prioriza automaticamente o lote com vencimento mais próximo.
                  </p>
                </div>
              </div>
              <span className="badge badge-teal">FEFO Engine Ativo</span>
            </div>

            <div className="space-y-3">
              {catalogItems.map((item) => {
                const qty = cartQty[item.sku] || 0;
                return (
                  <div
                    key={item.sku}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-info font-mono">{item.sku}</span>
                        <strong className="text-sm">{item.name}</strong>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted mt-1">
                        <span>Lote sugerido: <code>{item.lot}</code></span>
                        <span>Saldo disponível: <strong>{item.stock} un</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">
                        {formatCurrency(item.price, 'BRL', 'pt-BR')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setCartQty((prev) => ({
                              ...prev,
                              [item.sku]: Math.max(0, (prev[item.sku] || 0) - 1),
                            }))
                          }
                        >
                          -
                        </button>
                        <span className="px-2.5 font-bold text-sm">{qty}</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setCartQty((prev) => ({
                              ...prev,
                              [item.sku]: (prev[item.sku] || 0) + 1,
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Layers size={16} /> Rastreabilidade de Lotes e Curva ABC em Tempo Real
              </h4>
              <span className="badge badge-success">{records.length} Produtos no Schema</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-muted block">Lote Selecionado</span>
                <strong className="text-sm mt-0.5 block">{selectedBatch}</strong>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-muted block">Giro Médio de Estoque</span>
                <strong className="text-sm text-emerald-600 mt-0.5 block">18,4 dias (Curva A)</strong>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-muted block">Alerta de Validade (&lt;30d)</span>
                <strong className="text-sm text-amber-600 mt-0.5 block">0 lotes críticos</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Checkout PDV & Persistência no Supabase */}
        <div className="lg:col-span-5">
          <div className="card p-5 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-teal-600" />
                  <h3 className="text-base font-bold">Resumo do Checkout PDV</h3>
                </div>
                <span className="badge badge-info font-mono">gestao_estoque.sales</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted">
                  Lote de Alocação Prioritária (FEFO)
                </label>
                <select
                  className="select w-full"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="LOTE-2026-11A (FEFO Prioritário)">LOTE-2026-11A (Venc: 11/2026 — Prioritário)</option>
                  <option value="LOTE-2026-12B (Reserva Técnica)">LOTE-2026-12B (Venc: 12/2026 — Reserva)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted">
                  Modalidade de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'CREDITO', 'CREDIARIO'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`btn btn-sm ${paymentMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between text-xs opacity-75">
                  <span>Subtotal dos Itens</span>
                  <span>{formatCurrency(cartTotal, 'BRL', 'pt-BR')}</span>
                </div>
                <div className="flex justify-between text-xs opacity-75">
                  <span>Desconto Fidelidade ({paymentMode === 'PIX' ? '5%' : '0%'})</span>
                  <span>
                    - {formatCurrency(paymentMode === 'PIX' ? cartTotal * 0.05 : 0, 'BRL', 'pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-slate-700">
                  <span>Total Líquido</span>
                  <span className="text-teal-400">
                    {formatCurrency(
                      paymentMode === 'PIX' ? cartTotal * 0.95 : cartTotal,
                      'BRL',
                      'pt-BR',
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                type="button"
                disabled={busy || cartTotal <= 0}
                onClick={() =>
                  triggerPersist(
                    {
                      sku: `PDV-${Math.floor(1000 + Math.random() * 9000)}`,
                      name: `Kit PDV (${paymentMode}) - ${selectedBatch.split(' ')[0]}`,
                      category: 'Venda PDV / Reposição',
                      unit_price: Number((paymentMode === 'PIX' ? cartTotal * 0.95 : cartTotal).toFixed(2)),
                      stock_quantity: Object.values(cartQty).reduce((a, b) => a + b, 0),
                    },
                    'Venda PDV e movimentação FEFO gravadas no schema gestao_estoque!',
                  )
                }
                className="btn btn-primary w-full justify-center py-3"
              >
                <CheckCircle2 size={16} />
                {busy ? 'Processando no Supabase...' : 'Finalizar Venda PDV & Baixar Lote no Supabase'}
              </button>
              <button
                type="button"
                onClick={onOpenNewModal}
                className="btn btn-secondary w-full justify-center"
              >
                <Plus size={15} /> Cadastrar Novo SKU Manualmente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. INTERFACE INTERATIVA: OLIVELAS - PERSONAL TRAINER (personal_treiner)
  // =========================================================================
  if (module.dbSchema === 'personal_treiner') {
    const exercisesByDay = {
      A: [
        { name: 'Supino Inclinado Halteres', sets: '4x 10-12', rest: '75s', rpe: 'RPE 8.5' },
        { name: 'Crucifixo Máquina Peck Deck', sets: '3x 12-15', rest: '60s', rpe: 'RPE 9.0' },
        { name: 'Desenvolvimento Arnold', sets: '4x 10', rest: '90s', rpe: 'RPE 8.0' },
        { name: 'Tríceps Corda Polia Alta', sets: '4x 15', rest: '45s', rpe: 'RPE 9.5' },
      ],
      B: [
        { name: 'Puxada Frente Pegada Pronada', sets: '4x 10-12', rest: '75s', rpe: 'RPE 8.5' },
        { name: 'Remada Curvada Barra Olímpica', sets: '4x 8-10', rest: '90s', rpe: 'RPE 9.0' },
        { name: 'Rosca Direta Barra W', sets: '3x 12', rest: '60s', rpe: 'RPE 8.5' },
      ],
      C: [
        { name: 'Agachamento Livre Barra', sets: '5x 8', rest: '120s', rpe: 'RPE 9.0' },
        { name: 'Leg Press 45º Amplitude Total', sets: '4x 12', rest: '90s', rpe: 'RPE 9.0' },
        { name: 'Stiff com Barra Olímpica', sets: '4x 10', rest: '90s', rpe: 'RPE 8.5' },
      ],
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
                <Dumbbell size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold">Prescrição Interativa de Treinos & Periodização</h3>
                <p className="text-xs text-muted">
                  Marque as séries concluídas pelo aluno e acompanhe o volume semanal em tempo real.
                </p>
              </div>
            </div>
            <div className="segmented-tabs">
              {(['A', 'B', 'C'] as const).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedWorkoutDay(day)}
                  className={`segmented-tab ${selectedWorkoutDay === day ? 'active' : ''}`}
                >
                  Treino {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {exercisesByDay[selectedWorkoutDay].map((ex) => {
              const isDone = completedSets.includes(ex.name);
              return (
                <div
                  key={ex.name}
                  onClick={() =>
                    setCompletedSets((prev) =>
                      prev.includes(ex.name) ? prev.filter((i) => i !== ex.name) : [...prev, ex.name],
                    )
                  }
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? 'border-teal-500/50 bg-teal-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={18}
                      className={isDone ? 'text-teal-500' : 'text-slate-400'}
                    />
                    <div>
                      <strong className="text-sm">{ex.name}</strong>
                      <div className="text-xs text-muted">
                        Séries: {ex.sets} • Descanso: {ex.rest}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-info">{ex.rpe}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Activity size={18} className="text-teal-600" /> Bioimpedância & Evolução Antropométrica
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-muted block">Massa Magra Atual</span>
                <strong className="text-base text-emerald-600">68,4 kg (+1,8 kg)</strong>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-muted block">Percentual de Gordura (BF)</span>
                <strong className="text-base text-teal-600">12,4% (-2,1%)</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">
                Ajustar Carga de Referência (Supino/Agachamento): {studentLoadKg} kg
              </label>
              <input
                type="range"
                min={30}
                max={180}
                value={studentLoadKg}
                onChange={(e) => setStudentLoadKg(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              triggerPersist(
                buildAlignedPayload(
                  `Aluno Protocolo ${selectedWorkoutDay} (${studentLoadKg}kg)`,
                  390,
                ),
                'Ficha de treino e avaliação salvas no schema personal_treiner!',
              )
            }
            className="btn btn-primary w-full justify-center py-3"
          >
            <CheckCircle2 size={16} /> Publicar Periodização no Schema personal_treiner
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. INTERFACE INTERATIVA: CLÍNICAS & ODONTO (agendamento_simples / agendamentos)
  // =========================================================================
  if (module.dbSchema === 'agendamento_simples' || module.dbSchema === 'agendamentos') {
    const slots = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];
    const teeth = [11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 26];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
                <Stethoscope size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold">Agenda Clínica Inteligente & Odontograma Digital</h3>
                <p className="text-xs text-muted">
                  Selecione o horário e o elemento clínico para agendar com disparo automático via WhatsApp.
                </p>
              </div>
            </div>
            <span className="badge badge-teal">Confirmação WhatsApp Ativa</span>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-muted block mb-2">
              Horários Disponíveis Hoje
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`btn btn-sm justify-center ${
                    selectedSlot === slot ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <Clock size={13} /> {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-muted block mb-2">
              Mapa Clínico / Odontograma Interativo (Elemento Selecionado: #{selectedTooth})
            </label>
            <div className="grid grid-cols-6 gap-2">
              {teeth.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTooth(t)}
                  className={`p-2.5 rounded-xl border text-center font-mono text-xs font-bold transition-all ${
                    selectedTooth === t
                      ? 'border-teal-500 bg-teal-500/15 text-teal-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Dente {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Calendar size={18} className="text-teal-600" /> Novo Agendamento Rápido
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted">Nome do Paciente</label>
              <input
                type="text"
                className="input w-full"
                value={patientNameInput}
                onChange={(e) => setPatientNameInput(e.target.value)}
              />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div>
                <strong>Horário Selecionado:</strong> {selectedSlot}h
              </div>
              <div>
                <strong>Procedimento / Elemento:</strong> Avaliação Clínica #{selectedTooth}
              </div>
              <div className="text-emerald-600 font-semibold">
                ✓ Lembrete automático WhatsApp habilitado
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              triggerPersist(
                buildAlignedPayload(
                  `${patientNameInput} (${selectedSlot}h - Dente #${selectedTooth})`,
                  320,
                ),
                `Agendamento de ${patientNameInput} às ${selectedSlot} gravado no Supabase!`,
              )
            }
            className="btn btn-primary w-full justify-center py-3"
          >
            <Send size={15} /> Confirmar Agendamento & Enviar WhatsApp
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. INTERFACE INTERATIVA: RESTAURANTES & KDS (restaurante)
  // =========================================================================
  if (module.dbSchema === 'restaurante') {
    const tables = [
      { number: 1, status: 'occupied', guests: 4, bill: 318.5, waiter: 'Carlos' },
      { number: 2, status: 'free', guests: 0, bill: 0, waiter: '—' },
      { number: 4, status: 'occupied', guests: 6, bill: 542.0, waiter: 'Fernanda' },
      { number: 7, status: 'ready', guests: 2, bill: 189.9, waiter: 'Carlos' },
    ];
    const kdsOrders = [
      { id: '#KDS-401', dish: '2x Risoto de Camarão Trufado', table: 4, time: '06:12', state: 'preparing' },
      { id: '#KDS-402', dish: '1x Bife Ancho Angus + Chimichurri', table: 1, time: '03:45', state: 'preparing' },
      { id: '#KDS-399', dish: '2x Petit Gâteau Artesanal', table: 7, time: 'PRONTO', state: 'ready' },
    ].filter((o) => kdsFilter === 'all' || o.state === kdsFilter);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Utensils size={18} className="text-teal-600" /> Mapa de Mesas & Comandas Digitais
            </h3>
            <span className="badge badge-teal">Salão Principal</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tables.map((t) => (
              <div
                key={t.number}
                onClick={() => setSelectedTable(t.number)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTable === t.number
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-base">Mesa 0{t.number}</strong>
                  <span
                    className={`badge ${
                      t.status === 'free'
                        ? 'badge-success'
                        : t.status === 'ready'
                          ? 'badge-teal'
                          : 'badge-warning'
                    }`}
                  >
                    {t.status === 'free' ? 'Livre' : t.status === 'ready' ? 'Pronto KDS' : 'Em Atendimento'}
                  </span>
                </div>
                <div className="text-xs text-muted mt-2">
                  Clientes: {t.guests} • Garçom: {t.waiter}
                </div>
                <div className="text-sm font-bold mt-1">
                  Parcial: {formatCurrency(t.bill, 'BRL', 'pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ChefHat size={18} className="text-teal-600" /> Monitor KDS de Cozinha
              </h3>
              <div className="segmented-tabs">
                {(['all', 'preparing', 'ready'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setKdsFilter(f)}
                    className={`segmented-tab ${kdsFilter === f ? 'active' : ''}`}
                  >
                    {f === 'all' ? 'Todos' : f === 'preparing' ? 'Em Preparo' : 'Prontos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {kdsOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info font-mono">{ord.id}</span>
                      <strong className="text-sm">{ord.dish}</strong>
                    </div>
                    <span className="text-xs text-muted">Mesa 0{ord.table}</span>
                  </div>
                  <span className={`badge ${ord.state === 'ready' ? 'badge-success' : 'badge-warning'}`}>
                    <Flame size={12} /> {ord.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              triggerPersist(
                buildAlignedPayload(`Mesa 0${selectedTable} - Pedido KDS`, 268.9),
                `Pedido da Mesa 0${selectedTable} enviado para o KDS no schema restaurante!`,
              )
            }
            className="btn btn-primary w-full justify-center py-3"
          >
            <ChefHat size={16} /> Disparar Novo Pedido da Mesa 0{selectedTable} para o KDS
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. INTERFACE INTERATIVA: RIFAS & SORTEIOS (rifas / suite_rifa)
  // =========================================================================
  if (module.dbSchema === 'rifas' || module.dbSchema === 'suite_rifa') {
    const ticketNumbers = Array.from({ length: 30 }, (_, i) => i + 1);
    const unitPrice = 25;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
                <Ticket size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold">Seletor Interativo de Cotas & Bilhetes Numerados</h3>
                <p className="text-xs text-muted">
                  Clique nos números da grade para reservar cotas em tempo real com liquidação PIX imediata.
                </p>
              </div>
            </div>
            <span className="badge badge-teal">{selectedTickets.length} Cotas Selecionadas</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {ticketNumbers.map((num) => {
              const isSelected = selectedTickets.includes(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() =>
                    setSelectedTickets((prev) =>
                      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
                    )
                  }
                  className={`p-2.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-teal-500'
                  }`}
                >
                  {String(num).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <QrCode size={18} className="text-teal-600" /> Checkout PIX Instantâneo
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="text-xs opacity-75">Cotas selecionadas:</div>
              <div className="font-mono text-xs text-teal-400">
                {selectedTickets.map((n) => `#${String(n).padStart(2, '0')}`).join(', ') || 'Nenhuma cota'}
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-700">
                <span>Total a Liquidar</span>
                <span>{formatCurrency(selectedTickets.length * unitPrice, 'BRL', 'pt-BR')}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={busy || selectedTickets.length === 0}
            onClick={() =>
              triggerPersist(
                buildAlignedPayload(
                  `Reserva PIX (${selectedTickets.length} cotas: ${selectedTickets.slice(0, 4).join(',')})`,
                  selectedTickets.length * unitPrice,
                ),
                `Reserva de ${selectedTickets.length} cotas gravada com sucesso no Supabase!`,
              )
            }
            className="btn btn-primary w-full justify-center py-3"
          >
            <CreditCard size={16} /> Emitir Bilhetes & Gravar no Schema {module.dbSchema}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. INTERFACE INTERATIVA: ORDEM DE SERVIÇO (ordem_de_servico)
  // =========================================================================
  if (module.dbSchema === 'ordem_de_servico') {
    const stages = [
      { id: 'triagem', label: '1. Triagem & Checklist' },
      { id: 'bancada', label: '2. Em Bancada Técnica' },
      { id: 'teste', label: '3. Controle de Qualidade' },
      { id: 'pronto', label: '4. Pronto para Entrega' },
    ] as const;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Wrench size={18} className="text-teal-600" /> Esteira Kanban de Bancada Técnica
            </h3>
            <span className="badge badge-info">SLA de Garantia: 90 dias</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stages.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setOsStage(st.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  osStage === st.id
                    ? 'border-teal-500 bg-teal-500/15 font-bold'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="text-xs">{st.label}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase text-muted">Peças Aplicadas (R$)</label>
              <input
                type="number"
                className="input w-full mt-1"
                value={partsCost}
                onChange={(e) => setPartsCost(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted">Mão de Obra Técnica (R$)</label>
              <input
                type="number"
                className="input w-full mt-1"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-base font-bold">Orçamento & Laudo Técnico</h3>
            <p className="text-xs text-muted">
              Estágio atual: <strong className="uppercase">{osStage}</strong>
            </p>
            <div className="p-4 rounded-xl bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs opacity-75">Total da O.S. (Peças + Serviço)</span>
              <strong className="text-lg text-teal-400">
                {formatCurrency(partsCost + laborCost, 'BRL', 'pt-BR')}
              </strong>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              triggerPersist(
                buildAlignedPayload(
                  `OS-${Math.floor(1000 + Math.random() * 9000)} (${osStage.toUpperCase()})`,
                  partsCost + laborCost,
                ),
                'Ordem de Serviço atualizada no schema ordem_de_servico!',
              )
            }
            className="btn btn-primary w-full justify-center py-3"
          >
            <CheckCircle2 size={16} /> Emitir Ordem de Serviço no Supabase
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 7. INTERFACE INTERATIVA: ART HUB & VITRINE DIGITAL IA (art_hub / vitrine_digital)
  // =========================================================================
  if (module.dbSchema === 'art_hub' || module.dbSchema === 'vitrine_digital') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold">Estúdio de Visão Computacional & Copywriting IA</h3>
                <p className="text-xs text-muted">
                  Inspecione ativos visuais, extraia metadados logísticos e gere descrições otimizadas para e-commerce.
                </p>
              </div>
            </div>
            <span className="badge badge-teal">Confiança IA: {aiConfidence}%</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted">
              Diretriz de Enriquecimento Generativo (Prompt de Catálogo)
            </label>
            <textarea
              rows={3}
              className="textarea w-full"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-muted block">Recorte & Fundo</span>
              <strong className="text-emerald-600">Studio White 4K</strong>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-muted block">Cubagem Estimada</span>
              <strong>24 x 18 x 12 cm (0,85 kg)</strong>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-muted block">Score SEO Marketplace</span>
              <strong className="text-teal-600">99/100 (A+)</strong>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 card p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-teal-600" /> Publicação Instantânea na Vitrine
            </h3>
            <p className="text-xs text-muted">
              O ativo processado pela IA é gravado diretamente no schema PostgreSQL do módulo.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setAiConfidence(99.2);
              triggerPersist(
                buildAlignedPayload('Coleção Botânica IA #2026', 490),
                `Ativo enriquecido por IA publicado no schema ${module.dbSchema}!`,
              );
            }}
            className="btn btn-primary w-full justify-center py-3"
          >
            <Zap size={16} /> Processar com IA & Publicar no Schema {module.dbSchema}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 8. INTERFACE INTERATIVA PADRONIZADA PARA OS DEMAIS MÓDULOS COMERCIAIS
  // (app_condominio, casa_organizada, contratos, especificacoes, sistema_delivery, sistema_mercado)
  // =========================================================================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
              {module.slug === 'app_condominio' || module.slug === 'casa_organizada' ? (
                <Home size={18} />
              ) : module.slug === 'contratos' ? (
                <FileCheck2 size={18} />
              ) : module.slug === 'especificacoes' ? (
                <Cpu size={18} />
              ) : module.slug === 'sistema_delivery' ? (
                <Truck size={18} />
              ) : (
                <ShoppingBag size={18} />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">
                Console Operacional Interativo — {module.brandName}
              </h3>
              <p className="text-xs text-muted">{module.tagline}</p>
            </div>
          </div>
          <span className="badge badge-teal">Execução em Tempo Real</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {module.features.map((feat, idx) => (
            <div
              key={feat}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 size={15} className="text-teal-500 shrink-0" />
                <span>{feat}</span>
              </div>
              <span className="badge badge-neutral">Módulo {idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-5 card p-5 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Play size={16} className="text-teal-600" /> Simulador de Lançamento Rápido no Schema
          </h3>
          <p className="text-xs text-muted">
            Execute uma operação de demonstração abaixo para gravar diretamente na tabela{' '}
            <code>
              {module.dbSchema}.{module.primaryTable}
            </code>
            .
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted">
              Identificação / Descrição da Operação
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder={`Ex.: Operação ${module.brandName}`}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted">
              Valor / Métrica Operacional
            </label>
            <input
              type="number"
              className="input w-full"
              value={quickValue}
              onChange={(e) => setQuickValue(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const payload: Record<string, unknown> = {};
              module.fields.forEach((f, idx) => {
                if (f.type === 'currency' || f.type === 'number') {
                  payload[f.key] = quickValue;
                } else if (f.type === 'select') {
                  payload[f.key] = f.options?.[0]?.value || 'active';
                } else if (idx === 0) {
                  payload[f.key] = quickTitle.trim() || `Demo ${module.brandName} #${records.length + 1}`;
                } else {
                  payload[f.key] = f.placeholder || 'Execução Demonstração Ao Vivo';
                }
              });
              triggerPersist(
                payload,
                `Operação gravada ao vivo em ${module.dbSchema}.${module.primaryTable}!`,
              );
            }}
            className="btn btn-primary w-full justify-center py-3"
          >
            <CheckCircle2 size={16} /> Executar Operação & Gravar no Supabase
          </button>
          <button
            type="button"
            onClick={onOpenNewModal}
            className="btn btn-secondary w-full justify-center"
          >
            <Plus size={15} /> Abrir Formulário Completo do Schema
          </button>
        </div>
      </div>
    </div>
  );
};
