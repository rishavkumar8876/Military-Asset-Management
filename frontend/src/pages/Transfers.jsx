import { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeftRight, Check, X } from 'lucide-react';

const Transfers = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transfer Form State
  const [assetId, setAssetId] = useState('');
  const [toBaseId, setToBaseId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const res = await api.get('/transfers');
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
    }
  });

  const requestTransferMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/transfers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setIsModalOpen(false);
      setAssetId('');
      setToBaseId('');
      setQuantity(1);
    },
    onError: (error) => {
      alert(`Transfer request failed: ${error.response?.data?.message || error.message}`);
    }
  });

  const approveTransferMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await api.patch(`/transfers/${id}/approve`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (error) => {
      alert(`Transfer approval failed: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleRequestTransfer = (e) => {
    e.preventDefault();
    const selectedAsset = assets.find(a => a._id === assetId);
    if(!selectedAsset) return;

    requestTransferMutation.mutate({
      asset: assetId,
      fromBase: selectedAsset.base._id,
      toBase: toBaseId,
      quantity: Number(quantity)
    });
  };

  const handleDecision = (id, status) => {
    if(window.confirm(`Are you sure you want to ${status} this transfer?`)) {
      approveTransferMutation.mutate({ id, status });
    }
  };

  if (isLoading) return <div className="spinner"></div>;

  const canRequest = user?.role === 'admin' || user?.role === 'logistics';
  const canApprove = user?.role === 'admin' || user?.role === 'commander';

  return (
    <>
      <div className="top-actions">
        <div>
          <h1 className="page-title">Inter-Base Transfers</h1>
          <p className="page-subtitle">Manage and track asset movements between military bases.</p>
        </div>
        
        {canRequest && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <ArrowLeftRight size={18} /> Request Transfer
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset</th>
              <th>Quantity</th>
              <th>From Base</th>
              <th>To Base</th>
              <th>Initiated By</th>
              <th>Status</th>
              {canApprove && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transfers && transfers.length > 0 ? (
              transfers.map(transfer => (
                <tr key={transfer._id}>
                  <td>{new Date(transfer.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{transfer.asset?.assetName} <span style={{fontSize:'0.75rem', color: 'var(--text-muted)', display: 'block'}}>{transfer.asset?.type}</span></td>
                  <td style={{ fontWeight: 700 }}>{transfer.quantity}</td>
                  <td>{transfer.fromBase?.name}</td>
                  <td>{transfer.toBase?.name}</td>
                  <td>{transfer.initiatedBy?.name}</td>
                  <td>
                    <span className={`badge badge-${transfer.status}`}>
                      {transfer.status}
                    </span>
                  </td>
                  {canApprove && (
                    <td style={{ textAlign: 'right' }}>
                      {transfer.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleDecision(transfer._id, 'approved')} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-green)', padding: '6px', borderRadius: '4px' }} title="Approve">
                            <Check size={18} />
                          </button>
                          <button onClick={() => handleDecision(transfer._id, 'rejected')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-red)', padding: '6px', borderRadius: '4px' }} title="Reject">
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canApprove ? "8" : "7"} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No transfers found.
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
              <h2 style={{ fontSize: '1.25rem' }}>Initiate Asset Transfer</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleRequestTransfer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Source Asset</label>
                  <select className="form-select" value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
                    <option value="">Select Asset to Transfer...</option>
                    {assets?.filter(a => a.quantity > 0).map(a => (
                      <option key={a._id} value={a._id}>
                        {a.assetName} (Qty: {a.quantity}) - {a.base.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Transfer Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={assetId && assets ? assets.find(a => a._id === assetId)?.quantity : ""}
                    className="form-input" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  {assetId && <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Max available: {assets.find(a => a._id === assetId)?.quantity}</small>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Destination Base</label>
                  <select className="form-select" value={toBaseId} onChange={(e) => setToBaseId(e.target.value)} required>
                    <option value="">Select Destination Base...</option>
                    {bases?.filter(b => assetId ? b._id !== assets.find(a => a._id === assetId)?.base._id : true).map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={requestTransferMutation.isPending}>
                  {requestTransferMutation.isPending ? 'Initiating...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Transfers;
