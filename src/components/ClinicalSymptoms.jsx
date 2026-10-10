import React, { useState, useContext } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Stethoscope, RefreshCw } from 'lucide-react';
import DoctorRecommendation from './DoctorRecommendation';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';

const symptomsList = [
  { id: 'Headache_Persistent', label: 'Severe/Persistent Headaches', sub: 'Especially worse in the morning or waking from sleep' },
  { id: 'Nausea_Vomiting', label: 'Nausea or Vomiting', sub: 'Unexplained, often worse in the morning' },
  { id: 'Vision_Changes', label: 'Vision Changes', sub: 'Blurred vision, double vision, or loss of peripheral vision' },
  { id: 'Seizures', label: 'New Onset Seizures', sub: 'Any type of convulsion or seizure activity' },
  { id: 'Balance_Coordination_Issues', label: 'Balance Issues', sub: 'Difficulty walking, dizziness, or clumsiness' },
  { id: 'Speech_Difficulties', label: 'Speech Difficulties', sub: 'Slurred speech or difficulty finding words' },
  { id: 'Memory_Loss', label: 'Memory Loss', sub: 'Difficulty remembering recent events or information' },
  { id: 'Weakness_Numbness', label: 'Weakness/Numbness', sub: 'Gradual loss of sensation or movement in an arm or leg' },
  { id: 'Personality_Changes', label: 'Personality Changes', sub: 'Sudden mood swings or changes in behavior' },
  { id: 'Fatigue', label: 'Fatigue', sub: 'Extreme tiredness or lack of energy' },
  { id: 'Sensitivity_Light', label: 'Sensitivity to Light', sub: 'Photophobia or discomfort in bright light' },
  { id: 'Sleep_Disturbances', label: 'Sleep Disturbances', sub: 'Insomnia or changes in sleep patterns' }
];

