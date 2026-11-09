import type { DeliveryOrder, PermissionGroup, TeamMember } from './types'

export const initialOrders: DeliveryOrder[] = [
  { id: '#2481', customer: 'Mariana Costa', initials: 'MC', phone: '(11) 98842-1705', address: 'Rua das Laranjeiras, 218 · Pinheiros', items: ['2× Bowl salmão', '1× Suco verde'], total: 78.9, status: 'Preparando', time: '12:42', eta: '25 min', source: 'WhatsApp', trackingCode: 'OLV-2481' },
  { id: '#2480', customer: 'Rafael Mendes', initials: 'RM', phone: '(11) 99216-8402', address: 'Av. Faria Lima, 1440 · Itaim', items: ['1× Combo executivo', '1× Brownie'], total: 64, status: 'Pedido feito', time: '12:38', eta: '35 min', source: 'WhatsApp', trackingCode: 'OLV-2480' },
  { id: '#2479', customer: 'Camila Oliveira', initials: 'CO', phone: '(11) 98330-1221', address: 'Rua Harmonia, 72 · Vila Madalena', items: ['1× Salada mediterrânea'], total: 42.5, status: 'Pronto', time: '12:31', eta: 'Pronto', source: 'Site', courier: 'João Pedro', trackingCode: 'OLV-2479' },
  { id: '#2478', customer: 'Lucas Ferreira', initials: 'LF', phone: '(11) 97101-0694', address: 'Rua Augusta, 530 · Consolação', items: ['3× Suco de laranja', '1× Wrap de frango'], total: 69.7, status: 'Em trajeto', time: '12:18', eta: '8 min', source: 'WhatsApp', courier: 'Pedro Alves', trackingCode: 'OLV-2478' },
  { id: '#2477', customer: 'Beatriz Santos', initials: 'BS', phone: '(11) 99730-5490', address: 'Rua dos Pinheiros, 801 · Pinheiros', items: ['1× Bowl tropical', '1× Água com gás'], total: 53.4, status: 'Aguardando retirada', time: '12:12', eta: 'Retirada', source: 'Telefone', courier: 'Ana Lima', trackingCode: 'OLV-2477' },
  { id: '#2476', customer: 'Pedro Henrique', initials: 'PH', phone: '(11) 98562-4077', address: 'Rua Girassol, 19 · Vila Madalena', items: ['2× Toast de avocado'], total: 58, status: 'Entregue', time: '11:56', eta: 'Entregue', source: 'WhatsApp', courier: 'João Pedro', trackingCode: 'OLV-2476' },
]

export const initialTeam: TeamMember[] = [
  { name: 'Ana Lima', email: 'ana@olivelas.com.br', role: 'Gerente', initials: 'AL', status: 'Ativo' },
  { name: 'João Pedro', email: 'joao@olivelas.com.br', role: 'Entregador', initials: 'JP', status: 'Ativo' },
  { name: 'Pedro Alves', email: 'pedro@olivelas.com.br', role: 'Entregador', initials: 'PA', status: 'Ativo' },
  { name: 'Julia Nascimento', email: 'julia@olivelas.com.br', role: 'Atendente', initials: 'JN', status: 'Ativo' },
]

export const initialGroups: PermissionGroup[] = [
  { name: 'Administradores', description: 'Acesso completo à loja e suas configurações.', members: 2, permissions: ['Pedidos', 'Equipe', 'Grupos', 'Auditoria', 'Integrações'], isSystem: true },
  { name: 'Gerentes', description: 'Operação da loja, equipe e relatórios.', members: 3, permissions: ['Pedidos', 'Equipe', 'Relatórios'], isSystem: true },
  { name: 'Atendentes', description: 'Recebimento e atualização de pedidos.', members: 4, permissions: ['Pedidos: visualizar', 'Pedidos: atualizar'], isSystem: true },
  { name: 'Entregadores', description: 'Pedidos atribuídos e atualização de entrega.', members: 5, permissions: ['Entregas: visualizar', 'Entregas: atualizar'], isSystem: true },
]

export const auditEvents = [
  { actor: 'Ana Lima', initials: 'AL', action: 'Atualizou o pedido #2481', detail: 'Pedido feito → Preparando', time: '12:43 hoje', tone: 'green' },
  { actor: 'Webhook WhatsApp', initials: 'WA', action: 'Novo pedido recebido', detail: 'Pedido #2481 · R$ 78,90', time: '12:42 hoje', tone: 'blue' },
  { actor: 'João Pedro', initials: 'JP', action: 'Iniciou uma entrega', detail: 'Pedido #2478 · código OLV-2478', time: '12:25 hoje', tone: 'orange' },
  { actor: 'Sistema', initials: 'SY', action: 'Convidou novo membro', detail: 'julia@olivelas.com.br · Atendente', time: '11:58 hoje', tone: 'purple' },
]
