import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDown, ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, Bike, Check,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, Code2, Copy, Eye, EyeOff,
  Filter, Globe2, LayoutDashboard, LockKeyhole, MapPin, Menu, MessageCircle,
  MoreHorizontal, Plus, Search, Settings2, Shield, ShieldCheck, ShoppingBag,
  Store, Truck, Users, X,
} from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { auditEvents, initialGroups, initialOrders, initialTeam } from './data'
import { orderStatuses, type AppSection, type DeliveryOrder, type OrderStatus, type PermissionGroup, type TeamMember } from './types'

const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function useSavedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) as T : initial
    } catch (error) {
      console.error(`Não foi possível carregar os dados locais "${key}".`, error)
      return initial
    }
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue] as const
}

function Brand({ light = false }: { light?: boolean }) {
  return <Link to="/" className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark"><Store size={19} strokeWidth={2.2} /></span><span>olivelas<span className="brand-suffix"> delivery</span></span></Link>
}

function LandingPage() {
  return <main className="landing">
    <header className="marketing-nav wrap">
      <Brand />
      <nav><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><Link to="/tracking">Acompanhar pedido</Link></nav>
      <div className="nav-actions"><Link className="login-link" to="/login">Entrar</Link><Link className="button button-dark button-small" to="/cadastro">Começar agora <ArrowRight size={15} /></Link></div>
    </header>
    <section className="hero wrap">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> OPERAÇÃO DE DELIVERY, SEM COMPLICAÇÃO</div>
        <h1>Pedido recebido.<br />Entrega <span>no ritmo.</span></h1>
        <p className="hero-lead">Do WhatsApp até a porta do cliente, cada pedido no seu lugar. Uma operação leve para sua equipe e uma experiência melhor para quem pede.</p>
        <div className="hero-actions"><Link className="button button-dark" to="/cadastro">Organizar meus pedidos <ArrowRight size={17} /></Link><Link className="button button-soft" to="/login">Já tenho uma conta</Link></div>
        <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div><p><strong>Feito para lojas independentes</strong><br />simples de começar, pronto para crescer</p></div>
      </div>
      <div className="hero-visual">
        <div className="sun-orbit orbit-one" /><div className="sun-orbit orbit-two" />
        <div className="hero-sun"><span>O</span></div>
        <div className="floating-note note-top"><span className="note-icon note-whatsapp"><MessageCircle size={16} /></span><span><strong>Pedido novo!</strong><small>WhatsApp · agora mesmo</small></span><span className="note-pulse" /></div>
        <div className="floating-note note-bottom"><span className="note-icon note-delivered"><Check size={17} /></span><span><strong>Chegou quentinho</strong><small>Entrega concluída · 12:32</small></span></div>
        <div className="hero-caption"><span>01</span> uma operação que flui <i /></div>
      </div>
    </section>
    <section className="trust-row"><div className="wrap trust-inner"><span>DO PRIMEIRO OI AO ÚLTIMO KM</span><div><MessageCircle size={17} /> WhatsApp integrado</div><div><ShieldCheck size={17} /> Cada loja, seus dados</div><div><Clock3 size={17} /> Status em tempo real</div></div></section>
    <section className="feature-section wrap" id="recursos">
      <div className="section-heading"><div><div className="eyebrow">MENOS CORRERIA, MAIS CONTROLE</div><h2>Tudo flui quando<br />o time está alinhado.</h2></div><p>Uma visão clara para quem prepara, atende e entrega. Sem perder pedidos no meio das conversas.</p></div>
      <div className="feature-grid">
        <article className="feature-card feature-main"><span className="feature-icon"><ShoppingBag size={20} /></span><div className="mini-board"><div className="mini-board-top"><span>Pedidos de hoje</span><span className="live-dot"> AO VIVO</span></div><strong>28 <small>pedidos</small></strong><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><h3>Uma fila que faz sentido</h3><p>Visualize cada etapa sem alternar entre conversas, planilhas e anotações.</p></article>
        <article className="feature-card"><span className="feature-icon icon-yellow"><Bike size={20} /></span><h3>A entrega também faz parte</h3><p>Atribua entregadores e acompanhe cada pedido até chegar ao destino.</p><div className="route-visual"><span className="route-pin"><MapPin size={18} /></span><i /><i /><i /><span className="route-bike"><Bike size={18} /></span></div></article>
        <article className="feature-card"><span className="feature-icon icon-pink"><ShieldCheck size={20} /></span><h3>Seu time, suas regras</h3><p>Permissões por função, equipes organizadas e histórico de cada ação.</p><div className="people-pills"><span>AD Administrador</span><span>AT Atendente</span><span>EN Entregador</span></div></article>
      </div>
    </section>
    <section className="cta-band" id="como-funciona"><div className="wrap cta-content"><div><div className="eyebrow">SUA LOJA MERECE UM FLUXO LEVE</div><h2>Seu próximo pedido<br />já pode chegar organizado.</h2></div><Link className="button button-light" to="/cadastro">Comece por aqui <ArrowRight size={17} /></Link></div></section>
    <footer className="marketing-footer wrap"><Brand /><span>© 2026 Olivelas Delivery</span><Link to="/tracking">Acompanhar pedido público <ArrowRight size={14} /></Link></footer>
  </main>
}