const ClinicalSymptoms = ({ onAnalysisComplete }) => {
  const { token } = useContext(AuthContext);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAnalyze = async () => {
    if (Object.values(selectedSymptoms).filter(Boolean).length === 0) {
      alert("Please select at least one symptom to analyze.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    // Prepare payload
    const payload = {
      symptoms: {},
      patientName: patientName,
      patientAge: patientAge ? String(patientAge) : undefined
    };
    
    // Populate all 12 symptoms, defaulting to 0 if not checked
    symptomsList.forEach(sym => {
      payload.symptoms[sym.id] = selectedSymptoms[sym.id] ? 1 : 0;
    });

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/api/analyze/clinical`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      // data: { risk_level: string, confidence: float, recommendation: string, id: string }
      let riskLvl = 'Low';
      if (data.risk_level === 'High symptom-based risk') {
        riskLvl = 'High';
      }
      
      setResult({
        prediction: data.risk_level,
        confidence: data.confidence,
        riskLevel: riskLvl,
        recommendation: data.recommendation,
        important_features: data.important_features
      });
      if (onAnalysisComplete) onAnalysisComplete();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSelectedSymptoms({});
    setPatientName('');
    setPatientAge('');
  };

  return (
    <div className="upload-area" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <div className="clinical-banner" style={{
          borderRadius: 24, padding: '28px 32px',
          boxShadow: '0 10px 30px rgba(16,185,129,0.2)',
          marginBottom: 24, position: 'relative', overflow: 'hidden'
        }}>
          <div className="clinical-banner-img" style={{ position: 'absolute', right: '-10%', top: '-50%', width: 300, opacity: 0.1, pointerEvents: 'none' }}>
            <img src="/network_brain.webp" alt="" style={{ width: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.3px' }}>Clinical Assessment</h2>
            <p style={{ color: '#E2E8F0', fontSize: '0.95rem' }}>Select patient symptoms to run the neurological risk model.</p>
          </div>
          <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={20} color="#FFFFFF" />
            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.9rem' }}>Multimodal Fusion</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertTriangle size={18} />
            <span style={{ marginLeft: 8 }}>{error}</span>
          </div>
        )}

        {!result && !isAnalyzing && (
          <div className="nm-card" style={{ padding: 24, animation: 'fadeIn 0.4s ease' }}>
            <div className="section-label" style={{ marginBottom: 16 }}>Patient Details (Optional)</div>
            <div className="patient-grid">
              <div>
                <label className="nm-label">Patient Name</label>
                <input 
                  type="text" 
                  className="nm-input" 
                  placeholder="e.g. John Doe"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div>
                <label className="nm-label">Age</label>
                <input 
                  type="number" 
                  className="nm-input" 
                  placeholder="e.g. 45"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                />
              </div>
            </div>

            <div className="nm-divider" style={{ margin: '24px 0' }}>Symptoms Profile</div>

            <div className="symptom-grid" style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {symptomsList.map(sym => (
                <div 
                  key={sym.id}
                  onClick={() => toggleSymptom(sym.id)}
                  className="ios-card symptom-card"
                  style={{
                    border: `2px solid ${selectedSymptoms[sym.id] ? '#10B981' : 'transparent'}`,
                    background: selectedSymptoms[sym.id] ? 'rgba(16,185,129,0.05)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: selectedSymptoms[sym.id] ? '0 8px 20px rgba(16,185,129,0.15)' : '0 4px 20px rgba(0,0,0,0.04)',
                    transform: selectedSymptoms[sym.id] ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <div className="symptom-icon-wrap" style={{ color: selectedSymptoms[sym.id] ? '#10B981' : '#D1D5DB', transition: 'color 0.2s' }}>
                    {selectedSymptoms[sym.id] ? <CheckCircle2 size={24} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid currentColor' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: selectedSymptoms[sym.id] ? '#065F46' : '#111827', transition: 'color 0.2s' }}>
                      {sym.label}
                    </div>
                    <div className="symptom-subtext" style={{ color: '#6B7280', marginTop: 4 }}>{sym.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
              <button 
                className="btn btn-primary btn-lg" 
                onClick={handleAnalyze}
                disabled={Object.values(selectedSymptoms).filter(Boolean).length === 0}
              >
                Run Clinical Model <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="nm-card" style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
            <Activity size={48} color="var(--brand-primary)" className="pulse-anim" style={{ marginBottom: 24 }} />
            <h3 style={{ marginBottom: 8 }}>Analyzing Clinical Profile</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Running symptom data through neurological risk models...</p>
          </div>
        )}

        {result && !isAnalyzing && (
          <div style={{ animation: 'fadeInUp 0.5s ease' }}>
            <div className="nm-card" style={{ padding: 24, marginBottom: 24, borderLeft: `6px solid ${result.riskLevel === 'High' ? '#EF4444' : result.riskLevel === 'Medium' ? '#F59E0B' : '#10B981'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>AI Assessment Result</div>
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 8 }}>{result.prediction}</h2>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className={`badge badge-${result.riskLevel === 'High' ? 'error' : result.riskLevel === 'Medium' ? 'warning' : 'success'}`}>
                      Risk Level: {result.riskLevel}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleReset}>
                  <RefreshCw size={14} /> New Assessment
                </button>
              </div>

              {result.riskLevel === 'High' && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4 }}>{result.recommendation || 'Immediate Follow-up Required'}</strong>
                    <span style={{ fontSize: '0.85rem' }}>The reported symptoms strongly correlate with significant neurological pathology. An urgent MRI scan and specialist consultation are highly recommended.</span>
                  </div>
                </div>
              )}

              <div className="nm-divider" style={{ margin: '24px 0' }}>Reported Profile</div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {Object.keys(selectedSymptoms).filter(k => selectedSymptoms[k]).map(key => {
                  const sym = symptomsList.find(s => s.id === key);
                  return (
                    <div key={key} style={{ background: 'rgba(16,185,129,0.1)', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', color: '#065F46', fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)' }}>
                      {sym.label}
                    </div>
                  );
                })}
              </div>

              {result.important_features && result.important_features.length > 0 && (
                <>
                  <div className="nm-divider" style={{ margin: '24px 0' }}>XAI: Highest Risk Contributors</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {result.important_features.slice(0, 4).map((f) => (
                      <div key={f} style={{ background: '#FEF2F2', padding: '8px 14px', borderRadius: 10, fontSize: '0.85rem', color: '#DC2626', fontWeight: 700, border: '1px solid #FCA5A5' }}>
                        {f.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                    * The model identified these specific symptoms as the primary drivers of the elevated risk score.
                  </div>
                </>
              )}
            </div>

            {(result.riskLevel === 'High' || result.riskLevel === 'Medium') && (
              <DoctorRecommendation condition={'Neurological Evaluation'} />
            )}
          </div>
        )}

      </div>
      <style>{`
        .clinical-banner {
          display: flex; align-items: center; justify-content: space-between;
        }
        .patient-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;
        }
        .symptom-grid {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        .symptom-card {
          padding: 16px 20px;
          border-radius: 16px;
          gap: 14px;
          align-items: flex-start;
        }
        .symptom-subtext {
          font-size: 0.8rem;
        }
        .symptom-icon-wrap {
          margin-top: 2px;
        }
        @media (max-width: 768px) {
          .clinical-banner {
            flex-direction: column; align-items: flex-start; gap: 16px;
            padding: 24px 20px !important;
          }
          .clinical-banner-img {
            right: -20% !important;
          }
          .patient-grid {
            grid-template-columns: 1fr;
          }
          .symptom-grid {
            grid-template-columns: 1fr;
          }
          .symptom-card {
            padding: 14px 16px;
            border-radius: 12px;
            gap: 12px;
            align-items: center;
          }
          .symptom-subtext {
            display: none;
          }
          .symptom-icon-wrap {
            margin-top: 0px;
          }
          .nm-card { padding: 16px !important; }
        }
        .pulse-anim {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ClinicalSymptoms;
