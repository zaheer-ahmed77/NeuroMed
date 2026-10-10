import React, { useState, useRef, useContext, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UploadCloud, Image as ImageIcon, Search, AlertCircle, RefreshCw,
  FileText, X, CheckCircle2, AlertTriangle, ZoomIn, ZoomOut,
  Maximize2, Brain, Cpu, Eye, FileCheck, ChevronRight, Download, MessageCircle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ReactCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import html2pdf from 'html2pdf.js';
import API_BASE from '../config';
import DoctorRecommendation from './DoctorRecommendation';

/* ══════════════════════════════════════════════════════════
   HELPER: Confidence Color
═══════════════════════════════════════════════════════════ */
const getConfidenceColor = (conf) => {
  if (conf >= 0.80) return '#10B981';
  if (conf >= 0.55) return '#F59E0B';
  return '#EF4444';
};

const getTumorColor = (prediction) => {
  if (!prediction) return '#64748B';
  return prediction === 'No Tumor' ? '#10B981' : '#EF4444';
};

/* ══════════════════════════════════════════════════════════
   PROCESSING STEPS ANIMATION
═══════════════════════════════════════════════════════════ */
const processingSteps = [
  { icon: <UploadCloud size={18} />, label: 'Preparing image' },
  { icon: <ImageIcon size={18} />, label: 'Validating MRI format' },
  { icon: <Cpu size={18} />, label: 'Running PyTorch model inference' },
  { icon: <Eye size={18} />, label: 'Computing confidence scores' },
  { icon: <FileCheck size={18} />, label: 'Preparing results' },
];

const AnalyzingState = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(s => Math.min(s + 1, processingSteps.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="analyzing-container">
      {/* Pulse ring */}
      <div className="pulse-ring">
        <Brain size={32} color="var(--brand-primary-400)" />
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Analyzing MRI Scan
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
          Please wait while the AI model processes the image
        </div>
      </div>

      {/* Step indicators */}
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {processingSteps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            opacity: i <= currentStep ? 1 : 0.25,
            transition: 'opacity 0.4s ease',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < currentStep
                ? 'rgba(16, 185, 129, 0.12)'
                : i === currentStep
                  ? 'rgba(30, 64, 175, 0.12)'
                  : 'var(--bg-surface-3)',
              border: i < currentStep
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : i === currentStep
                  ? '1px solid rgba(30, 64, 175, 0.3)'
                  : '1px solid var(--border)',
              color: i < currentStep
                ? '#10B981'
                : i === currentStep
                  ? 'var(--brand-primary-400)'
                  : '#475569',
              transition: 'all 0.4s ease',
            }}>
              {i < currentStep ? <CheckCircle2 size={14} /> : step.icon}
            </div>
            <span style={{
              fontSize: '0.82rem', fontWeight: 500,
              color: i < currentStep ? '#10B981' : i === currentStep ? 'var(--text-primary)' : '#475569',
            }}>
              {step.label}
              {i === currentStep && (
                <span style={{ marginLeft: 4, color: '#64748B' }}>
                  <span style={{ animation: 'dot-blink 1.4s 0s infinite', display: 'inline-block' }}>.</span>
                  <span style={{ animation: 'dot-blink 1.4s 0.2s infinite', display: 'inline-block' }}>.</span>
                  <span style={{ animation: 'dot-blink 1.4s 0.4s infinite', display: 'inline-block' }}>.</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const UploadArea = ({ onAnalysisComplete }) => {
  const [uploadState, setUploadState] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState('overlay');
  
  // AI Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const imgRef = useRef(null);
  const reportRef = useRef(null);
  const fileInputRef = useRef(null);
  const errorRef = useRef(null);
  const { token, user, isDemoMode } = useContext(AuthContext);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  /* ── File Handling ── */
  const processFile = (file) => {
    if (!file) return;
    // Basic type check
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB. Please upload a smaller image.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState('preview');
    setError(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setPatientName('');
    setShowPatientModal(true);
  };

  const handleFileChange = (event) => {
    processFile(event.target.files[0]);
    event.target.value = ''; // reset so same file can be re-selected
  };

  /* ── Drag & Drop ── */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  /* ── Crop ── */
  const onLoad = useCallback((img) => {
    imgRef.current = img.target;
  }, []);

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg'));
  };

  /* ── Analyze ── */
  const handleAnalyzeClick = async () => {
    if (!selectedFile) return;
    setUploadState('analyzing');
    setError(null);

    let fileToUpload = selectedFile;

    if (completedCrop?.width > 0 && completedCrop?.height > 0 && imgRef.current) {
      try {
        const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
        fileToUpload = new File([croppedBlob], selectedFile.name, { type: 'image/jpeg' });
        setPreviewUrl(URL.createObjectURL(croppedBlob));
      } catch (e) {
        console.error('Crop error', e);
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    if (patientName) formData.append('patient_name', patientName);

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/api/v1/analyze`, {
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
        setUploadState('preview');
        return;
      }
      if (!response.ok) {
        let errorMsg = 'Failed to analyze image. Please try again.';
        if (data.error) {
          errorMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
        } else if (data.detail) {
          errorMsg = typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail;
        }
        throw new Error(errorMsg);
      }

      setPrediction(data);
      setUploadState('result');
      if (onAnalysisComplete) onAnalysisComplete();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Cannot connect to the backend server. Please ensure the Python backend is running on port 8000.');
      } else {
        setError(err.message);
      }
      setUploadState('preview');
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrediction(null);
    setError(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setPatientName('');
    setUploadState('upload');
    setIsDragOver(false);
  };

  /* ── PDF Report ── */
  const downloadReport = async () => {
    if (!prediction || !prediction.id) return;
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE}/api/v1/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysis_id: prediction.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      window.open(`${API_BASE}${data.file_url}`, '_blank');
    } catch (e) {
      alert(`Failed to generate report: ${e.message}`);
    }
  };

  /* ── AI Chat ── */
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !prediction?.id) return;

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
        body: JSON.stringify({ analysis_id: prediction.id, message: userMsg })
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

  /* ══════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="content-area">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        aria-label="Upload MRI scan"
      />

      {/* Demo Mode Notice */}
      {isDemoMode && uploadState === 'upload' && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 100,
          background: 'rgba(13,148,136,0.08)',
          borderBottom: '1px solid rgba(13,148,136,0.2)',
          padding: '8px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#2DD4BF', fontWeight: 600 }}>⚡ Demo Mode</span>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>—</span>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>You can explore the full UI. MRI analysis requires the Python backend running on port 8000.</span>
        </div>
      )}

      {/* ────── Patient Name Modal ────── */}
      {showPatientModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 16 }}
          onClick={() => setShowPatientModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface-2)', border: '1px solid var(--border-medium)',
              borderRadius: 20, width: '100%', maxWidth: 400, padding: 28,
              animation: 'fadeInUp 0.3s ease', boxShadow: 'var(--shadow-xl)',
            }}
          >
            <button
              onClick={() => setShowPatientModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(30,64,175,0.1)', border: '1px solid rgba(30,64,175,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <FileText size={20} color="var(--brand-primary-400)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Patient Information</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
                Enter the patient's name for the assessment report. This field is optional.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="patient-name-input" className="nm-label">Patient Name (Optional)</label>
              <input
                id="patient-name-input"
                type="text"
                placeholder="e.g. John Doe"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="nm-input"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && setShowPatientModal(false)}
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowPatientModal(false)}
              style={{ padding: 12 }}
            >
              Continue to Analysis <ChevronRight size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ────── UPLOAD STATE ────── */}
      {uploadState === 'upload' && (
        <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Banner */}
          <div className="upload-banner" style={{
            borderRadius: 24, padding: '28px 32px',
            boxShadow: '0 10px 30px rgba(59,130,246,0.2)',
            marginBottom: 8, position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div className="upload-banner-img" style={{ position: 'absolute', right: '-10%', top: '-50%', width: 300, opacity: 0.1, pointerEvents: 'none' }}>
              <img src="/network_brain.webp" alt="" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.3px' }}>MRI Analysis Engine</h2>
              <p style={{ color: '#BFDBFE', fontSize: '0.95rem' }}>Upload DICOM or standard image formats for instant AI tumor classification.</p>
            </div>
            <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <UploadCloud size={20} color="#FFFFFF" />
              <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.9rem' }}>Fast & Secure</span>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload MRI scan — click or drag and drop"
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current.click()}
            style={{ 
              height: 240, gap: 16, 
              background: isDragOver ? 'rgba(59,130,246,0.05)' : '#fff',
              border: `2px dashed ${isDragOver ? '#3B82F6' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 24,
              boxShadow: isDragOver ? '0 10px 40px rgba(59,130,246,0.1)' : '0 4px 20px rgba(0,0,0,0.03)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: isDragOver ? 'rgba(59,130,246,0.1)' : 'rgba(243,244,246,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isDragOver ? 'scale(1.05)' : 'scale(1)'
            }}>
              <UploadCloud size={36} color={isDragOver ? '#3B82F6' : '#6B7280'} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                {isDragOver ? 'Drop the MRI scan here' : 'Click or Drag & Drop'}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                Upload a grayscale Brain MRI scan
              </p>
            </div>
          </div>

          {/* Error on upload state */}
          {error && (
            <div ref={errorRef} className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: <Brain size={20} color="#3B82F6" />, title: 'Deep Learning', desc: 'CNN model classifies 4 tumor categories' },
              { icon: <Search size={20} color="#10B981" />, title: 'MRI Validation', desc: 'Automatic image quality checks' },
              { icon: <Eye size={20} color="#3B82F6" />, title: 'Smart Crop', desc: 'Select region of interest before analysis' },
              { icon: <FileText size={20} color="#10B981" />, title: 'PDF Report', desc: 'Export professional assessment report' },
            ].map(card => (
              <div key={card.title} className="ios-card" style={{
                padding: '20px', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(243,244,246,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>{card.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.4 }}>{card.desc}</div>
              </div>
            ))}
          </div>

          {/* Supported formats */}
          <div className="ios-card" style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(243,244,246,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={18} color="#475569" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supported Formats</div>
              <div style={{ fontSize: '0.85rem', color: '#111827', marginTop: 2, fontWeight: 500 }}>JPG, PNG, WEBP · Max 10MB</div>
            </div>
          </div>
        </div>
      )}

      {/* ────── PREVIEW / CROP STATE ────── */}
      {uploadState === 'preview' && (
        <div className="crop-container">
          <div style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Review MRI Scan</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                  Optionally drag to crop a region of interest before analysis
                </div>
              </div>
              <button
                onClick={handleReset}
                className="btn btn-outline btn-sm"
                aria-label="Remove image and start over"
              >
                <X size={14} /> Remove
              </button>
            </div>

            {error && (
              <div ref={errorRef} className="alert alert-error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="crop-frame" style={{ maxHeight: 420, position: 'relative', overflow: 'hidden' }}>
              {previewUrl && (
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  style={{ maxHeight: '420px' }}
                >
                  <img
                    src={previewUrl}
                    onLoad={onLoad}
                    alt="Uploaded MRI scan"
                    style={{ maxHeight: '420px', objectFit: 'contain', display: 'block' }}
                  />
                </ReactCrop>
              )}
            </div>

            {/* Patient info display */}
            {patientName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-info"><FileText size={11} /> {patientName}</span>
                <button onClick={() => setShowPatientModal(true)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-family)', textDecoration: 'underline' }}>
                  Edit
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleAnalyzeClick} style={{ flex: 1, padding: '12px' }}>
                <Search size={17} /> Analyze MRI
              </button>
              <button className="btn btn-outline" onClick={() => setShowPatientModal(true)} title="Edit patient name">
                <FileText size={16} />
              </button>
              <button className="btn btn-outline" onClick={handleReset} title="Upload a different image">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────── ANALYZING STATE ────── */}
      {uploadState === 'analyzing' && <AnalyzingState />}

      {/* ────── RESULT STATE ────── */}
      {uploadState === 'result' && prediction && (
        <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24, padding: '0 10px' }}>

          {/* Result Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3B82F6', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
                Analysis / {prediction.id || 'BX-UNKNOWN'}
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Analysis Results</h2>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 4 }}>
                {new Date().toLocaleString()} · {prediction.patient_name || 'Unknown Patient'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                <CheckCircle2 size={14} /> Completed
              </span>
              <button className="btn btn-primary" onClick={downloadReport} style={{ padding: '8px 16px' }}>
                <FileText size={16} /> Generate Report
              </button>
              <button className="btn btn-outline" onClick={() => {
                const el = document.getElementById('ai-assistant-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} style={{ padding: '8px 16px' }}>
                <Brain size={16} /> Ask AI
              </button>
              <button className="btn btn-outline" onClick={handleReset} style={{ padding: '8px 16px' }}>
                <RefreshCw size={16} /> New
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
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 8 }}>MODEL PREDICTION</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: getTumorColor(prediction.prediction), lineHeight: 1.2, marginBottom: 4 }}>
                {prediction.prediction}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Predicted Tumor Type</div>
            </div>

            {/* Middle: Confidence Score */}
            <div style={{ flex: '1 1 250px', borderRight: '1px solid var(--border)', paddingRight: 24 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 8 }}>CONFIDENCE SCORE</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getConfidenceColor(prediction.confidence), lineHeight: 1, marginBottom: 12 }}>
                {(prediction.confidence * 100).toFixed(1)}%
              </div>
              <div style={{ height: 6, background: 'var(--bg-surface-3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${prediction.confidence * 100}%`, background: getConfidenceColor(prediction.confidence), borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Model confidence, not clinical probability.</div>
            </div>

            {/* Right: Class Probabilities */}
            <div style={{ flex: '1 1 250px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', marginBottom: 12 }}>CLASS PROBABILITIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {prediction.probabilities && Object.entries(prediction.probabilities).map(([cls, prob]) => {
                  const pct = (prob * 100).toFixed(1);
                  const isTop = cls === prediction.prediction;
                  return (
                    <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                      <div style={{ width: 90, fontWeight: isTop ? 700 : 500, color: isTop ? 'var(--text-primary)' : '#64748B' }}>{cls}</div>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isTop ? getTumorColor(cls) : '#CBD5E1', borderRadius: 3 }} />
                      </div>
                      <div style={{ width: 45, textAlign: 'right', fontWeight: 600, color: isTop ? 'var(--text-primary)' : '#94A3B8' }}>{pct}%</div>
                    </div>
                  );
                })}
                {!prediction.probabilities && (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Detailed probabilities unavailable.</div>
                )}
              </div>
            </div>
          </div>

          {/* Uncertainty Warning */}
          {prediction.warning && (
            <div className="alert alert-warning" style={{ borderLeft: '4px solid #F59E0B' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, color: '#D97706' }} />
              <div>
                <div style={{ fontWeight: 800, marginBottom: 4, fontSize: '0.9rem', color: '#92400E' }}>Higher Uncertainty Detected</div>
                <div style={{ fontSize: '0.85rem', color: '#B45309', lineHeight: 1.5 }}>{prediction.warning}</div>
              </div>
            </div>
          )}

          {/* Explainable AI - Grad-CAM Visualization Landscape */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 16, 
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Explainable AI — Grad-CAM Visualization</h3>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface-2)', padding: 4, borderRadius: 8 }}>
                {/* Functional Tabs */}
                {['original', 'heatmap', 'overlay'].map((tab) => (
                  <div key={tab} onClick={() => setActiveImageTab(tab)} style={{ 
                    padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    background: activeImageTab === tab ? '#fff' : 'transparent',
                    color: activeImageTab === tab ? '#3B82F6' : '#64748B',
                    borderRadius: 6,
                    boxShadow: activeImageTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    {tab}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#0F172A', padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              {activeImageTab === 'original' && previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Original MRI" 
                  style={{ maxHeight: 350, objectFit: 'contain', borderRadius: 8, border: '1px solid #334155', transition: 'opacity 0.3s' }} 
                />
              )}
              {activeImageTab === 'heatmap' && prediction.pure_heatmap_base64 && (
                <img 
                  src={`data:image/jpeg;base64,${prediction.pure_heatmap_base64}`} 
                  alt="Grad-CAM Heatmap" 
                  style={{ maxHeight: 350, objectFit: 'contain', borderRadius: 8, border: '1px solid #334155', transition: 'opacity 0.3s' }} 
                />
              )}
              {activeImageTab === 'overlay' && prediction.heatmap_base64 && (
                <img 
                  src={`data:image/jpeg;base64,${prediction.heatmap_base64}`} 
                  alt="Grad-CAM Overlay" 
                  style={{ maxHeight: 350, objectFit: 'contain', borderRadius: 8, border: '1px solid #334155', transition: 'opacity 0.3s' }} 
                />
              )}
              
              {/* Fallbacks */}
              {activeImageTab === 'heatmap' && !prediction.pure_heatmap_base64 && (
                <div style={{ textAlign: 'center', color: '#475569' }}>
                  <Eye size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div>Heatmap visualization unavailable</div>
                </div>
              )}
              {activeImageTab === 'overlay' && !prediction.heatmap_base64 && (
                <div style={{ textAlign: 'center', color: '#475569' }}>
                  <Eye size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div>Overlay visualization unavailable</div>
                </div>
              )}
            </div>
          </div>

          {/* GenAI Explanation Card */}
          {prediction.explanation && (
            <div style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 16, 
              padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', letterSpacing: '1px', textTransform: 'uppercase' }}>GENAI EXPLANATION</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>What does this result mean?</h3>
                </div>
              </div>
              
              <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {prediction.explanation}
              </div>
              
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button 
                  onClick={() => {
                    const el = document.getElementById('ai-assistant-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 }}
                >
                  Ask follow-up questions <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* AI Chat Assistant Section */}
          <div id="ai-assistant-section" style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 16, 
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            marginTop: 8
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>AI Assistant</h3>
            </div>
            
            <div style={{ height: 300, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#F8FAFC' }}>
              {chatHistory.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#64748B' }}>
                  <MessageCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Hi! I'm the AI Assistant.</div>
                  <div style={{ fontSize: '0.85rem' }}>I can answer questions about the current MRI analysis results.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                    {['Explain this result in simple words.', 'Why did the AI predict this tumor type?', 'What does the highlighted region represent?'].map(q => (
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
                placeholder="Ask about the analysis results..."
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
      )}

      {/* ────── HIDDEN PDF REPORT TEMPLATE ────── */}
      <div ref={reportRef} style={{ display: 'none', background: 'white', color: '#1a1a1a', padding: '32px 36px', width: '750px', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {prediction && (
          <>
            {/* Report Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, marginBottom: 24, borderBottom: '2px solid #1E40AF' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>N</span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#1E40AF', letterSpacing: '0.5px' }}>NeuroMed</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>Explainable Multimodal AI · Diagnostic Report</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#475569' }}>
                <div><strong>Date:</strong> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'monospace', color: '#94A3B8' }}>
                  Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Patient & Scan Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', marginBottom: 10 }}>Patient Information</div>
                <div style={{ marginBottom: 6 }}><strong>Name:</strong> {prediction.patient_name || 'Not Provided'}</div>
                <div><strong>Reviewed by:</strong> {user?.fullName || 'NeuroMed User'}</div>
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', marginBottom: 10 }}>Scan Details</div>
                <div style={{ marginBottom: 6 }}><strong>File:</strong> {prediction.filename}</div>
                <div><strong>Type:</strong> Brain MRI (Grayscale)</div>
              </div>
            </div>

            {/* MRI Image */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img src={previewUrl} alt="MRI Scan" style={{ maxHeight: 260, borderRadius: 10, border: '1px solid #E2E8F0' }} />
            </div>

            {/* AI Results */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, borderLeft: `5px solid ${prediction.prediction === 'No Tumor' ? '#10B981' : '#EF4444'}`, marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E40AF', marginBottom: 14 }}>AI Analysis Results</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 }}>
                <span>Classification:</span>
                <strong style={{ color: prediction.prediction === 'No Tumor' ? '#10B981' : '#EF4444' }}>{prediction.prediction}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                <span>Model Confidence:</span>
                <strong>{(prediction.confidence * 100).toFixed(2)}%</strong>
              </div>
            </div>

            {/* Warning */}
            {prediction.warning && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 4 }}>⚠ Higher Uncertainty Detected</div>
                <div style={{ fontSize: 13, color: '#78350F' }}>{prediction.warning}</div>
              </div>
            )}

            {/* Disclaimer */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, fontSize: 11, color: '#94A3B8', lineHeight: 1.6 }}>
              <strong>Disclaimer:</strong> This report was generated by NeuroMed, an academic research prototype developed at Mehran University of Engineering and Technology.
              It is intended solely as a research and educational tool and does not constitute a clinical medical diagnosis.
              Results must be interpreted and verified by qualified medical professionals.
              NeuroMed does not accept liability for clinical decisions made based on this output.
            </div>
          </>
        )}
      </div>

      {/* Keyframe styles for dot animation */}
      <style>{`
        @keyframes dot-blink {
          0%, 80%, 100% { opacity: 0; }
          40%           { opacity: 1; }
        }
        @media (max-width: 640px) {
          .upload-zone { height: 200px !important; }
          .upload-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px;
            padding: 24px 20px !important;
          }
          .upload-banner-img { right: -20% !important; }
        }
      `}</style>
    </div>
  );
};

export default UploadArea;
