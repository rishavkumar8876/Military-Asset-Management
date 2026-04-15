import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Filter, Plus } from 'lucide-react';

const Assets = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Asset Form State
  const [assetName, setAssetName] = useState('');
  const [type, setType] = useState('weapon');
  const [baseId, setBaseId] = useState('');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await api.get('/assets');
      return res.data;
    }
  });

  const { data: bases } = useQuery({
    queryKey: ['bases'],
    queryFn: async () => {
      const res = await api.get('/bases');
      return res.data;
    },
    enabled: user?.role === 'admin'
  });

  const addAssetMutation = useMutation({
    mutationFn: async (newAsset) => {
      return await api.post('/assets', newAsset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setAssetName('');
    }
  });

  const handleAddAsset = (e) => {
    e.preventDefault();
    const payload = {
      assetName,
      type,
      // Default to 0 quantity, users buy/transfer to get quantity
      quantity: 0,
      base: user?.role === 'admin' ? baseId : user?.base?._id
    };
    addAssetMutation.mutate(payload);
  };

  const filteredAssets = assets?.filter(a => filterType === 'all' || a.type === filterType) || [];

  if (isLoading) return <div className="spinner"></div>;

  const canAddAsset = user?.role === 'admin' || user?.role === 'commander';

  return (
    <>
      <div className="top-actions">
        <div>
          <h1 className="page-title">Inventory Assets</h1>
          <p className="page-subtitle">Track and manage military assets across assigned bases.</p>
        </div>
        <div className="flex-gap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
            >
              <option value="all">All Types</option>
              <option value="weapon">Weapons</option>
              <option value="vehicle">Vehicles</option>
              <option value="ammunition">Ammunition</option>
            </select>
          </div>
          
          {canAddAsset && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Register Asset Setup
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Assigned Base</th>
              <th>Base Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map(asset => (
                <tr key={asset._id}>
                  <td style={{ fontWeight: 500 }}>{asset.assetName}</td>
                  <td>
                    <span style={{ 
                      textTransform: 'capitalize', 
                      color: asset.type === 'weapon' ? 'var(--danger-red)' : asset.type === 'vehicle' ? 'var(--accent-gold)' : 'var(--success-green)' 
                    }}>
                      {asset.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{asset.quantity}</td>
                  <td>{asset.base ? asset.base.name : 'Unknown'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{asset.base ? asset.base.location : 'Unknown'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No assets found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>Register New Asset Catalog Entry</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddAsset}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.875rem' }}>
                  Registering a new asset creates a tracked entry for a specific base with 0 initial quantity. Use the Purchases page to add inventory.
                </p>
                
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g. M1A2 Abrams, 5.56mm Rounds"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Classification Type</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="weapon">Weapon</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="ammunition">Ammunition</option>
                  </select>
                </div>
                
                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label className="form-label">Assign to Base</label>
                    <select className="form-select" value={baseId} onChange={(e) => setBaseId(e.target.value)} required>
                      <option value="">Select a Base...</option>
                      {bases?.map(b => (
                        <option key={b._id} value={b._id}>{b.name} ({b.location})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addAssetMutation.isPending}>
                  {addAssetMutation.isPending ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Assets;
