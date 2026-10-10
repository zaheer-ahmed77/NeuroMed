import React, { useState, useRef, useContext } from 'react';
import { ReactCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';
import {
  UploadCloud, AlertCircle, X, CheckCircle2,
  RefreshCw, Brain, Search, Eye, Activity,
  AlertTriangle, ShieldAlert, MessageCircle
} from 'lucide-react';
import './Dashboard.css';

const SYMPTOMS_LIST = [
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

const FusionAnalysis = ({ onAnalysisComplete }) => {
  const { token } = useContext(AuthContext);

  // General State
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  
  // MRI State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Clinical State
  const [symptoms, setSymptoms] = useState({});
  
  // Submit State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  /* ── MRI Handlers ── */
  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };
  
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCrop(undefined);
    setCompletedCrop(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg'));
  };

  /* ── Submit Handler ── */
  const handleAnalyzeClick = async () => {
    if (!selectedFile) {
      setError('Please upload an MRI scan for fusion analysis.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);

    let fileToUpload = selectedFile;
    if (completedCrop?.width > 0 && completedCrop?.height > 0 && imgRef.current) {
      try {
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        fileToUpload = new File([croppedBlob], selectedFile.name, { type: 'image/jpeg' });
        setPreviewUrl(URL.createObjectURL(croppedBlob));
      } catch (e) { console.error('Crop error', e); }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('symptoms', JSON.stringify(symptoms));
    if (patientName) formData.append('patient_name', patientName);

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/api/analyze/fusion`, {
        method: 'POST',
        headers,
        body: formData,
      });
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned an invalid or empty response. Is the backend running?');
      }

      if (response.status === 413) {
        throw new Error('The uploaded image is too large. Please upload an image smaller than 5MB.');
      }
      if (response.status === 422 && data.error === 'invalid_mri') {
        setError(data.message || 'Invalid MRI image. Please upload a valid grayscale brain MRI scan.');
        setIsAnalyzing(false);
        return;
      }
      if (!response.ok) {
        let errorMsg = 'Failed to analyze fusion data. Please try again.';
        if (data.error) {
          errorMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
        } else if (data.detail) {
          errorMsg = typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail;
        }
        throw new Error(errorMsg);
      }

      setResult(data);
      if (onAnalysisComplete) onAnalysisComplete();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during multimodal analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ── AI Chat ── */
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !result?.id) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysis_id: result.id, message: userMsg })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.9) return '#10B981';
    if (conf >= 0.75) return '#F59E0B';
    return '#EF4444';
  };
  
  const getTumorColor = (type) => {
    return (type || '').includes('No Tumor') ? '#10B981' : '#EF4444';
  };

  if (result) {
    return (
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24, padding: '0 10px' }}>
        {/* Result Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3B82F6', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
              Analysis / {result.id || 'BX-FUSION'}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Fusion Analysis Results</h2>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 4 }}>
              {new Date().toLocaleString()} · {result.patient_name || 'Unknown Patient'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={14} /> Completed
            </span>
            <button className="btn btn-outline" onClick={() => {
              const el = document.getElementById('fusion-chat-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} style={{ padding: '8px 16px' }}>
              <Brain size={16} /> Ask AI
            </button>
            <button className="btn btn-outline" onClick={handleReset} style={{ padding: '8px 16px' }}>
              <RefreshCw size={16} /> New Fusion
            </button>
          </div>
        </div>

        {/* Main Prediction Landscape Card */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border)', 
          borderRadius: 16, 
          padding: 24, 
          gap: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          flexWrap: 'wrap'
        }}>
          {/* Left: Model Prediction */}
          <div style={{ flex: '1 1 200px', borderRight: '1px solid var(--border)', paddingRight: 24 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 8 }}>FINAL FUSION DIAGNOSIS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getTumorColor(result.prediction), lineHeight: 1.2, marginBottom: 4 }}>
              {result.prediction}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>MRI + Clinical Synthesis</div>
          </div>

          {/* Middle: Confidence Score */}
          <div style={{ flex: '1 1 200px', borderRight: '1px solid var(--border)', paddingRight: 24 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 8 }}>FUSED CONFIDENCE</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getConfidenceColor(result.confidence), lineHeight: 1, marginBottom: 12 }}>
              {(result.confidence * 100).toFixed(1)}%
            </div>
            <div style={{ height: 6, background: 'var(--bg-surface-3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${result.confidence * 100}%`, background: getConfidenceColor(result.confidence), borderRadius: 3 }} />
            </div>
          </div>
          
          {/* Right: Clinical Risk */}
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 12 }}>CLINICAL RISK FACTORS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.important_features && result.important_features.length > 0 ? (
                result.important_features.slice(0, 3).map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#EF4444', fontWeight: 600 }}>
                    <Activity size={14} /> {f.replace(/_/g, ' ')}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>No high-risk symptoms selected.</div>
              )}
            </div>
          </div>
        </div>

        {/* Uncertainty Warning */}
        {result.warning && (
          <div className="alert alert-warning" style={{ borderLeft: '4px solid #F59E0B' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, color: '#D97706' }} />
            <div>
              <div style={{ fontWeight: 800, marginBottom: 4, fontSize: '0.9rem', color: '#92400E' }}>Higher Uncertainty Detected</div>
              <div style={{ fontSize: '0.85rem', color: '#B45309', lineHeight: 1.5 }}>{result.warning}</div>
            </div>
          </div>
        )}

        {/* Individual Modalities View */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={18} color="#3B82F6" /> MRI Model Analysis
            </div>
            <div style={{ background: '#0F172A', borderRadius: 8, height: 180, display: 'flex', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 }}>
              <img src={previewUrl} style={{ height: '100%', objectFit: 'contain' }} alt="MRI" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748B' }}>Standalone MRI Prediction:</span>
              <span style={{ fontWeight: 700, color: getTumorColor(result.mri_prediction) }}>{result.mri_prediction}</span>
            </div>
          </div>

          {result.heatmap_base64 && (
            <div style={{ flex: '1 1 300px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} color="#10B981" /> Grad-CAM Heatmap
              </div>
              <div style={{ background: '#0F172A', borderRadius: 8, height: 180, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={`data:image/jpeg;base64,${result.heatmap_base64}`} style={{ height: '100%', objectFit: 'contain' }} alt="Heatmap" />
              </div>
            </div>
          )}
        </div>

        {/* GenAI Explanation Card */}
        {result.explanation && (
          <div style={{ 
            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24,
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', letterSpacing: '1px', textTransform: 'uppercase' }}>GENAI EXPLANATION</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>AI Multimodal Interpretation</h3>
              </div>
            </div>
            
            <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {result.explanation}
            </div>
          </div>
        )}

        {/* AI Chat Assistant Section */}
        <div id="fusion-chat-section" style={{ 
          background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)', marginTop: 8
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Fusion AI Assistant</h3>
          </div>
          
          <div style={{ height: 300, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#F8FAFC' }}>
            {chatHistory.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#64748B' }}>
                <MessageCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Hi! I'm the AI Assistant.</div>
                <div style={{ fontSize: '0.85rem' }}>I can explain how the MRI and Clinical symptoms were fused together.</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                  {['Why is the fusion confidence different?', 'What are the main clinical risk factors?'].map(q => (
                    <button key={q} onClick={() => setChatInput(q)} style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', color: '#3B82F6', cursor: 'pointer' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, textAlign: msg.role === 'user' ? 'right' : 'left', padding: '0 4px' }}>
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div style={{
                    padding: '12px 16px', borderRadius: 16, fontSize: '0.9rem', lineHeight: 1.6,
                    background: msg.role === 'user' ? '#3B82F6' : '#fff',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    border: msg.role === 'user' ? 'none' : '1px solid #E2E8F0',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderTopLeftRadius: msg.role === 'user' ? 16 : 4,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', padding: '16px 24px', background: '#fff', borderTop: '1px solid var(--border)', gap: 12 }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about the fusion results..."
              style={{ flex: 1, padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: '0.9rem', outline: 'none', background: '#F8FAFC' }}
              disabled={isChatting}
            />
            <button type="submit" disabled={isChatting || !chatInput.trim()} className="btn btn-primary" style={{ padding: '0 24px', borderRadius: 12, fontWeight: 700 }}>
              {isChatting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        <div style={{ height: 40 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="fusion-banner" style={{
        borderRadius: 24, padding: '28px 32px',
        boxShadow: '0 10px 30px rgba(139,92,246,0.2)',
        position: 'relative', overflow: 'hidden'
      }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.3px' }}>
          Multimodal Fusion Analysis
        </h2>
        <p style={{ color: '#E9D5FF', fontSize: '0.95rem', maxWidth: 700, lineHeight: 1.5 }}>
          Provide both an MRI scan and clinical symptoms. Our AI will fuse predictions from the Swin Transformer and Logistic Regression models for a robust, unified diagnosis.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: MRI Upload */}
        <div className="ios-card" style={{ flex: '1 1 350px', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Brain size={20} color="#3B82F6" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Step 1: MRI Scan</h3>
          </div>
          
          {!previewUrl ? (
            <>
              <input type="file" ref={fileInputRef} onChange={e => processFile(e.target.files[0])} accept="image/*" style={{ display: 'none' }} />
              <div
                onClick={() => fileInputRef.current.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                style={{ 
                  height: 200, gap: 12, 
                  background: isDragOver ? 'rgba(59,130,246,0.05)' : '#F8FAFC',
                  border: `2px dashed ${isDragOver ? '#3B82F6' : '#CBD5E1'}`,
                  borderRadius: 16,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <UploadCloud size={28} color={isDragOver ? '#3B82F6' : '#94A3B8'} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>Upload Brain MRI</p>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Grayscale JPG/PNG</p>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ maxHeight: 240, position: 'relative', overflow: 'hidden', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                  <img ref={imgRef} src={previewUrl} alt="MRI" style={{ maxHeight: 240, objectFit: 'contain', display: 'block', margin: '0 auto' }} onLoad={e => { imgRef.current = e.currentTarget; }} />
                </ReactCrop>
              </div>
              <button onClick={() => setPreviewUrl('')} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                <RefreshCw size={14} /> Change Image
              </button>
            </div>
          )}
        </div>

        {/* Right: Clinical Symptoms */}
        <div className="ios-card" style={{ flex: '2 1 450px', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={20} color="#10B981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Step 2: Clinical Profile</h3>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Patient Name</label>
              <input type="text" className="nm-input" placeholder="e.g. John Doe (Optional)" value={patientName} onChange={e => setPatientName(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Age</label>
              <input type="number" className="nm-input" placeholder="e.g. 45 (Optional)" value={patientAge} onChange={e => setPatientAge(e.target.value)} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, maxHeight: '350px', overflowY: 'auto', paddingRight: 8 }} className="symptoms-grid">
            {SYMPTOMS_LIST.map(sym => (
              <label key={sym.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px',
                background: symptoms[sym.id] ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${symptoms[sym.id] ? '#86EFAC' : '#E2E8F0'}`,
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={!!symptoms[sym.id]}
                  onChange={(e) => setSymptoms({ ...symptoms, [sym.id]: e.target.checked ? 1 : 0 })}
                  style={{ marginTop: 4, width: 16, height: 16, accentColor: '#10B981' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{sym.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>{sym.sub}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Action Footer */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div className="alert alert-error" style={{ width: '100%' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAnalyzeClick}
              disabled={isAnalyzing || !selectedFile}
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1rem', background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', border: 'none', opacity: (isAnalyzing || !selectedFile) ? 0.7 : 1 }}
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} />
                  Fusing Models...
                </>
              ) : (
                <>
                  <Search size={18} /> Run Multimodal Fusion
                </>
              )}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FusionAnalysis;
