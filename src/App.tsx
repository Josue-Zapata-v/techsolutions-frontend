import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Banknote,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  PackageCheck,
  PackagePlus,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Truck,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { api, ApiError, type AuthSession, type RegisterPayload } from './api';

type Section = 'dashboard' | 'sales' | 'inventory' | 'customers' | 'team' | 'notifications' | 'onboarding' | 'billing';
type ApiState = 'idle' | 'loading' | 'ready' | 'fallback' | 'error';

type Metric = { label: string; value: string; delta: string; trend: 'up' | 'down'; detail: string };
type SaleRow = { id: string; client: string; date: string; total: string; status: string; method: string };
type ProductRow = { id: string; sku: string; name: string; category: string; stock: number; min: number; value: string; price: number };
type CustomerRow = { id: string; name: string; segment: string; document: string; lastBuy: string; amount: string };
type PurchaseRow = { id: string; supplier: string; date: string; total: string; items: string; notes: string };
type PaymentRow = { date: string; description: string; amount: string; status: string };
type UserRow = { id: string; name: string; email: string; role: string; status: string };
type NotificationRow = { id: string; title: string; body: string; type: string; status: string; date: string };
type ChecklistItem = { id: string; title: string; completed: boolean; description: string };
type AuditRow = { action: string; userId: string; entity: string; date: string };

type AppData = {
  metrics: Metric[];
  trend: number[];
  sales: SaleRow[];
  products: ProductRow[];
  customers: CustomerRow[];
  purchases: PurchaseRow[];
  payments: PaymentRow[];
  users: UserRow[];
  notifications: NotificationRow[];
  checklist: ChecklistItem[];
  auditLog: AuditRow[];
  unreadCount: number;
  planName: string;
  planUsersText: string;
  planUsage: number;
  apiStatus: ApiState;
  apiMessage: string;
};

const fallbackData: AppData = {
  metrics: [
    { label: 'Ventas del mes', value: 'S/ 42,860', delta: '+18.4%', trend: 'up', detail: 'vs. mayo' },
    { label: 'Utilidad estimada', value: 'S/ 13,420', delta: '+9.1%', trend: 'up', detail: '31.3% margen' },
    { label: 'Stock critico', value: '8', delta: '-3', trend: 'down', detail: 'productos por reponer' },
    { label: 'Clientes frecuentes', value: '326', delta: '+24', trend: 'up', detail: 'ultimos 30 dias' },
  ],
  sales: [
    { id: 'V-1048', client: 'Inversiones Quispe SAC', date: '25/06/2026', total: 'S/ 6,608.00', status: 'Pagada', method: 'Transferencia' },
    { id: 'V-1047', client: 'Maria Fernandez', date: '25/06/2026', total: 'S/ 287.92', status: 'Pagada', method: 'Efectivo' },
    { id: 'C-219', client: 'Tech Partners EIRL', date: '24/06/2026', total: 'S/ 1,770.00', status: 'Cotizacion', method: 'Pendiente' },
    { id: 'V-1046', client: 'Boticas Norte', date: '24/06/2026', total: 'S/ 940.50', status: 'Pagada', method: 'Yape' },
  ],
  products: [
    { id: 'demo-product-1', sku: 'ARR-001', name: 'Arroz extra costal 49kg', category: 'Abarrotes', stock: 13, min: 5, value: 'S/ 2,730', price: 210 },
    { id: 'demo-product-2', sku: 'ACE-001', name: 'Aceite vegetal 1L', category: 'Abarrotes', stock: 2, min: 12, value: 'S/ 180', price: 9.5 },
    { id: 'demo-product-3', sku: 'AZU-001', name: 'Azucar rubia 1kg', category: 'Abarrotes', stock: 50, min: 20, value: 'S/ 180', price: 4.2 },
    { id: 'demo-product-4', sku: 'DET-001', name: 'Detergente bolsa 800g', category: 'Limpieza', stock: 100, min: 20, value: 'S/ 1,200', price: 12.5 },
  ],
  customers: [
    { id: 'demo-customer-1', name: 'Bodega San Martin', segment: 'Frecuente', document: 'RUC 20123456789', lastBuy: 'Hoy', amount: 'S/ 1,240' },
    { id: 'demo-customer-2', name: 'Maria Fernandez', segment: 'Credito', document: 'DNI 45678901', lastBuy: 'Hoy', amount: 'S/ 287.92' },
    { id: 'demo-customer-3', name: 'Minimarket El Sol', segment: 'Mayorista', document: 'RUC 20987654321', lastBuy: 'Pendiente', amount: 'S/ 1,770' },
  ],
  purchases: [
    { id: 'purchase-1', supplier: 'Distribuidora Lima Sur', date: '25/06/2026', total: 'S/ 1,180.00', items: 'Aceite vegetal 1L', notes: 'Reposicion semanal' },
    { id: 'purchase-2', supplier: 'Mayorista Central', date: '24/06/2026', total: 'S/ 2,730.00', items: 'Arroz extra costal 49kg', notes: 'Compra para almacen' },
  ],
  payments: [
    { date: '25/06/2026', description: 'Renovacion Business', amount: 'S/ 99.00', status: 'Registrado' },
    { date: '25/05/2026', description: 'Renovacion Business', amount: 'S/ 99.00', status: 'Simulado' },
  ],
  users: [
    { id: 'u-demo-1', name: 'Yordy Vargas', email: 'admin@empresa.pe', role: 'ADMIN', status: 'Activo' },
  ],
  notifications: [
    { id: 'n-demo-1', title: 'Stock bajo', body: 'Aceite vegetal 1L esta bajo el minimo.', type: 'LOW_STOCK', status: 'No leida', date: '25/06/2026' },
  ],
  checklist: [
    { id: 'verify_email', title: 'Verificar correo', completed: false, description: 'Confirma tu correo para recibir alertas.' },
    { id: 'create_product', title: 'Registrar producto', completed: true, description: 'Agrega tu primer producto al inventario.' },
    { id: 'create_sale', title: 'Crear venta', completed: true, description: 'Registra una venta confirmada.' },
  ],
  auditLog: [
    { action: 'sale.create', userId: 'u-demo-1', entity: 'Sale', date: '25/06/2026' },
  ],
  unreadCount: 1,
  trend: [42, 55, 48, 73, 68, 88, 96, 83, 118, 126, 121, 142],
  planName: 'Business',
  planUsersText: '8 de 10 usuarios activos',
  planUsage: 80,
  apiStatus: 'idle',
  apiMessage: 'Listo para trabajar',
};

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales' as const, label: 'Ventas', icon: ShoppingCart },
  { id: 'inventory' as const, label: 'Inventario', icon: Boxes },
  { id: 'customers' as const, label: 'Clientes', icon: Users },
  { id: 'team' as const, label: 'Equipo', icon: ShieldCheck },
  { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
  { id: 'onboarding' as const, label: 'Primeros pasos', icon: ClipboardList },
  { id: 'billing' as const, label: 'Plan', icon: WalletCards },
];

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AppData>({ ...fallbackData, apiStatus: session ? 'loading' : 'idle', apiMessage: session ? 'Preparando informacion' : 'Sin sesion' });
  const [toast, setToast] = useState('');

  const title = useMemo(() => navItems.find((item) => item.id === section)?.label ?? 'Dashboard', [section]);

  useEffect(() => {
    if (!session) return;
    void loadApiData(session, setData);
  }, [session]);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('techsolutions.session');
      setSession(null);
      setData({ ...fallbackData, apiStatus: 'idle', apiMessage: 'Sin sesion' });
    };
    window.addEventListener('techsolutions:unauthorized', handler);
    return () => window.removeEventListener('techsolutions:unauthorized', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('techsolutions.session');
    setSession(null);
    setData({ ...fallbackData, apiStatus: 'idle', apiMessage: 'Sin sesion' });
  };

  const seedDemo = async () => {
    if (!session) return;
    setToast('Preparando datos iniciales...');
    try {
      const result = await api.seedDemo(session.tokens.accessToken);
      setToast(result.data?.message ?? 'Datos iniciales listos');
      await loadApiData(session, setData);
    } catch (err) {
      setToast(readError(err));
    }
  };

  if (!session) return <AuthScreen onSession={setSession} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark"><Building2 size={21} /></div>
          <div><strong>TechSolutions</strong><span>Gestion comercial</span></div>
        </div>

        <nav className="side-nav" aria-label="Navegacion principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => { setSection(item.id); setSidebarOpen(false); }}>
                <Icon size={19} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="plan-panel">
          <div className="plan-icon"><ShieldCheck size={18} /></div>
          <strong>{data.planName}</strong>
          <span>{data.planUsersText}</span>
          <div className="usage-bar"><span style={{ width: `${data.planUsage}%` }} /></div>
        </div>

        <button className="sidebar-footer" onClick={logout}><LogOut size={18} />Salir</button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
          <div>
            <p className="eyebrow">{session.tenant.name}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <StatusPill state={data.apiStatus} text={data.apiMessage} />
            <label className="search-box"><Search size={17} /><input placeholder="Buscar venta, producto o cliente" /></label>
            <button className="icon-button" aria-label="Notificaciones" onClick={() => setSection('notifications')}><Bell size={19} />{data.unreadCount > 0 && <span className="dot" />}</button>
            <button className="user-menu" onClick={() => setSection('team')}>{initials(session.user.firstName, session.user.lastName)} <ChevronDown size={16} /></button>
          </div>
        </header>

        {toast && <div className="toast"><Database size={17} />{toast}<button onClick={() => setToast('')}>Cerrar</button></div>}
        {data.apiStatus === 'fallback' && <EmptyBusinessNotice onSeedDemo={seedDemo} />}

        {section === 'dashboard' && <Dashboard data={data} onSeedDemo={seedDemo} onGoSales={() => setSection('sales')} />}
        {section === 'sales' && <Sales sales={data.sales} products={data.products} customers={data.customers} session={session} onToast={setToast} onReload={() => loadApiData(session, setData)} />}
        {section === 'inventory' && <Inventory products={data.products} purchases={data.purchases} session={session} onToast={setToast} onReload={() => loadApiData(session, setData)} />}
        {section === 'customers' && <Customers customers={data.customers} session={session} onToast={setToast} onReload={() => loadApiData(session, setData)} />}
        {section === 'team' && <Team users={data.users} auditLog={data.auditLog} session={session} onToast={setToast} onReload={() => loadApiData(session, setData)} />}
        {section === 'notifications' && <Notifications notifications={data.notifications} unreadCount={data.unreadCount} session={session} onToast={setToast} onReload={() => loadApiData(session, setData)} />}
        {section === 'onboarding' && <Onboarding checklist={data.checklist} onSeedDemo={seedDemo} />}
        {section === 'billing' && <Billing data={data} session={session} onToast={setToast} onReload={() => loadApiData(session, setData)} />}
      </main>
    </div>
  );
}