function AuthPage({ register = false, onAuthenticated }: { register?: boolean; onAuthenticated: () => void }) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    localStorage.setItem('olivelas-demo-user', 'true')
    onAuthenticated()
    navigate('/app/orders')
  }
  return <main className="auth-screen">
    <Link to="/" className="auth-back"><ArrowDownLeft size={16} /> Voltar ao início</Link>
    <div className="auth-panel"><div className="auth-brand"><Brand /><span className="demo-label">AMBIENTE DE DEMONSTRAÇÃO</span></div>
      <div className="auth-heading"><span className="eyebrow">{register ? 'UM BOM COMEÇO' : 'BEM-VINDO DE VOLTA'}</span><h1>{register ? 'Sua loja, no fluxo.' : 'Que bom ter você de volta.'}</h1><p>{register ? 'Crie seu espaço de delivery e deixe os pedidos mais leves.' : 'Entre para acompanhar a operação da sua loja.'}</p></div>
      <form className="auth-form" onSubmit={submit}>
        {register && <label>Nome da loja<input required placeholder="Ex.: Oliva Cozinha" /></label>}
        {register && <label>Seu nome<input required placeholder="Como podemos te chamar?" /></label>}
        <label>E-mail<input type="email" required placeholder="voce@sualoja.com.br" /></label>
        <label>Senha<div className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength={6} placeholder="Mínimo de 6 caracteres" /><button type="button" aria-label="Mostrar senha" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        {!register && <div className="auth-forgot"><label className="checkbox-label"><input type="checkbox" /> Manter conectado</label><a href="mailto:suporte@olivelas.com.br">Esqueceu a senha?</a></div>}
        <button className="button button-dark button-full" type="submit">{register ? 'Criar meu espaço' : 'Entrar na minha conta'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">{register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <Link to={register ? '/login' : '/cadastro'}>{register ? 'Entrar' : 'Criar meu espaço'}</Link></p>
      <div className="auth-security"><LockKeyhole size={14} /> Seus dados protegidos e separados por loja</div>
    </div>
    <div className="auth-side"><div className="auth-side-art"><div className="auth-art-ring" /><span className="art-leaf">✳</span><div className="auth-side-card"><span className="live-dot"> AO VIVO</span><strong>Pedido a caminho</strong><small>João Pedro · previsão 8 min</small><div className="auth-progress"><i /></div><span className="auth-map-pin"><Bike size={20} /></span></div></div><p>Do primeiro oi ao último km.<br /><strong>Seu delivery, em sintonia.</strong></p></div>
  </main>
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    'Pedido feito': 'status-new', Preparando: 'status-preparing', Pronto: 'status-ready',
    'Aguardando retirada': 'status-pickup', 'Em trajeto': 'status-route', Entregue: 'status-done',
  }
  return <span className={`status-badge ${styles[status]}`}><i />{status}</span>
}

