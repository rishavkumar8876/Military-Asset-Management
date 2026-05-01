import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Crosshair } from 'lucide-react';

const Assignments = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [assetId, setAssetId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [baseId, setBaseId] = useState('');

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const res = await api.get('/assignments');
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

  const assignmentMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/assignments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
      setAssetId('');
      setAssignedTo('');
      setQuantity(1);
    },
    onError: (error) => {
      alert(`Assignment failed: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleAssignment = (e) => {
    e.preventDefault();
    assignmentMutation.mutate({
      asset: assetId,
      assignedTo,
      quantity: Number(quantity),
      base: user?.role === 'admin' ? baseId : user?.base?._id
    });
  };

  if (isLoading) return <div className="spinner"></div>;

  return (
    <>
      <div className="top-actions">
        <div>
          <h1 className="page-title">Deployments & Assignments</h1>
          <p className="page-subtitle">Track assets checked out for tactical missions and personnel usage.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Crosshair size={18} /> Deploy Asset
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset Deployed</th>
              <th>Assigned To</th>
              <th>Quantity Distributed</th>
              <th>Originating Base</th>
              <th>Authorized By</th>
            </tr>
          </thead>
          <tbody>
            {assignments && assignments.length > 0 ? (
              assignments.map(a => (
                <tr key={a._id}>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{a.asset?.assetName}</td>
                  <td style={{ color: 'var(--accent-gold)' }}>{a.assignedTo}</td>
                  <td style={{ fontWeight: 700, color: 'var(--danger-red)' }}>-{a.quantity}</td>
                  <td>{a.base?.name}</td>
                  <td>{a.assignedBy?.name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No active assignments found.
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
              <h2 style={{ fontSize: '1.25rem' }}>Deploy Asset to Personnel/Mission</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAssignment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Asset Required</label>
                  <select className="form-select" value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
                    <option value="">Select asset to deploy...</option>
                    {assets?.filter(a => a.quantity > 0).map(a => (
                      <option key={a._id} value={a._id}>
                        {a.assetName} ({a.base.name}) - Avail: {a.quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned To (Operation / Personnel)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Bravo Team, Operation Desert Shield"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Distribution Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={assetId && assets ? assets.find(a => a._id === assetId)?.quantity : ""}
                    className="form-input" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label className="form-label">Origin Base</label>
                    <select className="form-select" value={baseId} onChange={(e) => setBaseId(e.target.value)} required>
                      <option value="">Select origin base...</option>
                      {bases?.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={assignmentMutation.isPending}>
                  {assignmentMutation.isPending ? 'Processing...' : 'Authorize Deployment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Assignments;