function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const problems = [
    { tone: 'amber', icon: <ClockIcon />, title: 'Cuadrar caja te quita horas', text: 'Ventas en efectivo, Yape, Plin y fiados se mezclan entre cuadernos, tickets y mensajes.' },
    { tone: 'coral', icon: <AlertTriangle size={22} />, title: 'Compras sin control de stock', text: 'Se agota lo que mas rota o compras de mas sin saber cuanto capital quedo parado.' },
    { tone: 'blue', icon: <Banknote size={22} />, title: 'Clientes que quedan debiendo', text: 'Sabes que vendiste, pero no siempre quien debe, cuanto debe y desde cuando.' },
  ];
  const modules = [
    { tone: 'emerald', icon: <ShoppingCart size={24} />, title: 'Ventas rapidas', text: 'Contado, transferencia, tarjeta, Yape, Plin y ventas pendientes en segundos.', metric: 'menos doble registro' },
    { tone: 'blue', icon: <Boxes size={24} />, title: 'Inventario vivo', text: 'Stock, costo, precio, minimo y valorizacion por producto para tienda o almacen.', metric: 'alertas de reposicion' },
    { tone: 'amber', icon: <Truck size={24} />, title: 'Proveedores', text: 'Registra compras, proveedor, costo unitario y entrada automatica de mercaderia.', metric: 'compras ordenadas' },
    { tone: 'coral', icon: <Users size={24} />, title: 'Clientes y deuda', text: 'Historial por cliente, documentos, contactos y seguimiento de cuentas pendientes.', metric: 'cartera visible' },
    { tone: 'violet', icon: <TrendingUp size={24} />, title: 'Reportes claros', text: 'Ventas, utilidad estimada, productos criticos y movimiento del negocio sin Excel.', metric: 'decision diaria' },
    { tone: 'slate', icon: <ShieldCheck size={24} />, title: 'Equipo con permisos', text: 'Roles para caja, ventas, almacen y administracion sin exponer toda la informacion.', metric: 'control por usuario' },
  ];
  const services = [
    ['Implementacion guiada', 'Te ayudamos a configurar productos, usuarios y flujo inicial.'],
    ['Migracion ordenada', 'Puedes empezar con tus productos principales y crecer por etapas.'],
    ['Acompanamiento operativo', 'Pensado para personal no tecnico: vender, cobrar y reponer sin complicarse.'],
  ];
  const industries = ['Bodegas', 'Minimarkets', 'Ferreterias', 'Tiendas de ropa', 'Distribuidoras', 'Negocios familiares'];
  const plans = [
    { name: 'Free', price: 'S/ 0', detail: '1 usuario � ventas e inventario basico', cta: 'Empezar', featured: false },
    { name: 'Starter', price: 'S/ 49', detail: 'Hasta 3 usuarios � ventas, clientes y compras', cta: 'Elegir Starter', featured: false },
    { name: 'Business', price: 'S/ 99', detail: 'Hasta 10 usuarios � reportes y permisos completos', cta: 'Elegir Business', featured: true },
    { name: 'Enterprise', price: 'A consultar', detail: 'Usuarios avanzados � acompanamiento e integraciones', cta: 'Hablar con ventas', featured: false },
  ];
  return (
    <main className="landing-page premium-home">
      <h2 className="sr-only">Pagina de inicio de TechSolutions con servicios, modulos, sectores y planes para pymes peruanas</h2>
      <header className="landing-nav pro-nav">
        <a className="landing-brand" href="#inicio" aria-label="TechSolutions inicio"><span><Building2 size={20} /></span><strong>techsolutions</strong></a>
        <nav aria-label="Navegacion publica"><a href="#producto">Producto</a><a href="#servicios">Servicios</a><a href="#precios">Precios</a><a href="#preguntas">Preguntas</a></nav>
        <div className="landing-actions"><button className="ghost-button" onClick={onLogin}>Iniciar sesion</button><button onClick={onRegister}>Empieza gratis</button></div>
      </header>
      <section className="landing-hero pro-hero" id="inicio">
        <div className="hero-copy"><span className="hero-badge"><Sparkles size={15} /> Gestion comercial para negocios que venden todos los dias</span><h1>Ventas, stock, caja y clientes con el orden que tu negocio ya merece.</h1><p>TechSolutions ayuda a bodegas, minimarkets, tiendas y distribuidoras a vender, cobrar, comprar a proveedores y saber que esta pasando sin depender de cuadernos o archivos sueltos.</p><div className="hero-actions"><button onClick={onRegister}>Crear cuenta gratis</button><a href="#producto">Ver el producto</a></div><div className="hero-proof"><span>Plan gratuito disponible</span><span>Ventas al credito</span><span>Compras a proveedores</span></div></div>
        <div className="hero-showcase"><figure className="hero-visual hero-photo"><img src="/homepage/hero-business.png" alt="Negocio peruano revisando ventas e inventario con TechSolutions" /></figure><div className="hero-dashboard-card"><div><span>Hoy en caja</span><strong>S/ 1,248.50</strong></div><div className="mini-bars"><span /><span /><span /><span /><span /></div><ul><li><Check size={15} /> 18 ventas pagadas</li><li><AlertTriangle size={15} /> 7 productos por reponer</li><li><Banknote size={15} /> S/ 287.92 pendiente</li></ul></div></div>
      </section>
      <section className="trust-strip" aria-label="Sectores que pueden usar TechSolutions">{industries.map((item) => <span key={item}>{item}</span>)}</section>
      <section className="landing-section compact elevated-section"><div className="section-heading centered"><span>Problemas frecuentes</span><h2>El negocio crece, pero el control se queda en cuadernos</h2></div><div className="problem-grid rich-grid">{problems.map((item) => <article className={'rich-card ' + item.tone} key={item.title}><div className="landing-icon muted">{item.icon}</div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
      <section className="landing-section split product-story" id="producto"><div className="section-heading"><span>Producto</span><h2>Una cabina de control para tu tienda, almacen y caja</h2><p>La pantalla principal te muestra ventas, stock critico, compras y clientes pendientes de cobro. Cada modulo esta pensado para operaciones reales de pymes peruanas.</p><div className="service-pills"><span><Smartphone size={16} /> Celular o computadora</span><span><PackageCheck size={16} /> Stock actualizado</span><span><Banknote size={16} /> Caja y deuda</span></div></div><div className="product-composition"><img src="/homepage/modules-isometric.png" alt="Modulos de ventas inventario clientes proveedores y reportes" /><div className="product-preview raised-preview" aria-label="Vista resumida del sistema"><div className="preview-top"><span>Ventas del mes</span><strong>S/ 42,860</strong></div><div className="preview-row"><span>Utilidad estimada</span><strong>S/ 13,420</strong></div><div className="preview-row warning"><span>Stock critico</span><strong>8 productos</strong></div><div className="preview-table"><span>Arroz extra 49kg</span><span>13 und.</span><span>Aceite 1L</span><span>2 und.</span><span>Detergente 800g</span><span>100 und.</span></div></div></div></section>
      <section className="landing-section operations-section"><figure><img src="/homepage/operations-card.png" alt="Caja productos y control de inventario para pyme peruana" /></figure><div className="section-heading"><span>Operacion diaria</span><h2>Lo que pasa en mostrador, almacen y proveedores queda conectado</h2><p>Cada venta descuenta stock. Cada compra a proveedor actualiza mercaderia. Cada cliente queda registrado para saber si compro, pago o tiene saldo pendiente.</p><div className="ops-metrics"><span><strong>3</strong> pasos para vender</span><span><strong>1</strong> inventario central</span><span><strong>0</strong> archivos duplicados</span></div></div></section>
      <section className="landing-section" id="servicios"><div className="section-heading centered"><span>Servicios incluidos</span><h2>Mas que pantallas: un flujo completo para vender y controlar</h2></div><div className="module-grid premium-modules">{modules.map((item) => <article className={'module-card ' + item.tone} key={item.title}><div className="module-top"><div className="landing-icon">{item.icon}</div><span>{item.metric}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
      <section className="landing-section services-band"><div className="section-heading"><span>Acompanamiento</span><h2>No vendemos solo software: ayudamos a ordenar la operacion</h2></div><div className="service-cards">{services.map(([title, text], index) => <article key={title}><strong>{String(index + 1).padStart(2, '0')}</strong><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="landing-section process-section"><div className="section-heading centered"><span>Como empieza</span><h2>De tu operacion actual a una gestion ordenada</h2></div><div className="process-grid pro-process"><article><strong>1</strong><h3>Registra tu empresa</h3><p>Crea tu cuenta, agrega usuarios y define quienes venden o administran inventario.</p></article><article><strong>2</strong><h3>Carga productos y clientes</h3><p>Empieza con tus productos principales, precios, costos, stock minimo y clientes frecuentes.</p></article><article><strong>3</strong><h3>Vende y repone con control</h3><p>Cada venta descuenta stock y cada compra a proveedor actualiza la mercaderia disponible.</p></article></div></section>
      <section className="landing-section pricing-section" id="precios"><div className="section-heading centered"><span>Planes</span><h2>Planes para cada etapa de tu negocio</h2><p>Empieza pequeno y sube de plan cuando necesites mas usuarios, permisos o reportes.</p></div><div className="pricing-grid premium-pricing">{plans.map((plan) => <article className={plan.featured ? 'featured' : ''} key={plan.name}>{plan.featured && <span className="popular">Mas popular</span>}<h3>{plan.name}</h3><strong>{plan.price}</strong><p>{plan.detail}</p><button onClick={onRegister}>{plan.cta}</button></article>)}</div></section>
      <section className="landing-section split faq" id="preguntas"><div className="section-heading"><span>Preguntas</span><h2>Claro para empezar sin vueltas</h2><p>No necesitas instalar servidores ni contratar personal tecnico para comenzar.</p></div><div className="faq-list"><article><h3>�Sirve para una bodega o minimarket?</h3><p>Si. El flujo esta pensado para ventas rapidas, stock, proveedores y clientes que a veces pagan despues.</p></article><article><h3>�Puedo usarlo con mi equipo?</h3><p>Si. Puedes separar administradores, vendedores y almacen para que cada persona vea lo que corresponde.</p></article><article><h3>�El plan gratis tiene limite?</h3><p>El plan Free permite empezar con lo esencial. Cuando el negocio crece, puedes pasar a Starter o Business.</p></article></div></section>
      <section className="landing-cta pro-cta"><h2>Ordena ventas, stock y caja con una herramienta que entiende tu negocio.</h2><p>Registra tu empresa y prueba el flujo completo con productos, clientes, compras y caja.</p><button onClick={onRegister}>Crear cuenta gratis</button></section>
      <footer className="landing-footer"><strong>techsolutions</strong><span>Producto � Servicios � Precios � Recursos � Legal</span><small>� 2026 TechSolutions. Gestion comercial para pymes peruanas.</small></footer>
    </main>
  );
}

function ClockIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function AuthScreen({ onSession }: { onSession: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openAuth = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setShowAuth(true);
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const session = mode === 'login'
        ? await api.login({ email: value(form, 'email'), password: value(form, 'password') })
        : await api.register({
            companyName: value(form, 'companyName'),
            email: value(form, 'email'),
            password: value(form, 'password'),
            firstName: value(form, 'firstName'),
            lastName: value(form, 'lastName'),
            ruc: optionalValue(form, 'ruc'),
            phone: optionalValue(form, 'phone'),
            planType: value(form, 'planType') as RegisterPayload['planType'],
          });
      localStorage.setItem('techsolutions.session', JSON.stringify(session));
      onSession(session);
    } catch (err) {
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!showAuth) return <LandingPage onLogin={() => openAuth('login')} onRegister={() => openAuth('register')} />;

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <button className="back-home" onClick={() => setShowAuth(false)}>Volver al inicio</button>
        <div className="brand-block dark"><div className="brand-mark"><Building2 size={22} /></div><div><strong>TechSolutions</strong><span>Ventas, stock y caja</span></div></div>
        <h1>{mode === 'login' ? 'Ingresa a tu panel de gestion.' : 'Crea tu cuenta y empieza a ordenar tu negocio.'}</h1>
        <p>Controla ventas, productos, clientes, caja y cuentas pendientes desde una sola herramienta pensada para negocios peruanos.</p>
        <div className="auth-proof"><ShieldCheck size={18} />Roles, permisos y control por empresa.</div>
      </section>
      <section className="auth-card">
        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Ingresar</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Registrar</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'register' && <>
            <label>Empresa<input name="companyName" placeholder="Comercial Rivera SAC" required minLength={2} /></label>
            <div className="form-grid"><label>Nombres<input name="firstName" placeholder="Yordy" required /></label><label>Apellidos<input name="lastName" placeholder="Vargas" required /></label></div>
            <div className="form-grid"><label>RUC<input name="ruc" placeholder="20123456789" minLength={11} maxLength={11} /></label><label>Plan<select name="planType" defaultValue="FREE"><option value="FREE">Free</option><option value="STARTER">Starter</option><option value="BUSINESS">Business</option></select></label></div>
            <label>Telefono<input name="phone" placeholder="987654321" /></label>
          </>}
          <label>Correo<input name="email" type="email" placeholder="admin@empresa.pe" required /></label>
          <label>Contrasena<input name="password" type="password" placeholder="Minimo 8 caracteres" required minLength={mode === 'register' ? 8 : 1} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="auth-submit" disabled={loading}>{loading ? <Loader2 className="spin" size={18} /> : null}{mode === 'login' ? 'Entrar al sistema' : 'Crear empresa'}</button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ data, onSeedDemo, onGoSales }: { data: AppData; onSeedDemo: () => void; onGoSales: () => void }) {
  return (
    <div className="page-grid dashboard-grid">
      <section className="welcome-band">
        <div><p className="eyebrow">Resumen operativo</p><h2>Ventas, stock y clientes bajo control desde el primer vistazo.</h2><p>Revisa el movimiento del dia, productos por reponer, clientes frecuentes y ventas pendientes de cobro.</p></div>
        <div className="quick-actions"><button onClick={onGoSales}><Plus size={18} />Nueva venta</button><button className="secondary" onClick={onSeedDemo}><PackagePlus size={18} />Datos iniciales</button></div>
      </section>

      <section className="metrics-grid">{data.metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}</section>

      <section className="panel chart-panel"><PanelHeader icon={<BarChart3 size={18} />} title="Tendencia de ventas" action="Ultimos 12 dias" /><div className="bar-chart" aria-label="Grafico de ventas por dia">{data.trend.map((value, index) => <span key={index} style={{ height: `${Math.max(value, 18)}px` }} />)}</div></section>
      <section className="panel"><PanelHeader icon={<ClipboardList size={18} />} title="Prioridades" action="Esta semana" /><div className="task-list"><Task title="Revisar productos bajo minimo" meta={`${data.products.filter((p) => p.stock <= p.min).length} productos requieren atencion`} tone="warning" /><Task title="Revisar ventas al credito" meta={`${data.sales.filter((s) => s.status.toLowerCase().includes('cot')).length} operaciones pendientes de cierre`} tone="accent" /><Task title="Confirmar reposicion" meta="Coordina compras con tus proveedores principales" tone="normal" /></div></section>
      <section className="panel wide"><PanelHeader icon={<ReceiptText size={18} />} title="Ventas recientes" action="Ver historial" /><DataTable columns={['Codigo', 'Cliente', 'Fecha', 'Total', 'Estado']} rows={data.sales.map((sale) => [sale.id, sale.client, sale.date, sale.total, sale.status])} /></section>
    </div>
  );
}

function Sales({ sales, products, customers, session, onToast, onReload }: { sales: SaleRow[]; products: ProductRow[]; customers: CustomerRow[]; session: AuthSession; onToast: (message: string) => void; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const productId = value(form, 'productId');
    const product = products.find((item) => item.id === productId);
    const quantity = Number(value(form, 'quantity')) || 1;
    const unitPrice = Number(value(form, 'unitPrice')) || product?.price || 1;
    const subtotal = quantity * unitPrice;
    const total = Math.round(subtotal * 1.18 * 100) / 100;
    try {
      await api.createSale(session.tokens.accessToken, {
        customerId: optionalValue(form, 'customerId'),
        items: [{ productId, quantity, unitPrice, discount: 0 }],
        payments: [{ method: value(form, 'method') as 'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER' | 'OTHER', amount: total }],
        notes: optionalValue(form, 'notes'),
        isDraft: form.get('isDraft') === 'on',
      });
      onToast('Venta registrada correctamente');
      setOpen(false);
      onReload();
    } catch (err) { onToast(readError(err)); }
  };
  return <PageSection kicker="Caja y ventas" title="Ventas y credito" description="Registra ventas al contado, transferencias, Yape, Plin y operaciones pendientes de cobro." actions={<><button onClick={() => setOpen(true)}><Plus size={18} />Nueva venta</button><button className="secondary" onClick={() => downloadCsv('ventas.csv', ['Codigo', 'Cliente', 'Metodo', 'Fecha', 'Total', 'Estado'], sales.map((sale) => [sale.id, sale.client, sale.method, sale.date, sale.total, sale.status]))}><Download size={18} />Exportar</button></>}><Toolbar /><DataTable columns={['Codigo', 'Cliente', 'Metodo', 'Fecha', 'Total', 'Estado']} rows={sales.map((sale) => [sale.id, sale.client, sale.method, sale.date, sale.total, sale.status])} />{open && <Modal title="Nueva venta" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={create}><label>Producto<select name="productId" required>{products.map((item) => <option key={item.id} value={item.id}>{item.name} - {money(item.price)}</option>)}</select></label><label>Cliente<select name="customerId"><option value="">Cliente general</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="form-grid"><label>Cantidad<input name="quantity" type="number" min="1" defaultValue="1" required /></label><label>Precio sin IGV<input name="unitPrice" type="number" min="0.01" step="0.01" placeholder="Usa precio producto" /></label></div><label>Metodo de pago<select name="method" defaultValue="CASH"><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="YAPE">Yape</option><option value="PLIN">Plin</option><option value="TRANSFER">Transferencia</option></select></label><label>Notas<input name="notes" placeholder="Opcional" /></label><label className="check-row"><input name="isDraft" type="checkbox" />Dejar como venta pendiente</label><button className="auth-submit">Guardar venta</button></form></Modal>}</PageSection>;
}

function Inventory({ products, purchases, session, onToast, onReload }: { products: ProductRow[]; purchases: PurchaseRow[]; session: AuthSession; onToast: (message: string) => void; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const totalValue = products.reduce((sum, item) => sum + parseMoney(item.value), 0);
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.createProduct(session.tokens.accessToken, { name: value(form, 'name'), sku: optionalValue(form, 'sku'), price: Number(value(form, 'price')), cost: Number(value(form, 'cost')) || undefined, stock: Number(value(form, 'stock')) || 0, minStock: Number(value(form, 'minStock')) || 0, unit: value(form, 'unit') || 'unidad' });
      onToast('Producto creado correctamente');
      setOpen(false);
      onReload();
    } catch (err) { onToast(readError(err)); }
  };
  const registerPurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.createPurchase(session.tokens.accessToken, {
        supplierName: optionalValue(form, 'supplierName'),
        notes: optionalValue(form, 'notes'),
        items: [{ productId: value(form, 'productId'), quantity: Number(value(form, 'quantity')) || 1, unitCost: Number(value(form, 'unitCost')) || 1 }],
      });
      onToast('Compra registrada y stock actualizado');
      setPurchaseOpen(false);
      onReload();
    } catch (err) { onToast(readError(err)); }
  };
  return <PageSection kicker="Control de stock" title="Inventario" description="Administra productos, precios, costos, stock minimo y reposicion para tienda o almacen." actions={<><button onClick={() => setOpen(true)}><PackagePlus size={18} />Nuevo producto</button><button className="secondary" onClick={() => setPurchaseOpen(true)}><Plus size={18} />Compra</button><button className="secondary" onClick={() => downloadCsv('valorizacion-inventario.csv', ['SKU', 'Producto', 'Categoria', 'Stock', 'Minimo', 'Valor'], products.map((item) => [item.sku, item.name, item.category, String(item.stock), String(item.min), item.value]))}><FileText size={18} />Valorizacion</button></>}><div className="split-summary"><Summary icon={<Boxes size={20} />} label="Productos activos" value={String(products.length)} /><Summary icon={<Sparkles size={20} />} label="Valorizacion" value={money(totalValue)} /><Summary icon={<Bell size={20} />} label="Alertas" value={String(products.filter((p) => p.stock <= p.min).length)} /></div><DataTable columns={['SKU', 'Producto', 'Categoria', 'Stock', 'Minimo', 'Valor']} rows={products.map((item) => [item.sku, item.name, item.category, String(item.stock), String(item.min), item.value])} /><DataTable columns={['Proveedor', 'Fecha', 'Productos', 'Total', 'Notas']} rows={purchases.map((item) => [item.supplier, item.date, item.items, item.total, item.notes])} />{open && <Modal title="Nuevo producto" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={create}><label>Nombre<input name="name" required placeholder="Producto" /></label><div className="form-grid"><label>SKU<input name="sku" placeholder="SKU-001" /></label><label>Unidad<input name="unit" defaultValue="unidad" /></label></div><div className="form-grid"><label>Precio<input name="price" type="number" min="0.01" step="0.01" required /></label><label>Costo<input name="cost" type="number" min="0.01" step="0.01" /></label></div><div className="form-grid"><label>Stock inicial<input name="stock" type="number" min="0" defaultValue="0" /></label><label>Stock minimo<input name="minStock" type="number" min="0" defaultValue="0" /></label></div><button className="auth-submit">Guardar producto</button></form></Modal>}{purchaseOpen && <Modal title="Compra a proveedor" onClose={() => setPurchaseOpen(false)}><form className="modal-form" onSubmit={registerPurchase}><label>Proveedor<input name="supplierName" placeholder="Distribuidora o mayorista" /></label><label>Producto<select name="productId" required>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="form-grid"><label>Cantidad<input name="quantity" type="number" min="1" defaultValue="1" required /></label><label>Costo unitario<input name="unitCost" type="number" min="0.01" step="0.01" required /></label></div><label>Notas<input name="notes" placeholder="Reposicion, factura, guia o condicion de pago" /></label><button className="auth-submit">Registrar compra</button></form></Modal>}</PageSection>;
}