function AppShell({ orders, setOrders, team, setTeam, groups, setGroups }: {
  orders: DeliveryOrder[]; setOrders: (orders: DeliveryOrder[]) => void
  team: TeamMember[]; setTeam: (team: TeamMember[]) => void
  groups: PermissionGroup[]; setGroups: (groups: PermissionGroup[]) => void
}) {
  const { section = 'orders' } = useParams()
  const [search, setSearch] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [filterStatus, setFilterStatus] = useState('Todos os pedidos')
  const [copied, setCopied] = useState(false)
  const selected = (['orders', 'team', 'groups', 'audit', 'api'] as string[]).includes(section) ? section as AppSection : 'orders'
  const sectionNames: Record<AppSection, string> = { orders: 'Pedidos', team: 'Equipe', groups: 'Grupos & permissões', audit: 'Auditoria', api: 'Integrações de API' }
  const filteredOrders = useMemo(() => orders.filter(order =>
    (filterStatus === 'Todos os pedidos' || order.status === filterStatus) &&
    `${order.id} ${order.customer} ${order.address}`.toLowerCase().includes(search.toLowerCase()),
  ), [orders, filterStatus, search])

  const advanceOrder = (order: DeliveryOrder) => {
    const next = orderStatuses[Math.min(orderStatuses.indexOf(order.status) + 1, orderStatuses.length - 1)]
    setOrders(orders.map(item => item.id === order.id ? { ...item, status: next } : item))
  }
  const addOrder = () => {
    const number = 2481 + orders.length - initialOrders.length + 1
    const order: DeliveryOrder = { id: `#${number}`, customer: 'Novo pedido', initials: 'NP', phone: '—', address: 'Endereço a confirmar', items: ['1× Pedido recebido pelo WhatsApp'], total: 39.9, status: 'Pedido feito', time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()), eta: '35 min', source: 'WhatsApp', trackingCode: `OLV-${number}` }
    setOrders([order, ...orders])
  }
  const inviteMember = () => {
    const name = window.prompt('Nome da pessoa convidada')
    if (!name?.trim()) return
    const email = window.prompt('E-mail para o convite')
    if (!email?.trim()) return
    setTeam([{ name: name.trim(), email: email.trim(), role: 'Atendente', initials: name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(), status: 'Convite enviado' }, ...team])
  }
  const addGroup = () => {
    const name = window.prompt('Nome do novo grupo de permissões')
    if (name?.trim()) setGroups([...groups, { name: name.trim(), description: 'Grupo personalizado da loja.', members: 0, permissions: ['Pedidos: visualizar'], isSystem: false }])
  }
  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText('http://localhost:8000/api/v1/integrations/whatsapp/orders')
    } catch (error) {
      console.error('Não foi possível copiar o endpoint da integração.', error)
      window.alert('Não foi possível copiar o endpoint. Tente novamente pelo navegador.')
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <div className="app-shell">
    {mobileMenu && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenu(false)} />}
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="icon-button mobile-close" aria-label="Fechar menu" onClick={() => setMobileMenu(false)}><X size={18} /></button></div>
      <button className="store-switch"><span className="store-avatar">O</span><span className="store-info"><strong>Oliva Cozinha</strong><small>Pinheiros, São Paulo</small></span><ChevronDown size={15} /></button>
      <span className="nav-caption">OPERAÇÃO</span>
      <nav className="side-nav">
        <NavLink to="/app/orders" onClick={() => setMobileMenu(false)} className={selected === 'orders' ? 'active' : ''}><LayoutDashboard size={18} /> Visão geral <span className="nav-count">{orders.filter(order => order.status !== 'Entregue').length}</span></NavLink>
        <NavLink to="/app/team" onClick={() => setMobileMenu(false)} className={selected === 'team' ? 'active' : ''}><Users size={18} /> Equipe</NavLink>
        <NavLink to="/app/groups" onClick={() => setMobileMenu(false)} className={selected === 'groups' ? 'active' : ''}><Shield size={18} /> Grupos & permissões</NavLink>
        <NavLink to="/app/audit" onClick={() => setMobileMenu(false)} className={selected === 'audit' ? 'active' : ''}><Clock3 size={18} /> Auditoria</NavLink>
      </nav>
      <span className="nav-caption nav-caption-lower">DESENVOLVEDORES</span>
      <nav className="side-nav"><NavLink to="/app/api" onClick={() => setMobileMenu(false)} className={selected === 'api' ? 'active' : ''}><Code2 size={18} /> Integrações de API</NavLink><Link to="/tracking"><Globe2 size={18} /> Acompanhamento público <ArrowUpRight size={14} className="nav-external" /></Link></nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-help"><span className="help-icon"><CircleHelp size={17} /></span><span><strong>Precisa de ajuda?</strong><small>Fale com nosso time</small></span><ArrowUpRight size={14} /></div>
      <button className="profile-button"><span className="profile-avatar">RC</span><span className="profile-info"><strong>Rafaela Costa</strong><small>Administradora</small></span><MoreHorizontal size={18} /></button>
    </aside>
    <main className="app-main">
      <header className="app-topbar"><button className="icon-button mobile-menu-button" aria-label="Abrir menu" onClick={() => setMobileMenu(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Oliva Cozinha</span><i>/</i><strong>{sectionNames[selected]}</strong></div><div className="topbar-actions"><span className="topbar-date">Sexta-feira, 23 de outubro</span><button className="icon-button notification-button" aria-label="Notificações"><Bell size={18} /><i /></button><span className="profile-avatar topbar-avatar">RC</span></div></header>
      <div className="page-container">
        {selected === 'orders' && <OrdersView orders={filteredOrders} allOrders={orders} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} addOrder={addOrder} advanceOrder={advanceOrder} />}
        {selected === 'team' && <TeamView team={team} invite={inviteMember} remove={(email) => setTeam(team.filter(person => person.email !== email))} />}
        {selected === 'groups' && <GroupsView groups={groups} addGroup={addGroup} remove={(name) => setGroups(groups.filter(group => group.name !== name))} />}
        {selected === 'audit' && <AuditView />}
        {selected === 'api' && <ApiView copied={copied} copyKey={copyKey} />}
      </div>
      <footer className="app-footer"><span>© 2026 Olivelas Delivery</span><span><i /> Dados atualizados agora</span><span>Ambiente de demonstração</span></footer>
    </main>
  </div>
}

