import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';
import { Clock, Search, Brain, Activity, Trash2, Calendar, FileText, X, RefreshCw } from 'lucide-react';
import './Dashboard.css';

const HistoryPage = ({ navigate }) => {
  const { token, settings } = useContext(AuthContext);
  const [historyItems, setHistoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const timezone = settings?.timezone || 'Asia/Karachi';

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setHistoryItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchHistory();
  }, [token]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Remove this assessment from history?')) return;
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHistoryItems(prev => prev.filter(item => item.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleClearAll = async () => {
    if (historyItems.length === 0) return;
    if (!window.confirm('Clear all assessment history? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHistoryItems([]);
    } catch (e) { console.error(e); }
  };

  const formatDate = (timestamp) => {
    try {
      const utcString = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
      return new Date(utcString).toLocaleString('en-PK', {
        timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch { return new Date(timestamp).toLocaleString(); }
  };

  const getPredictionColor = (prediction) => {
    if (!prediction) return '#64748B';
    if (prediction.includes('No Tumor') || prediction.includes('Low')) return '#10B981';
    return '#EF4444';
  };
  
  const getPredictionBg = (prediction) => {
    if (!prediction) return '#F1F5F9';
    if (prediction.includes('No Tumor') || prediction.includes('Low')) return '#F0FDF4';
    return '#FEF2F2';
  };

  const filtered = searchQuery.trim()
    ? historyItems.filter(item =>
        (item.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.prediction || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.type || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : historyItems;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.3px' }}>Assessment History</h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>View and manage your past AI analyses and clinical assessments.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search patients or results..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="nm-input"
              style={{ paddingLeft: 38, paddingTop: 10, paddingBottom: 10, borderRadius: 12, background: '#fff' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
          {historyItems.length > 0 && (
            <button onClick={handleClearAll} className="btn btn-outline" style={{ padding: '10px 16px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="ios-card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 12 }}>
              <RefreshCw size={24} />
            </div>
            <div>Loading history...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Clock size={32} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
              {searchQuery ? 'No results found' : 'No history yet'}
            </h3>
            <p style={{ color: '#64748B', maxWidth: 300, margin: '0 auto' }}>
              {searchQuery ? `We couldn't find any assessments matching "${searchQuery}".` : 'Upload an MRI scan or complete a clinical assessment to see your history here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              <div>Patient & Type</div>
              <div>Prediction</div>
              <div>Confidence</div>
              <div>Date & Time</div>
              <div style={{ width: 40 }}></div>
            </div>
            
            {/* Rows */}
            {filtered.map((item, index) => {
              const isClinical = item.type === 'clinical';
              const pColor = getPredictionColor(item.prediction);
              const pBg = getPredictionBg(item.prediction);
              
              return (
                <div key={item.id} style={{ 
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
                  alignItems: 'center', padding: '20px 24px', 
                  borderBottom: index < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.2s',
                  background: '#fff'
                }}
                onClick={() => setSelectedItem(item)}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                style={{ cursor: 'pointer', ...{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
                  alignItems: 'center', padding: '20px 24px', 
                  borderBottom: index < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.2s',
                  background: '#fff'
                }}}
                >
                  {/* Patient Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: pBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isClinical ? <Activity size={20} color={pColor} /> : <Brain size={20} color={pColor} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 2 }}>{item.patient_name === 'Unknown Patient' ? 'Anonymous' : (item.patient_name || 'Anonymous')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                          {item.type === 'fusion' ? 'Fusion Analysis' : isClinical ? 'Clinical Assessment' : 'MRI Analysis'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Prediction */}
                  <div style={{ fontWeight: 700, color: pColor, fontSize: '0.9rem' }}>
                    {item.prediction}
                  </div>
                  
                  {/* Confidence */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.9rem' }}>
                      {(item.confidence * 100).toFixed(1)}%
                    </div>
                    <div style={{ width: 60, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.confidence * 100}%`, background: pColor, borderRadius: 3 }} />
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '0.85rem' }}>
                    <Calendar size={14} />
                    {formatDate(item.timestamp)}
                  </div>
                  
                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={(e) => handleDelete(e, item.id)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', padding: 8, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}
                      title="Delete Record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Assessment Details</h3>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Name</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>{selectedItem.patient_name === 'Unknown Patient' ? 'Anonymous' : (selectedItem.patient_name || 'Anonymous')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>{formatDate(selectedItem.timestamp)}</div>
                </div>
              </div>
              
              <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 16, marginBottom: 24, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Prediction</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: getPredictionColor(selectedItem.prediction) }}>
                    {selectedItem.prediction}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748B' }}>
                    {(selectedItem.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
              </div>

              {selectedItem.symptoms && selectedItem.symptoms.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reported Symptoms</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedItem.symptoms.map(sym => (
                      <span key={sym} style={{ background: '#EEF2F6', color: '#334155', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                        {sym.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.warning && (
                <div style={{ background: '#FEF3C7', borderLeft: '4px solid #F59E0B', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: 24 }}>
                  <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.9rem', marginBottom: 4 }}>Uncertainty Warning</div>
                  <div style={{ fontSize: '0.85rem', color: '#B45309' }}>{selectedItem.warning}</div>
                </div>
              )}

              {selectedItem.explanation && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Explanation</div>
                  <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    {selectedItem.explanation}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px 32px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedItem(null)} className="btn btn-primary" style={{ padding: '10px 24px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