function Customers({ customers, session, onToast, onReload }: { customers: CustomerRow[]; session: AuthSession; onToast: (message: string) => void; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.createCustomer(session.tokens.accessToken, { name: value(form, 'name'), email: optionalValue(form, 'email'), phone: optionalValue(form, 'phone'), document: optionalValue(form, 'document'), documentType: optionalValue(form, 'documentType') as 'DNI' | 'RUC' | 'CE' | 'OTRO' | undefined, address: optionalValue(form, 'address') });
      onToast('Cliente creado correctamente');
      setOpen(false);
      onReload();
    } catch (err) { onToast(readError(err)); }
  };
  return <PageSection kicker="Clientes y cuentas" title="Clientes" description="Ordena clientes frecuentes, documentos, contacto y seguimiento de compras o deudas pendientes." actions={<><button onClick={() => setOpen(true)}><Plus size={18} />Nuevo cliente</button><span className="tool-badge"><Filter size={16} />Tipos de cliente</span></>}><div className="customer-cards">{customers.slice(0, 3).map((customer) => <article className="customer-card" key={customer.name}><div className="avatar">{customer.name.slice(0, 2).toUpperCase()}</div><div><strong>{customer.name}</strong><span>{customer.document}</span></div><span className="badge">{customer.segment}</span><small>{customer.amount}</small></article>)}</div><DataTable columns={['Cliente', 'Tipo', 'Documento', 'Ultima compra', 'Compras / saldo']} rows={customers.map((c) => [c.name, c.segment, c.document, c.lastBuy, c.amount])} />{open && <Modal title="Nuevo cliente" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={create}><label>Nombre<input name="name" required placeholder="Cliente o empresa" /></label><div className="form-grid"><label>Documento<select name="documentType"><option value="">Sin tipo</option><option value="DNI">DNI</option><option value="RUC">RUC</option><option value="CE">CE</option><option value="OTRO">Otro</option></select></label><label>Nro. documento<input name="document" /></label></div><div className="form-grid"><label>Email<input name="email" type="email" /></label><label>Telefono<input name="phone" /></label></div><label>Direccion<input name="address" /></label><button className="auth-submit">Guardar cliente</button></form></Modal>}</PageSection>;
}

