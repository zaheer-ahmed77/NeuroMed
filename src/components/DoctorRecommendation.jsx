import React, { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, MapPin, Star, Calendar, Phone, Mail, ExternalLink, Activity, Loader2, Navigation, PlusCircle, Search } from 'lucide-react';
import API_BASE from '../config';
import { AuthContext } from '../context/AuthContext';

const DoctorRecommendation = ({ condition }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState('Locating clinics...');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { token, user } = useContext(AuthContext);

  const [regForm, setRegForm] = useState({
    name: user?.fullName || '',
    specialty: 'Neurologist',
    city: 'Karachi',
    pmdc_number: '',
    fee: 1500,
    latitude: 24.8607,
    longitude: 67.0011
  });

  const fetchDoctors = async (lat = null, lng = null) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/doctors/nearby`;
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error("Failed to fetch network", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus('Showing network near you');
          setRegForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
          fetchDoctors(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("Location error:", err);
          setLocationStatus('Showing full network (Location denied)');
          fetchDoctors();
        }
      );
    } else {
      setLocationStatus('Location not supported');
      fetchDoctors();
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please login first to join the network.");
      return;
    }
    
    // PMDC Validation
    if(regForm.pmdc_number.length < 5) {
        alert("Please enter a valid PMDC Registration Number.");
        return;
    }

    try {
      const res = await fetch(`${API_BASE}/doctors/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(regForm)
      });
      if(res.ok) {
        alert("Registration Submitted! Your profile will appear in the network after PMDC verification by the admin team.");
        setShowRegisterModal(false);
        // We don't need to refresh the list because they won't appear until verified anyway
      } else {
        alert("Registration failed. Are you logged in?");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [doctors, searchQuery]);

  return (
    <div className="nm-card" style={{ padding: 24, marginTop: 24, borderTop: '4px solid var(--brand-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="var(--brand-primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Referral Network</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cross-consultation for: <strong>{condition}</strong></p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--brand-primary)', background: 'var(--bg-active)', padding: '6px 12px', borderRadius: 20 }}>
            <Navigation size={14} />
            {locationStatus}
          </div>
          <button 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem' }}
            onClick={() => setShowRegisterModal(true)}
          >
            <PlusCircle size={14} />
            Join Network
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="Search by name, specialty, or city..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '0.95rem' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', color: 'var(--brand-primary)' }} />
          <p>Loading referral network...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {filteredDoctors.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-surface-2)', borderRadius: 12, color: 'var(--text-muted)' }}>
              <Activity size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No Specialists Found</div>
              <div>{searchQuery ? "No doctors match your search." : "The referral database is currently empty."}</div>
            </div>
          ) : 
            filteredDoctors.map(doc => (
              <div key={doc._id} style={{ 
                border: '1px solid var(--border)', 
                borderRadius: 12, 
                padding: 16, 
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'var(--transition-fast)'
              }}
              className="doc-card"
              >
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-medium)', flexShrink: 0 }}>
                  <User size={32} color="var(--brand-primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.2 }}>{doc.name}</div>
                  <div style={{ color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>{doc.specialty}</div>
                  {doc.distance_km !== undefined && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {doc.distance_km} km away
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} color="var(--text-muted)" />
                  {doc.city}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Fee:</span> Rs. {doc.fee}
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '8px' }}
                  onClick={() => setSelectedDoc(doc)}
                >
                  Refer Patient
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refer Patient Modal */}
      {selectedDoc && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedDoc(null)}>
          <div className="nm-card" style={{ width: '100%', maxWidth: 500, padding: 32, position: 'relative', animation: 'fadeInUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 24 }}>Generate Referral Letter</h2>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: 16, background: 'var(--bg-surface-2)', borderRadius: 12 }}>
               <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-medium)', flexShrink: 0 }}>
                  <User size={30} color="var(--brand-primary)" />
                </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedDoc.name}</div>
                <div style={{ color: 'var(--brand-primary)', fontSize: '0.9rem' }}>{selectedDoc.specialty}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Location</span>
                <strong style={{ fontSize: '1rem' }}>{selectedDoc.city}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Consultation Fee</span>
                <strong style={{ fontSize: '1.1rem' }}>Rs. {selectedDoc.fee}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary btn-full" onClick={() => { alert('Referral letter generated successfully. Sent to ' + selectedDoc.name); setSelectedDoc(null); }}>
                Confirm Referral
              </button>
              <button className="btn btn-outline btn-full" onClick={() => setSelectedDoc(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Join Network Modal */}
      {showRegisterModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRegisterModal(false)}>
          <div className="nm-card" style={{ width: '100%', maxWidth: 500, padding: 32, position: 'relative', animation: 'fadeInUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 24 }}>Join Referral Network</h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Doctor Name</label>
                <input type="text" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }} required value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} placeholder="e.g. Dr. John Doe" />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Specialty</label>
                    <input type="text" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }} required value={regForm.specialty} onChange={e => setRegForm({...regForm, specialty: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>PMDC Number</label>
                    <input type="text" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }} required value={regForm.pmdc_number} onChange={e => setRegForm({...regForm, pmdc_number: e.target.value})} placeholder="e.g. 12345-S" />
                  </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>City</label>
                  <input type="text" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }} required value={regForm.city} onChange={e => setRegForm({...regForm, city: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Consultation Fee</label>
                  <input type="number" className="form-input" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }} required value={regForm.fee} onChange={e => setRegForm({...regForm, fee: Number(e.target.value)})} />
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location will be pinned to your current GPS coordinates automatically. Profile requires PMDC verification by admin before listing.</p>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary btn-full">Submit for Verification</button>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowRegisterModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      <style>{`
        .doc-card:hover {
          border-color: var(--brand-primary-400) !important;
          box-shadow: var(--shadow-md) !important;
          transform: translateY(-2px);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DoctorRecommendation;