function OrdersView({ orders, allOrders, search, setSearch, filterStatus, setFilterStatus, addOrder, advanceOrder }: {
  orders: DeliveryOrder[]; allOrders: DeliveryOrder[]; search: string; setSearch: (value: string) => void
  filterStatus: string; setFilterStatus: (value: string) => void; addOrder: () => void; advanceOrder: (order: DeliveryOrder) => void
}) {
  const active = allOrders.filter(order => order.status !== 'Entregue')
  const preparing = allOrders.filter(order => order.status === 'Preparando').length
  const onRoute = allOrders.filter(order => order.status === 'Em trajeto').length
  return <>
    <div className="page-heading"><div><div className="eyebrow">SEXTA-FEIRA, 23 DE OUTUBRO DE 2026</div><h1>Seu delivery, em movimento.</h1><p>Acompanhe pedidos, equipe e entregas em um só lugar.</p></div><button className="button button-dark" onClick={addOrder}><Plus size={17} /> Novo pedido</button></div>
    <div className="metric-grid">
      <MetricCard label="Pedidos ativos" value={active.length.toString().padStart(2, '0')} foot="na fila de atendimento" icon={<ShoppingBag size={18} />} change="+12%" positive />
      <MetricCard label="Em preparo" value={preparing.toString().padStart(2, '0')} foot="na cozinha agora" icon={<Clock3 size={18} />} change="+2" />
      <MetricCard label="Em rota" value={onRoute.toString().padStart(2, '0')} foot="com entregadores" icon={<Truck size={18} />} change="No ritmo" />
      <MetricCard label="Vendas hoje" value={currency(allOrders.reduce((sum, order) => sum + order.total, 0))} foot="ticket médio R$ 61,08" icon={<ArrowUpRight size={18} />} change="+8,4%" positive />
    </div>
    <section className="orders-panel">
      <div className="panel-heading"><div><h2>Fila de pedidos <span>{orders.length}</span></h2><p>Atualização em tempo real da sua operação</p></div><div className="panel-controls"><label className="search-field"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar pedido ou cliente" /></label><label className="filter-select"><Filter size={15} /><select value={filterStatus} onChange={event => setFilterStatus(event.target.value)}><option>Todos os pedidos</option>{orderStatuses.map(status => <option key={status}>{status}</option>)}</select><ChevronDown size={14} /></label><button className="icon-button filter-button" aria-label="Opções de filtro"><Settings2 size={17} /></button></div></div>
      <div className="table-scroll"><table className="orders-table"><thead><tr><th>PEDIDO / CLIENTE</th><th>ITENS</th><th>HORÁRIO</th><th>STATUS</th><th>TOTAL</th><th /></tr></thead><tbody>
        {orders.map(order => <tr key={order.id}><td><div className="customer-cell"><span className={`customer-avatar avatar-${order.initials.charCodeAt(0) % 4}`}>{order.initials}</span><span><strong>{order.customer}</strong><small>{order.id} <i>·</i> {order.source}</small></span></div></td><td className="items-cell">{order.items.join(', ')}</td><td><strong className="time-cell">{order.time}</strong><small className="delivery-time">{order.eta === 'Retirada' ? 'Retirada' : order.eta === 'Entregue' ? 'Concluído' : `~ ${order.eta}`}</small></td><td><StatusBadge status={order.status} /></td><td className="total-cell">{currency(order.total)}</td><td><button className="row-action" title="Avançar status do pedido" aria-label={`Avançar status de ${order.id}`} onClick={() => advanceOrder(order)}>{order.status === 'Entregue' ? <CheckCircle2 size={17} /> : <ArrowRight size={17} />}</button></td></tr>)}
      </tbody></table>{orders.length === 0 && <div className="empty-state">Nenhum pedido encontrado com esses filtros.</div>}</div>
      <div className="table-footer"><span>Exibindo <strong>{orders.length}</strong> de <strong>{allOrders.length}</strong> pedidos</span><button onClick={() => setFilterStatus('Todos os pedidos')}>Ver todos <ArrowRight size={14} /></button></div>
    </section>
    <div className="dashboard-lower"><section className="lower-card"><div className="lower-title"><div><h2>Pedidos por etapa</h2><p>Como está o fluxo de hoje</p></div><button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={19} /></button></div><div className="stage-list">{orderStatuses.slice(0, 5).map((status, index) => { const count = allOrders.filter(order => order.status === status).length; return <div className="stage-row" key={status}><span className={`stage-mark stage-${index}`} /><span>{status}</span><div className="stage-track"><i style={{ width: `${Math.max(count * 19, 4)}%` }} /></div><strong>{count.toString().padStart(2, '0')}</strong></div> })}</div><div className="stage-foot"><span><i /> Atualizado agora</span><span>{allOrders.length} pedidos hoje</span></div></section>
      <section className="lower-card delivery-highlight"><div className="delivery-text"><span className="feature-icon icon-yellow"><Bike size={18} /></span><span className="eyebrow">ENTREGAS EM ROTA</span><h2>Na rua,<br />tudo certo.</h2><p>{onRoute} pedido{onRoute === 1 ? '' : 's'} com entregadores da sua equipe.</p><Link to="/app/team">Ver equipe <ArrowRight size={14} /></Link></div><div className="delivery-illustration"><div className="delivery-circle" /><MapPin className="delivery-pin" size={28} /><Bike className="delivery-bike" size={34} /></div></section></div>
  </>
}