function Team({ users, auditLog, session, onToast, onReload }: { users: UserRow[]; auditLog: AuditRow[]; session: AuthSession; onToast: (message: string) => void; onReload: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SELLER' | 'WAREHOUSE'>('SELLER');
  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await api.inviteUser(session.tokens.accessToken, { email, role });
      onToast(result.message);
      setEmail('');
      onReload();
    } catch (err) {
      onToast(readError(err));
    }
  };
  return <PageSection kicker="Usuarios y permisos" title="Equipo" description="Administra al personal que vende, registra productos o revisa la caja." actions={<form className="inline-form" onSubmit={invite}><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="correo@empresa.pe" required /><select value={role} onChange={(event) => setRole(event.target.value as 'ADMIN' | 'SELLER' | 'WAREHOUSE')}><option value="SELLER">Vendedor</option><option value="WAREHOUSE">Almacenero</option><option value="ADMIN">Administrador</option></select><button><Plus size={18} />Invitar</button></form>}><div className="split-summary"><Summary icon={<Users size={20} />} label="Usuarios" value={String(users.length)} /><Summary icon={<ShieldCheck size={20} />} label="Admins" value={String(users.filter((u) => u.role === 'ADMIN').length)} /><Summary icon={<ClipboardList size={20} />} label="Auditoria" value={String(auditLog.length)} /></div><DataTable columns={['Nombre', 'Correo', 'Rol', 'Estado']} rows={users.map((user) => [user.name, user.email, user.role, user.status])} /><DataTable columns={['Accion', 'Usuario', 'Entidad', 'Fecha']} rows={auditLog.map((row) => [row.action, row.userId, row.entity, row.date])} /></PageSection>;
}

