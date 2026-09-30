import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Play, Copy, QrCode, Link as LinkIcon, Plus, Edit2, Trash2, Server } from 'lucide-react';

type UserStatus = 'ACTIVE' | 'DISABLED' | 'EXPIRED';

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  expiredUsers: number;
  onlineUsers: number;
  totalTraffic: number;
  totalInbounds: number;
  serverStatus: string;
};

type User = {
  id: string;
  username: string;
  status: UserStatus;
  online: boolean;
  trafficUsed: number;
  trafficRemaining: number;
  expiryDate?: string | null;
  protocol: string;
  connections: number;
  subscriptionUrl?: string;
  configLink?: string;
  qrCodeUrl?: string;
};

type Inbound = {
  id: string;
  name: string;
  protocol: string;
  port: number;
  status: string;
  trafficUsed: number;
  trafficLimit: number;
  address?: string;
  clientCount?: number;
};

const formatBytes = (value: number) => {
  const units = ['MB', 'GB', 'TB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const playClickSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 740;
    gain.gain.value = 0.04;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
  } catch {
    // silent fallback
  }
};

const initialStats: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  disabledUsers: 0,
  expiredUsers: 0,
  onlineUsers: 0,
  totalTraffic: 0,
  totalInbounds: 0,
  serverStatus: 'Loading',
};