function MetricCard({ label, value, foot, icon, change, positive = false }: { label: string; value: string; foot: string; icon: ReactNode; change: string; positive?: boolean }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong className="metric-value">{value}</strong><div className="metric-foot"><span>{foot}</span><span className={`metric-change ${positive ? 'positive' : ''}`}>{positive && <ArrowUpRight size={12} />}{change}</span></div></article>
}

function TeamView({ team, invite, remove }: { team: TeamMember[]; invite: () => void; remove: (email: string) => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">PESSOAS QUE FAZEM ACONTECER</div><h1>Equipe da loja</h1><p>Convide seu time e organize o acesso de cada pessoa.</p></div><button className="button button-dark" onClick={invite}><Plus size={17} /> Convidar pessoa</button></div><div className="metric-grid team-summary"><MetricCard label="Pessoas na equipe" value={`${team.length}`.padStart(2, '0')} foot="nesta loja" icon={<Users size={18} />} change="Ativa" /><MetricCard label="Convites pendentes" value={`${team.filter(item => item.status === 'Convite enviado').length}`.padStart(2, '0')} foot="aguardando aceite" icon={<Clock3 size={18} />} change="Acompanhar" /><MetricCard label="Grupos de acesso" value="04" foot="perfis configurados" icon={<ShieldCheck size={18} />} change="Organizado" /></div><section className="orders-panel"><div className="panel-heading"><div><h2>Membros <span>{team.length}</span></h2><p>Gerencie as pessoas com acesso à Oliva Cozinha</p></div><label className="search-field"><Search size={16} /><input placeholder="Buscar pessoa" /></label></div><div className="table-scroll"><table className="orders-table team-table"><thead><tr><th>PESSOA</th><th>GRUPO DE ACESSO</th><th>STATUS</th><th /></tr></thead><tbody>{team.map(person => <tr key={person.email}><td><div className="customer-cell"><span className="customer-avatar avatar-1">{person.initials}</span><span><strong>{person.name}</strong><small>{person.email}</small></span></div></td><td><span className="role-pill"><ShieldCheck size={13} />{person.role}</span></td><td><span className={`member-status ${person.status === 'Ativo' ? 'member-active' : ''}`}><i />{person.status}</span></td><td><button className="row-action" aria-label={`Remover ${person.name}`} onClick={() => remove(person.email)}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div></section><div className="info-banner"><ShieldCheck size={18} /><span><strong>Acesso seguro, loja por loja.</strong> Cada pessoa vê apenas os dados das lojas às quais foi adicionada.</span><Link to="/app/groups">Configurar permissões <ArrowRight size={14} /></Link></div></>
}

function GroupsView({ groups, addGroup, remove }: { groups: PermissionGroup[]; addGroup: () => void; remove: (name: string) => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">ACESSO DO JEITO CERTO</div><h1>Grupos & permissões</h1><p>Defina o que cada perfil pode visualizar e fazer.</p></div><button className="button button-dark" onClick={addGroup}><Plus size={17} /> Novo grupo</button></div><div className="permission-callout"><div className="permission-callout-icon"><LockKeyhole size={20} /></div><div><strong>Permissões vinculadas à loja</strong><p>Os grupos organizam o acesso da equipe. Administradores da plataforma podem gerenciar todas as lojas.</p></div><span className="callout-tag"><ShieldCheck size={14} /> HBAC ativo</span></div><div className="group-grid">{groups.map((group, index) => <article className="group-card" key={group.name}><div className="group-card-top"><span className={`group-icon group-icon-${index % 4}`}><Shield size={18} /></span>{group.isSystem ? <span className="system-group-label">Grupo padrão</span> : <button className="row-action" aria-label={`Excluir grupo ${group.name}`} onClick={() => remove(group.name)}><MoreHorizontal size={18} /></button>}</div><h2>{group.name}</h2><p>{group.description}</p><div className="group-members"><Users size={15} /> {group.members} pessoas</div><div className="group-permissions">{group.permissions.map(permission => <span key={permission}><Check size={12} />{permission}</span>)}</div><button className="group-edit" onClick={() => window.alert(`Configuração visual de permissões: ${group.name}`)}>Editar permissões <ArrowRight size={14} /></button></article>)}</div></>
}

function AuditView() {
  return <><div className="page-heading"><div><div className="eyebrow">TRANSPARÊNCIA EM CADA AÇÃO</div><h1>Histórico da operação</h1><p>Saiba o que mudou, quem fez e quando aconteceu.</p></div><button className="button button-outline"><ArrowDown size={16} /> Exportar histórico</button></div><section className="orders-panel"><div className="panel-heading"><div><h2>Atividade recente</h2><p>Ações registradas na loja Oliva Cozinha</p></div><label className="filter-select"><Filter size={15} /><span>Últimas 24 horas</span><ChevronDown size={14} /></label></div><div className="audit-list">{auditEvents.map((event, index) => <div className="audit-row" key={event.action}><span className={`audit-avatar audit-${event.tone}`}>{event.initials}</span><div className="audit-content"><strong>{event.action}</strong><span>{event.detail}</span><small>{event.actor}</small></div><time>{event.time}</time>{index === 0 && <span className="audit-new">AGORA</span>}</div>)}</div><div className="table-footer"><span>Exibindo <strong>4</strong> atividades recentes</span><button>Ver todos os registros <ArrowRight size={14} /></button></div></section><div className="info-banner"><ShieldCheck size={18} /><span><strong>Registro completo e protegido.</strong> A trilha de auditoria real é imutável e registra alterações de dados, acesso e integrações.</span></div></>
}

function ApiView({ copied, copyKey }: { copied: boolean; copyKey: () => void }) {
  return <><div className="page-heading"><div><div className="eyebrow">INTEGRE SEUS CANAIS</div><h1>API & integrações</h1><p>Conecte o atendimento da loja à fila de delivery.</p></div><button className="button button-dark" onClick={() => window.alert('No sistema real, uma credencial é gerada uma única vez e armazenada como hash.')}><Plus size={17} /> Criar chave de API</button></div><div className="integration-grid"><section className="integration-card webhook-card"><div className="integration-heading"><span className="integration-icon whatsapp-icon"><MessageCircle size={20} /></span><span className="connected-pill"><i /> CONECTADO</span></div><h2>Pedidos pelo WhatsApp</h2><p>Envie novos pedidos do seu sistema de atendimento diretamente para a fila de delivery.</p><label>ENDPOINT DO WEBHOOK</label><div className="code-copy"><code>POST /api/v1/integrations/whatsapp/orders</code><button onClick={copyKey} aria-label="Copiar URL do webhook">{copied ? <Check size={15} /> : <Copy size={15} />}</button></div><div className="integration-footer"><span><CheckCircle2 size={15} /> Último evento recebido hoje, 12:42</span><button>Configurar <ArrowRight size={14} /></button></div></section><section className="integration-card api-doc-card"><div className="integration-heading"><span className="integration-icon docs-icon"><Code2 size={20} /></span><span className="doc-version">REST API · v1</span></div><h2>Pronta para conectar</h2><p>Autenticação por token, isolamento por loja e permissões por recurso.</p><div className="api-feature"><CheckCircle2 size={15} /> OAuth2 + credenciais por integração</div><div className="api-feature"><CheckCircle2 size={15} /> Eventos de status e trilha de auditoria</div><div className="api-feature"><CheckCircle2 size={15} /> Documentação OpenAPI interativa</div><button className="group-edit" onClick={() => window.open('http://localhost:8000/docs', '_blank')}>Abrir documentação <ArrowUpRight size={14} /></button></section></div><section className="orders-panel api-keys-panel"><div className="panel-heading"><div><h2>Chaves de API <span>0</span></h2><p>Chaves serão exibidas apenas no momento da criação.</p></div></div><div className="empty-state">Nenhuma chave criada. Gere uma credencial para conectar um canal autorizado.</div></section><div className="info-banner"><LockKeyhole size={18} /><span><strong>Nunca compartilhe uma chave em código público.</strong> As credenciais devem ter escopos mínimos e podem ser revogadas a qualquer momento.</span></div></>
}

function PublicTracking() {
  const [code, setCode] = useState('')
  const [order, setOrder] = useState<DeliveryOrder | null>(null)
  const [searched, setSearched] = useState(false)
  const searchOrder = (event: FormEvent) => {
    event.preventDefault()
    const localOrders = JSON.parse(localStorage.getItem('olivelas-orders') || 'null') as DeliveryOrder[] | null
    const found = [...(localOrders ?? []), ...initialOrders].find(item => item.trackingCode.toLowerCase() === code.trim().toLowerCase() || item.id.replace('#', '') === code.trim().replace('#', ''))
    setOrder(found ?? null)
    setSearched(true)
  }
  const statusIndex = order ? orderStatuses.indexOf(order.status) : 0
  return <main className="tracking-page"><header className="tracking-nav wrap"><Brand /><Link to="/">Voltar ao início <ArrowRight size={14} /></Link></header><section className="tracking-card"><span className="tracking-mark"><Bike size={23} /></span><div className="eyebrow">ACOMPANHAMENTO DO PEDIDO</div><h1>Tá chegando.</h1><p>Digite o código que a loja compartilhou com você.</p><form onSubmit={searchOrder}><div className="tracking-input"><Search size={17} /><input value={code} onChange={event => setCode(event.target.value)} placeholder="Ex.: OLV-2481" required /><button className="button button-dark button-small" type="submit">Acompanhar</button></div></form>
    {searched && (order ? <div className="tracking-result"><div className="tracking-result-head"><div><small>PEDIDO {order.id}</small><strong>{order.customer}</strong></div><StatusBadge status={order.status} /></div><div className="tracking-steps">{orderStatuses.map((status, index) => <div className={`tracking-step ${index <= statusIndex ? 'step-complete' : ''} ${index === statusIndex ? 'step-current' : ''}`} key={status}><span>{index < statusIndex ? <Check size={13} /> : index + 1}</span><div><strong>{status}</strong>{index === statusIndex && <small>{status === 'Entregue' ? 'Pedido entregue. Bom apetite!' : `Atualizado às ${order.time}`}</small>}</div></div>)}</div><div className="tracking-address"><MapPin size={15} /> {order.address}</div></div> : <div className="tracking-not-found"><CircleHelp size={18} /> Não encontramos esse pedido. Confira o código com a loja.</div>)}
    <div className="tracking-help"><MessageCircle size={15} /> Precisa de ajuda? <a href="https://wa.me/" target="_blank" rel="noreferrer">Fale com a loja</a></div></section><footer className="tracking-footer"><span>Olivelas Delivery</span><span>Seu pedido, com carinho do começo ao fim.</span></footer></main>
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('olivelas-demo-user') === 'true')
  const [orders, setOrders] = useSavedState<DeliveryOrder[]>('olivelas-orders', initialOrders)
  const [team, setTeam] = useSavedState<TeamMember[]>('olivelas-team', initialTeam)
  const [groups, setGroups] = useSavedState<PermissionGroup[]>('olivelas-groups', initialGroups)
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<AuthPage onAuthenticated={() => setAuthenticated(true)} />} />
    <Route path="/cadastro" element={<AuthPage register onAuthenticated={() => setAuthenticated(true)} />} />
    <Route path="/tracking" element={<PublicTracking />} />
    <Route path="/app" element={<Navigate to="/app/orders" replace />} />
    <Route path="/app/:section" element={authenticated ? <AppShell orders={orders} setOrders={setOrders} team={team} setTeam={setTeam} groups={groups} setGroups={setGroups} /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