function Notifications({ notifications, unreadCount, session, onToast, onReload }: { notifications: NotificationRow[]; unreadCount: number; session: AuthSession; onToast: (message: string) => void; onReload: () => void }) {
  const markAll = async () => {
    try {
      const result = await api.markAllNotificationsRead(session.tokens.accessToken);
      onToast(result.message);
      onReload();
    } catch (err) {
      onToast(readError(err));
    }
  };
  return <PageSection kicker="Centro de avisos" title="Notificaciones" description="Alertas importantes sobre stock, ventas, clientes y actividad del negocio." actions={<button onClick={markAll}><Check size={18} />Marcar leidas</button>}><div className="split-summary"><Summary icon={<Bell size={20} />} label="No leidas" value={String(unreadCount)} /><Summary icon={<Database size={20} />} label="Total" value={String(notifications.length)} /><Summary icon={<ShieldCheck size={20} />} label="Canal" value="In-app" /></div><DataTable columns={['Titulo', 'Tipo', 'Fecha', 'Estado']} rows={notifications.map((item) => [item.title, item.type, item.date, item.status])} /><div className="notification-list">{notifications.map((item) => <article key={item.id} className="notification-item"><strong>{item.title}</strong><span>{item.body}</span></article>)}</div></PageSection>;
}

