import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Shield, Plus } from 'lucide-react';

const Bases = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const { data: bases, isLoading } = useQuery({
    queryKey: ['bases'],
    queryFn: async () => {
      const res = await api.get('/bases');
      return res.data;
    }
  });

  const baseMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/bases', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bases'] });
      setIsModalOpen(false);
      setName('');
      setLocation('');
    }
  });

  const handleCreateBase = (e) => {
    e.preventDefault();
    baseMutation.mutate({ name, location });
  };

  if (isLoading) return <div className="spinner"></div>;

  return (
    <>
      <div className="top-actions">
        <div>
          <h1 className="page-title">Headquarters Command Center</h1>
          <p className="page-subtitle">Admin view for military bases active across global territories.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Establish New Base
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Base Name</th>
              <th>Geographic Location</th>
              <th>Established Date</th>
            </tr>
          </thead>
          <tbody>
            {bases && bases.length > 0 ? (
              bases.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} /> {b.name}
                  </td>
                  <td>{b.location}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No military bases registered yet.
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
              <h2 style={{ fontSize: '1.25rem' }}>Establish New Operational Base</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateBase}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Base Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Fort Knox, Naval Base Pearl Harbor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Geographic Location</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Kentucky, Hawaii"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={baseMutation.isPending}>
                  {baseMutation.isPending ? 'Configuring...' : 'Establish Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Bases;