const mockInbounds: Inbound[] = [
  { id: '1', name: 'VLESS-TCP', protocol: 'VLESS', port: 443, status: 'ACTIVE', trafficUsed: 1024 * 1024 * 512, trafficLimit: 1024 * 1024 * 1024, address: 'your-panel-domain.com:443', clientCount: 28 },
  { id: '2', name: 'VMess-WS', protocol: 'VMess', port: 80, status: 'ACTIVE', trafficUsed: 1024 * 1024 * 256, trafficLimit: 1024 * 1024 * 1024, address: 'your-panel-domain.com:80', clientCount: 15 },
  { id: '3', name: 'Trojan-TCP', protocol: 'Trojan', port: 8443, status: 'ACTIVE', trafficUsed: 1024 * 1024 * 768, trafficLimit: 1024 * 1024 * 1024, address: 'your-panel-domain.com:8443', clientCount: 42 },
  { id: '4', name: 'Shadowsocks', protocol: 'Shadowsocks', port: 8388, status: 'ACTIVE', trafficUsed: 1024 * 1024 * 384, trafficLimit: 1024 * 1024 * 1024, address: 'your-panel-domain.com:8388', clientCount: 19 },
  { id: '5', name: 'VLESS-gRPC', protocol: 'VLESS', port: 50051, status: 'ACTIVE', trafficUsed: 1024 * 1024 * 640, trafficLimit: 1024 * 1024 * 1024, address: 'your-panel-domain.com:50051', clientCount: 33 },
  { id: '6', name: 'Hysteria2', protocol: 'Hysteria2', port: 443, status: 'ACTIVE', trafficUsed: 1024 * 1024 * 456, trafficLimit: 1024 * 1024 * 1024, address: 'your-panel-domain.com:443', clientCount: 22 },
];

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pompnet-token'));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('ChangeMe123!');
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [users, setUsers] = useState<User[]>([]);
  const [inbounds, setInbounds] = useState<Inbound[]>(mockInbounds);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'inbounds' | 'settings'>('dashboard');
  const [panelDomain, setPanelDomain] = useState('');
  const [showDomainPrompt, setShowDomainPrompt] = useState(!localStorage.getItem('pompnet-domain'));

  useEffect(() => {
    const saved = localStorage.getItem('pompnet-domain');
    if (saved) {
      setPanelDomain(saved);
      setInbounds(prev => prev.map(ib => ({ ...ib, address: `${saved}:${ib.port}` })));
    }
  }, []);

  const playSound = () => playClickSound();

  const fetcher = async <T,>(path: string): Promise<T> => {
    const response = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  };

  const loadDashboard = async () => {
    if (!token) return;

    try {
      const [dashboard, userList] = await Promise.all([
        fetcher<DashboardStats>('/api/dashboard/stats').catch(() => initialStats),
        fetcher<User[]>('/api/users').catch(() => []),
      ]);

      setStats(dashboard);
      setUsers(userList);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboard();
      const interval = setInterval(loadDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    playSound();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('pompnet-token', data.token);
      setToken(data.token);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDomain = (domain: string) => {
    if (domain.trim()) {
      localStorage.setItem('pompnet-domain', domain.trim());
      setPanelDomain(domain.trim());
      setInbounds(prev => prev.map(ib => ({ ...ib, address: `${domain.trim()}:${ib.port}` })));
      setShowDomainPrompt(false);
      playSound();
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return user.username.toLowerCase().includes(query) || user.protocol.toLowerCase().includes(query);
    });
  }, [users, search]);

  const logout = () => {
    playSound();
    localStorage.removeItem('pompnet-token');
    setToken(null);
  };

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-bg" />
        <div className="login-panel glass-card">
          <div className="brand-wrap">
            <div className="brand-mark">P</div>
            <div>
              <div className="title-main">محمد پمپ نت</div>
              <div className="title-sub">PompNet | Fast • Secure • Unlimited</div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              نام کاربری
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label>
              رمز عبور
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button type="submit" disabled={loading} onClick={playSound}>
              {loading ? 'درحال ورود...' : 'ورود به پنل'}
            </button>
          </form>

          <div className="support-link">
            🛟 PompNet Support
            <span>Telegram: @NuvoraAzad980</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {showDomainPrompt && (
        <div className="domain-modal-overlay" onClick={() => setShowDomainPrompt(false)}>
          <div className="domain-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <h2>🌐 آدرس پنل خود را وارد کنید</h2>
            <p>این آدرس در تمام Inbound ها نمایش داده می‌شود</p>
            <div className="domain-input-group">
              <input 
                type="text" 
                placeholder="مثال: your-panel-domain.com" 
                id="domainInput"
                defaultValue={panelDomain}
              />
              <button className="btn-action" onClick={() => {
                const input = document.getElementById('domainInput') as HTMLInputElement;
                handleSaveDomain(input.value);
              }}>ذخیره</button>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar glass-card">
        <div className="logo-block">
          <div className="logo-mark">P</div>
          <div>
            <div className="logo-title">PompNet</div>
            <div className="logo-subtitle">Mohammad PompNet</div>
          </div>
        </div>

        <nav className="nav">
          <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { playSound(); setActiveTab('dashboard'); }}>
            📊 داشبورد
          </button>
          <button className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { playSound(); setActiveTab('users'); }}>
            👥 کاربران
          </button>
          <button className={`nav-btn ${activeTab === 'inbounds' ? 'active' : ''}`} onClick={() => { playSound(); setActiveTab('inbounds'); }}>
            🔗 Inbound ها
          </button>
          <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { playSound(); setActiveTab('settings'); }}>
            ⚙️ تنظیمات
          </button>
        </nav>

        <button className="logout-btn" onClick={logout}>خروج</button>
      </aside>

      <main className="content-area">
        <header className="topbar glass-card">
          <div>
            <div className="eyebrow">کد نویسی شده توسط تیم پمپ نت</div>
            <h1>محمد پمپ نت</h1>
            <div className="tagline">PompNet | Fast • Secure • Unlimited</div>
          </div>
          <div className="topbar-status">
            <span className="status-indicator"></span>
            {stats.serverStatus}
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <section className="stats-grid">
            <StatCard icon="👥" title="کاربران" value={stats.totalUsers} accent="blue" tooltip="کل کاربران" />
            <StatCard icon="🟢" title="فعال" value={stats.activeUsers} accent="green" tooltip="کاربران فعال" />
            <StatCard icon="🔴" title="غیرفعال" value={stats.disabledUsers} accent="red" tooltip="کاربران غیرفعال" />
            <StatCard icon="📡" title="آنلاین" value={stats.onlineUsers} accent="purple" tooltip="کاربران آنلاین" />
            <StatCard icon="📊" title="ترافیک" value={formatBytes(stats.totalTraffic)} accent="cyan" tooltip="ترافیک کل" />
            <StatCard icon="⏳" title="منقضی" value={stats.expiredUsers} accent="orange" tooltip="کاربران منقضی" />
            <StatCard icon="🔗" title="Inbound" value={inbounds.length} accent="purple" tooltip="تعداد inbound" />
            <StatCard icon="🖥" title="سرور" value={stats.serverStatus} accent="blue" tooltip="وضعیت سرور" />
          </section>
        )}

        {activeTab === 'users' && (
          <section className="panel-section glass-card">
            <div className="section-head">
              <div>
                <h2>مدیریت کاربران</h2>
                <p className="section-desc">کنترل سریع کاربران و وضعیت‌ها</p>
              </div>
              <div className="header-actions">
                <div className="search-box">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو..." />
                </div>
                <button className="btn-action" onClick={playSound}><Plus size={18} /> افزودن</button>
              </div>
            </div>

            <div className="user-grid">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div className="user-card glass-card" key={user.id}>
                    <div className="user-topline">
                      <strong>{user.username}</strong>
                      <span className={`status-pill ${user.status.toLowerCase()}`}>{user.status}</span>
                    </div>

                    <div className="user-meta">
                      <span>{user.protocol}</span>
                      <span className={user.online ? 'online' : 'offline'}>{user.online ? '🟢 آنلاین' : '⚪ آفلاین'}</span>
                      <span>{user.connections} اتصال</span>
                    </div>

                    <div className="mini-grid">
                      <div>
                        <label>مصرف</label>
                        <strong>{formatBytes(user.trafficUsed)}</strong>
                      </div>
                      <div>
                        <label>باقی‌مانده</label>
                        <strong>{formatBytes(user.trafficRemaining)}</strong>
                      </div>
                      <div>
                        <label>انقضا</label>
                        <strong>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString('fa-IR') : 'نامحدود'}</strong>
                      </div>
                    </div>

                    <div className="user-actions">
                      <ActionButton icon={<Copy size={16} />} label="کپی" onClick={playSound} />
                      <ActionButton icon={<QrCode size={16} />} label="QR" onClick={playSound} />
                      <ActionButton icon={<LinkIcon size={16} />} label="لینک" onClick={playSound} />
                      <ActionButton icon={<Edit2 size={16} />} label="ویرایش" onClick={playSound} />
                      <ActionButton icon={<Trash2 size={16} />} label="حذف" onClick={playSound} danger />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">هیچ کاربری پیدا نشد.</div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'inbounds' && (
          <section className="panel-section glass-card">
            <div className="section-head">
              <div>
                <h2>Inbound ها</h2>
                <p className="section-desc">درگاه‌های ورودی و پروتکل‌های فعال</p>
              </div>
              <button className="btn-action" onClick={playSound}><Plus size={18} /> افزودن</button>
            </div>

            <div className="inbounds-grid">
              {inbounds.map((inbound) => (
                <div className="inbound-card glass-card" key={inbound.id}>
                  <div className="inbound-header">
                    <div className="inbound-title">
                      <Server size={20} />
                      <div>
                        <h3>{inbound.name}</h3>
                        <span className="protocol-badge">{inbound.protocol}</span>
                      </div>
                    </div>
                    <span className={`status-badge ${inbound.status.toLowerCase()}`}>{inbound.status}</span>
                  </div>

                  <div className="inbound-details">
                    <div className="detail-item">
                      <label>آدرس پنل</label>
                      <code>{inbound.address || `your-domain:${inbound.port}`}</code>
                      <button className="copy-btn" onClick={() => { navigator.clipboard.writeText(inbound.address || `your-domain:${inbound.port}`); playSound(); }} title="کپی آدرس">📋</button>
                    </div>
                    <div className="detail-item">
                      <label>پورت</label>
                      <strong>{inbound.port}</strong>
                    </div>
                    <div className="detail-item">
                      <label>کلاینت‌ها</label>
                      <strong>{inbound.clientCount}</strong>
                    </div>
                  </div>

                  <div className="traffic-bar">
                    <div className="traffic-used" style={{ width: `${(inbound.trafficUsed / inbound.trafficLimit) * 100}%` }}></div>
                  </div>
                  <div className="traffic-text">
                    {formatBytes(inbound.trafficUsed)} / {formatBytes(inbound.trafficLimit)}
                  </div>

                  <div className="inbound-actions">
                    <button className="btn-small" onClick={playSound}>✏️</button>
                    <button className="btn-small" onClick={playSound}>🔄</button>
                    <button className="btn-small danger" onClick={playSound}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="panel-section glass-card">
            <div className="section-head">
              <div>
                <h2>تنظیمات</h2>
                <p className="section-desc">پیکربندی سریع پنل</p>
              </div>
            </div>

            <div className="settings-grid">
              <SettingCard title="📍 آدرس پنل" description="آپدیت آدرس برای نمایش در Inbound ها" action={() => setShowDomainPrompt(true)} />
              <SettingCard title="🔐 مدیر" description="تغییر رمز عبور مدیر" />
              <SettingCard title="🌐 CORS" description="دسترسی‌های ورودی و ارتباطات" />
              <SettingCard title="💾 دیتابیس" description="اتصال PostgreSQL و تنظیمات" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, accent, tooltip }: { icon: string; title: string; value: string | number; accent: string; tooltip?: string }) {
  return (
    <div className={`stat-card glass-card ${accent}`} onClick={playClickSound} title={tooltip}>
      <div className="icon-wrap">{icon}</div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={`action-btn glass-card ${danger ? 'danger' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SettingCard({ title, description, action }: { title: string; description: string; action?: () => void }) {
  return (
    <div className="setting-card glass-card">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button className="btn-action" onClick={() => { action?.(); playClickSound(); }}>تنظیم</button>
    </div>
  );
}