function Onboarding({ checklist, onSeedDemo }: { checklist: ChecklistItem[]; onSeedDemo: () => void }) {
  const completed = checklist.filter((item) => item.completed).length;
  return <PageSection kicker="Primeros pasos" title="Configurar negocio" description="Completa la informacion basica para empezar a vender y controlar inventario." actions={<button onClick={onSeedDemo}><PackagePlus size={18} />Datos iniciales</button>}><div className="split-summary"><Summary icon={<Check size={20} />} label="Completados" value={completed + '/' + checklist.length} /><Summary icon={<Database size={20} />} label="Estado" value="En marcha" /><Summary icon={<Sparkles size={20} />} label="Ayuda" value="Inicial" /></div><div className="checklist-grid">{checklist.map((item) => <article className="checklist-item" key={item.id}><span className={item.completed ? 'done' : ''}>{item.completed ? <Check size={16} /> : null}</span><div><strong>{item.title}</strong><small>{item.description}</small></div></article>)}</div></PageSection>;
}

function Billing({ data, session, onToast, onReload }: { data: AppData; session: AuthSession; onToast: (message: string) => void; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const change = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const planType = value(form, 'planType') as 'FREE' | 'STARTER' | 'BUSINESS';
    try {
      const result = await api.changePlan(session.tokens.accessToken, { planType, paymentToken: planType === 'FREE' ? undefined : 'mock_frontend_token' });
      onToast(result.message ?? 'Plan actualizado correctamente');
      setOpen(false);
      onReload();
    } catch (err) {
      onToast(readError(err));
    }
  };
  const currentPlan = data.planName.toUpperCase() as 'FREE' | 'STARTER' | 'BUSINESS';
  return <PageSection kicker="Plan y acceso" title="Plan" description="Revisa el plan contratado, usuarios incluidos y pagos registrados del servicio." actions={<button onClick={() => setOpen(true)}><CreditCard size={18} />Cambiar plan</button>}><div className="billing-layout"><article className="current-plan"><span className="badge emerald">Plan actual</span><h3>{data.planName}</h3><p>Acceso organizado segun el plan y los permisos de tu empresa.</p><strong>{data.planName === 'Free' ? 'S/ 0.00' : data.planName === 'Starter' ? 'S/ 49.00' : 'S/ 99.00'} <small>/ mes</small></strong><div className="plan-checks">{['Ventas e inventario', 'Clientes y cuentas', 'Reportes del negocio', 'Pagos y renovaciones'].map((item) => <span key={item}><Check size={16} />{item}</span>)}</div></article><article className="panel payments-panel"><PanelHeader icon={<CircleDollarSign size={18} />} title="Pagos recientes" action="Historial" /><DataTable columns={['Fecha', 'Descripcion', 'Monto', 'Estado']} rows={data.payments.map((p) => [p.date, p.description, p.amount, p.status])} /></article></div>{open && <Modal title="Cambiar plan" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={change}><label>Plan<select name="planType" defaultValue={['FREE', 'STARTER', 'BUSINESS'].includes(currentPlan) ? currentPlan : 'BUSINESS'}><option value="FREE">Free - S/ 0.00</option><option value="STARTER">Starter - S/ 49.00</option><option value="BUSINESS">Business - S/ 99.00</option></select></label><p className="form-help">El cambio de plan quedara registrado para la cuenta de la empresa.</p><button className="auth-submit">Actualizar plan</button></form></Modal>}</PageSection>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation"><section className="modal-panel" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h3>{title}</h3><button onClick={onClose}>Cerrar</button></div>{children}</section></div>;
}

