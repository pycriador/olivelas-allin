export const orderStatuses = [
  'Pedido feito',
  'Preparando',
  'Pronto',
  'Aguardando retirada',
  'Em trajeto',
  'Entregue',
] as const

export type OrderStatus = (typeof orderStatuses)[number]
export type AppSection = 'orders' | 'team' | 'groups' | 'audit' | 'api'

export interface DeliveryOrder {
  id: string
  customer: string
  initials: string
  phone: string
  address: string
  items: string[]
  total: number
  status: OrderStatus
  time: string
  eta: string
  source: 'WhatsApp' | 'Telefone' | 'Site'
  courier?: string
  trackingCode: string
}

export interface TeamMember {
  name: string
  email: string
  role: string
  initials: string
  status: 'Ativo' | 'Convite enviado'
}

export interface PermissionGroup {
  name: string
  description: string
  members: number
  permissions: string[]
  isSystem?: boolean
}
