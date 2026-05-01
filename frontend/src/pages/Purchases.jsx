import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart } from 'lucide-react';

const Purchases = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [assetId, setAssetId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [baseId, setBaseId] = useState('');

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await api.get('/purchases');
      return res.data;
    }
  });

  const { data: assets } = useQuery({
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

  const purchaseMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/purchases', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setAssetId('');
      setQuantity(1);
    },
    onError: (error) => {
      alert(`Purchase logging failed: ${error.response?.data?.message || error.message}`);
    }
  });

  const handlePurchase = (e) => {
    e.preventDefault();
    purchaseMutation.mutate({
      asset: assetId,
      quantity: Number(quantity),
      base: user?.role === 'admin' ? baseId : user?.base?._id
    });
  };

  if (isLoading) return <div className="spinner"></div>;

  return (
    <>
      <div className="top-actions">
        <div>
          <h1 className="page-title">Procurement Log</h1>
          <p className="page-subtitle">Track new military asset acquisitions augmenting base inventory.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <ShoppingCart size={18} /> Register Purchase
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset Purchased</th>
              <th>Type</th>
              <th>Quantity added</th>
              <th>Receiving Base</th>
              <th>Authorized By</th>
            </tr>
          </thead>
          <tbody>
            {purchases && purchases.length > 0 ? (
              purchases.map(p => (
                <tr key={p._id}>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{p.asset?.assetName}</td>
                  <td><span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{p.asset?.type}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--success-green)' }}>+{p.quantity}</td>
                  <td>{p.base?.name}</td>
                  <td>{p.purchasedBy?.name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No purchases logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>Log New Purchase</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handlePurchase}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Asset to Restock</label>
                  <select className="form-select" value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
                    <option value="">Select an asset catalog entry...</option>
                    {assets?.map(a => (
                      <option key={a._id} value={a._id}>
                        {a.assetName} ({a.base.name}) - Current Qty: {a.quantity}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Amount Purchased</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="form-input" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label className="form-label">Receiving Base</label>
                    <select className="form-select" value={baseId} onChange={(e) => setBaseId(e.target.value)} required>
                      <option value="">Select destination base...</option>
                      {bases?.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Ensure you selected an asset that belongs to this specific base.
                    </small>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={purchaseMutation.isPending}>
                  {purchaseMutation.isPending ? 'Logging...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Purchases;