function MetricCard({ metric }: { metric: Metric }) {
  return <article className="metric-card"><span>{metric.label}</span><strong>{metric.value}</strong><small className={metric.trend === 'up' ? 'positive' : 'neutral'}>{metric.trend === 'up' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{metric.delta} {metric.detail}</small></article>;
}

function EmptyBusinessNotice({ onSeedDemo }: { onSeedDemo: () => void }) {
  return <div className="business-notice"><Database size={18} /><div><strong>Cuenta sin informacion suficiente</strong><span>Registra productos, clientes y ventas para ver indicadores propios del negocio.</span></div><button onClick={onSeedDemo}>Datos iniciales</button></div>;
}

function StatusPill({ state, text }: { state: ApiState; text: string }) {
  return <span className={`connection ${state}`}>{state === 'loading' ? <Loader2 className="spin" size={14} /> : <Database size={14} />}{text}</span>;
}

function PageSection({ kicker, title, description, actions, children }: { kicker: string; title: string; description: string; actions: ReactNode; children: ReactNode }) {
  return <section className="module-page"><div className="module-head"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2><p>{description}</p></div><div className="module-actions">{actions}</div></div><div className="module-body">{children}</div></section>;
}
function PanelHeader({ icon, title, action }: { icon: ReactNode; title: string; action: string }) { return <div className="panel-header"><div>{icon}<strong>{title}</strong></div><span className="panel-action">{action}</span></div>; }
function Toolbar() { return <div className="toolbar"><label className="search-box inline"><Search size={17} /><input placeholder="Buscar por cliente o producto" /></label><span className="tool-badge"><Filter size={16} />Filtros</span></div>; }
function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) { return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === row.length - 1 ? <span className="status-pill">{cell}</span> : cell}</td>)}</tr>) : <tr><td colSpan={columns.length}>Sin datos disponibles</td></tr>}</tbody></table></div>; }
function Task({ title, meta, tone }: { title: string; meta: string; tone: 'warning' | 'accent' | 'normal' }) { return <div className={`task ${tone}`}><span /><div><strong>{title}</strong><small>{meta}</small></div></div>; }
function Summary({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <article className="summary-card">{icon}<span>{label}</span><strong>{value}</strong></article>; }

async function loadApiData(session: AuthSession, setData: (data: AppData) => void) {
  const token = session.tokens.accessToken;
  setData({ ...fallbackData, apiStatus: 'loading', apiMessage: 'Actualizando datos' });
  try {
    const [kpis, trend, sales, products, lowStock, customers, purchases, subscription, payments, users, auditLog, notifications, checklist] = await Promise.allSettled([
      api.kpis(token), api.trend(token, 12), api.sales(token), api.products(token), api.lowStock(token), api.customers(token), api.purchases(token), api.subscription(token), api.payments(token), api.users(token), api.auditLog(token), api.notifications(token), api.checklist(token),
    ]);

    const next: AppData = {
      ...fallbackData,
      metrics: mapMetrics(valueOf(kpis), valueOf(lowStock), valueOf(customers)),
      trend: mapTrend(valueOf(trend)),
      sales: mapSales(valueOf(sales)),
      products: mapProducts(valueOf(products)),
      customers: mapCustomers(valueOf(customers)),
      purchases: mapPurchases(valueOf(purchases)),
      payments: mapPayments(valueOf(payments)),
      users: mapUsers(valueOf(users)),
      auditLog: mapAuditLog(valueOf(auditLog)),
      notifications: mapNotifications(valueOf(notifications)),
      checklist: mapChecklist(valueOf(checklist)),
      unreadCount: Number(asRecord(valueOf(notifications)).unreadCount ?? 0),
      planName: mapPlanName(valueOf(subscription), session.tenant.planType),
      planUsersText: session.tenant.planType === 'FREE' ? '1 usuario incluido' : 'Plan activo',
      planUsage: session.tenant.planType === 'FREE' ? 100 : 60,
      apiStatus: 'ready',
      apiMessage: 'Datos actualizados',
    };

    const hasRealRows = next.sales.length || next.products.length || next.customers.length;
    setData(hasRealRows ? next : { ...next, sales: fallbackData.sales, products: fallbackData.products, customers: fallbackData.customers, purchases: fallbackData.purchases, payments: fallbackData.payments, apiStatus: 'fallback', apiMessage: 'Sin registros' });
  } catch (err) {
    setData({ ...fallbackData, apiStatus: 'error', apiMessage: readError(err) });
  }
}

function valueOf<T>(result: PromiseSettledResult<T>): T | undefined { return result.status === 'fulfilled' ? result.value : undefined; }
function readSession(): AuthSession | null { try { const raw = localStorage.getItem('techsolutions.session'); return raw ? JSON.parse(raw) as AuthSession : null; } catch { return null; } }
function readError(err: unknown) { if (err instanceof ApiError) return err.message; if (err instanceof Error) return err.message; return 'No se pudo actualizar la informacion'; }
function value(form: FormData, key: string) { return String(form.get(key) ?? '').trim(); }
function optionalValue(form: FormData, key: string) { const item = value(form, key); return item || undefined; }
function initials(first: string, last: string) { return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'TS'; }
function money(value: number) { return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function parseMoney(value: string) { return Number(value.replace(/[^0-9.]/g, '')) || 0; }
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fmtDate(value: unknown) { const date = value ? new Date(String(value)) : new Date(); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-PE'); }
function fmtStatus(value: unknown) { const map: Record<string, string> = { CONFIRMED: 'Pagada', DRAFT: 'Cotizacion', CANCELLED: 'Anulada', ACTIVE: 'Activa', SUCCEEDED: 'Pagado', FAILED: 'Fallido' }; return map[String(value)] ?? String(value ?? '-'); }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function getArray(source: unknown): unknown[] { const record = asRecord(source); return Array.isArray(record.data) ? record.data : []; }

function mapMetrics(kpis: unknown, lowStock: unknown, customers: unknown): Metric[] {
  const data = asRecord(asRecord(kpis).data ?? kpis);
  const sales = asRecord(data.sales);
  const margin = Number(data.estimatedMargin ?? data.margin ?? 0);
  const low = Number(asRecord(lowStock).count ?? data.lowStockCount ?? 0);
  const customerTotal = Number(asRecord(customers).total ?? data.newCustomers ?? 0);
  return [
    { label: 'Ventas del mes', value: money(Number(sales.total ?? sales.revenue ?? data.salesTotal ?? 0)), delta: '+0%', trend: 'up', detail: 'mes actual' },
    { label: 'Utilidad estimada', value: money(margin), delta: '+0%', trend: 'up', detail: 'calculada' },
    { label: 'Stock critico', value: String(low), delta: low ? 'Atencion' : 'OK', trend: low ? 'down' : 'up', detail: 'productos' },
    { label: 'Clientes frecuentes', value: String(customerTotal), delta: '+0', trend: 'up', detail: 'registrados' },
  ];
}
function mapTrend(source: unknown): number[] { const rows = getArray(source); const values = rows.map((row) => Number(asRecord(row).total ?? asRecord(row).count ?? 0)).filter((n) => Number.isFinite(n)); if (!values.length) return fallbackData.trend; const max = Math.max(...values, 1); return values.map((value) => Math.round((value / max) * 140)); }
function mapSales(source: unknown): SaleRow[] { return getArray(source).map((item) => { const r = asRecord(item); const customer = asRecord(r.customer); return { id: String(r.id ?? '-').slice(0, 8), client: String(customer.name ?? 'Cliente general'), date: fmtDate(r.createdAt), total: money(Number(r.total ?? 0)), status: fmtStatus(r.status), method: Array.isArray(r.payments) ? fmtStatus(asRecord(r.payments[0]).method) : '-' }; }); }
function mapProducts(source: unknown): ProductRow[] { return getArray(source).map((item) => { const r = asRecord(item); const category = asRecord(r.category); const price = Number(r.price ?? 0); return { id: String(r.id ?? '-'), sku: String(r.sku ?? r.barcode ?? '-'), name: String(r.name ?? '-'), category: String(category.name ?? 'Sin categoria'), stock: Number(r.stock ?? 0), min: Number(r.minStock ?? 0), value: money(Number(r.stock ?? 0) * Number(r.cost ?? r.price ?? 0)), price }; }); }
function mapCustomers(source: unknown): CustomerRow[] { return getArray(source).map((item) => { const r = asRecord(item); return { id: String(r.id ?? '-'), name: String(r.name ?? '-'), segment: 'Activo', document: [r.documentType, r.document].filter(Boolean).join(' ') || '-', lastBuy: fmtDate(r.updatedAt ?? r.createdAt), amount: '-' }; }); }
function mapPurchases(source: unknown): PurchaseRow[] { return getArray(source).map((item) => { const r = asRecord(item); const rows = Array.isArray(r.items) ? r.items : []; const total = rows.reduce((sum, row) => { const itemRecord = asRecord(row); return sum + Number(itemRecord.quantity ?? 0) * Number(itemRecord.unitCost ?? 0); }, 0); return { id: String(r.id ?? '-').slice(0, 8), supplier: String(r.supplierName ?? 'Proveedor no especificado'), date: fmtDate(r.createdAt), total: money(total), items: rows.length ? `${rows.length} producto(s)` : '-', notes: String(r.notes ?? '-') }; }); }
function mapPayments(source: unknown): PaymentRow[] { return getArray(source).map((item) => { const r = asRecord(item); return { date: fmtDate(r.createdAt), description: String(r.description ?? 'Pago de suscripcion'), amount: money(Number(r.amount ?? 0)), status: fmtStatus(r.status) }; }); }
function mapUsers(source: unknown): UserRow[] { return getArray(source).map((item) => { const r = asRecord(item); return { id: String(r.id ?? '-'), name: [r.firstName, r.lastName].filter(Boolean).join(' ') || String(r.email ?? '-'), email: String(r.email ?? '-'), role: String(r.role ?? '-'), status: r.isActive === false ? 'Inactivo' : 'Activo' }; }); }
function mapAuditLog(source: unknown): AuditRow[] { return getArray(source).map((item) => { const r = asRecord(item); return { action: String(r.action ?? '-'), userId: String(r.userId ?? '-').slice(0, 8), entity: String(r.entityType ?? '-'), date: fmtDate(r.createdAt) }; }); }
function mapNotifications(source: unknown): NotificationRow[] { return getArray(source).map((item) => { const r = asRecord(item); return { id: String(r.id ?? '-'), title: String(r.title ?? '-'), body: String(r.body ?? ''), type: String(r.type ?? '-'), status: r.isRead ? 'Leida' : 'No leida', date: fmtDate(r.createdAt) }; }); }
function mapChecklist(source: unknown): ChecklistItem[] { const data = asRecord(asRecord(source).data ?? source); const rows = Array.isArray(data.items) ? data.items : []; return rows.map((item) => { const r = asRecord(item); return { id: String(r.id ?? '-'), title: String(r.title ?? '-'), completed: Boolean(r.completed), description: String(r.description ?? '') }; }); }
function mapPlanName(subscription: unknown, fallback: string) { const data = asRecord(asRecord(subscription).data ?? subscription); const plan = asRecord(data.plan); const type = String(plan.type ?? fallback ?? 'FREE'); return type.charAt(0) + type.slice(1).toLowerCase(); }

export default App;
