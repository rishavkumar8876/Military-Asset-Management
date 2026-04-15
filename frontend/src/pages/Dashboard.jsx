import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Database, Package, ArrowLeftRight } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ 
      width: '60px', height: '60px', borderRadius: '50%', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `rgba(${color}, 0.15)`, color: `rgb(${color})`,
      border: `1px solid rgba(${color}, 0.3)`
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '2rem', marginBottom: '4px' }}>{value}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>
        {title}
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/metrics');
      return res.data;
    }
  });

  if (isLoading) return <div className="spinner"></div>;

  return (
    <>
      <h1 className="page-title">Command Center</h1>
      <p className="page-subtitle">Overview of military assets and recent logistics activity.</p>
      
      <div className="grid-cards">
        <StatCard 
          title="Total Assets" 
          value={data?.totalAssets || 0} 
          icon={<Database size={28} />}
          color="245, 158, 11" // gold
        />
        <StatCard 
          title="Pending Transfers" 
          value={data?.pendingTransfers || 0} 
          icon={<ArrowLeftRight size={28} />}
          color="239, 68, 68" // red
        />
        {data?.assetsByType.map(typeStat => (
          <StatCard 
            key={typeStat._id}
            title={typeStat._id + 's'} 
            value={typeStat.total} 
            icon={<Package size={28} />}
            color="16, 185, 129" // green
          />
        ))}
      </div>
    </>
  );
};

export default Dashboard;
