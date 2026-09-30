import { useEffect, useMemo, useState } from 'react';

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

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pompnet-token'));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('ChangeMe123!');
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [users, setUsers] = useState<User[]>([]);
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

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
      const [dashboard, userList, inboundList] = await Promise.all([
        fetcher<DashboardStats>('/api/dashboard/stats'),
        fetcher<User[]>('/api/users'),
        fetcher<Inbound[]>('/api/inbounds'),
      ]);

      setStats(dashboard);
      setUsers(userList);
      setInbounds(inboundList);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

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

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return user.username.toLowerCase().includes(query) || user.protocol.toLowerCase().includes(query);
    });
  }, [users, search]);

  const logout = () => {
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
            <button type="submit" disabled={loading}>
              {loading ? 'در حال ورود...' : 'ورود به پنل'}
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
      <aside className="sidebar glass-card">
        <div className="logo-block">
          <div className="logo-mark">P</div>
          <div>
            <div className="logo-title">PompNet</div>
            <div className="logo-subtitle">Mohammad PompNet</div>
          </div>
        </div>

        <nav className="nav">
          <a className="active">داشبورد</a>
          <a>کاربران</a>
          <a>Inbound ها</a>
          <a>تنظیمات</a>
        </nav>

        <button className="logout-btn" onClick={logout}>خروج</button>
      </aside>

      <main className="content-area">
        <header className="topbar glass-card">
          <div>
            <div className="eyebrow">پنل مدیریتی</div>
            <h1>محمد پمپ نت</h1>
          </div>
          <div className="topbar-pill">{stats.serverStatus}</div>
        </header>

        <section className="stats-grid">
          <StatCard icon="👥" title="Total Users" value={stats.totalUsers} accent="blue" />
          <StatCard icon="🟢" title="Active Users" value={stats.activeUsers} accent="green" />
          <StatCard icon="🔴" title="Disabled Users" value={stats.disabledUsers} accent="red" />
          <StatCard icon="📡" title="Online Users" value={stats.onlineUsers} accent="purple" />
          <StatCard icon="📊" title="Total Traffic" value={formatBytes(stats.totalTraffic)} accent="cyan" />
          <StatCard icon="⏳" title="Expired Users" value={stats.expiredUsers} accent="orange" />
          <StatCard icon="🔗" title="Total Inbounds" value={stats.totalInbounds} accent="purple" />
          <StatCard icon="🖥" title="Server Status" value={stats.serverStatus} accent="blue" />
        </section>

        <section className="panel-section glass-card">
          <div className="section-head">
            <h2>مدیریت کاربران</h2>
            <div className="search-box">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو در کاربران..."
              />
            </div>
          </div>

          <div className="user-grid">
            {filteredUsers.map((user) => (
              <div className="user-card glass-card" key={user.id}>
                <div className="user-topline">
                  <strong>{user.username}</strong>
                  <span className={`status-pill ${user.status.toLowerCase()}`}>{user.status}</span>
                </div>
                <div className="user-meta">
                  <span>{user.protocol}</span>
                  <span>{user.online ? 'آنلاین' : 'آفلاین'}</span>
                  <span>{user.connections} اتصال</span>
                </div>

                <div className="mini-grid">
                  <div>
                    <label>Traffic used</label>
                    <strong>{formatBytes(user.trafficUsed)}</strong>
                  </div>
                  <div>
                    <label>Traffic remaining</label>
                    <strong>{formatBytes(user.trafficRemaining)}</strong>
                  </div>
                  <div>
                    <label>Expiration</label>
                    <strong>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString('fa-IR') : 'نامحدود'}</strong>
                  </div>
                </div>

                <div className="user-actions">
                  <button>Copy</button>
                  <button>QR</button>
                  <button>Subscription</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-section glass-card">
          <div className="section-head">
            <h2>Inbound ها</h2>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>نام</th>
                  <th>پروتکل</th>
                  <th>پورت</th>
                  <th>وضعیت</th>
                  <th>Traffic</th>
                </tr>
              </thead>
              <tbody>
                {inbounds.map((inbound) => (
                  <tr key={inbound.id}>
                    <td>{inbound.name}</td>
                    <td>{inbound.protocol}</td>
                    <td>{inbound.port}</td>
                    <td>{inbound.status}</td>
                    <td>{formatBytes(inbound.trafficUsed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, accent }: { icon: string; title: string; value: string | number; accent: string }) {
  return (
    <div className={`stat-card glass-card ${accent}`}>
      <div className="icon-wrap">{icon}</div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}
