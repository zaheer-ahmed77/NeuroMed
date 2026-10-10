import React, { useState, useEffect, useContext, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import UploadArea from './UploadArea';
import ClinicalSymptoms from './ClinicalSymptoms';
import FusionAnalysis from './FusionAnalysis';
import DoctorRecommendation from './DoctorRecommendation';
import Profile from './Profile';
import HistoryPage from './HistoryPage';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';
import Settings from './Settings';
import './Dashboard.css';
import {
  Microscope, Activity, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, Upload,
  Brain, Stethoscope, ArrowRight, BarChart3,
  FileText, Zap, ChevronRight
} from 'lucide-react';

/* ═══════════════════════════════════════════
   BITMOJI DOCTOR SVG — Dashboard Welcome
═══════════════════════════════════════════ */
const DoctorBitmoji = () => (
  <svg width="110" height="130" viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="22" y="72" width="66" height="55" rx="14" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5"/>
    <path d="M55 82 L40 72 L40 110" stroke="#CBD5E1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M55 82 L70 72 L70 110" stroke="#CBD5E1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M48 90 L55 86 L62 90 L60 106 L55 108 L50 106 Z" fill="#1E40AF" opacity="0.15"/>
    <path d="M36 88 C32 92 30 100 34 106" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="34" cy="108" r="4" fill="#0D9488" opacity="0.8"/>
    <path d="M36 88 C40 84 44 84 46 88" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <rect x="48" y="60" width="14" height="16" rx="4" fill="#D4956A"/>
    <ellipse cx="55" cy="46" rx="22" ry="24" fill="#D4956A"/>
    <path d="M33 40 C33 22 43 16 55 16 C67 16 77 22 77 40 C77 34 74 28 68 26 C62 24 48 24 42 26 C36 28 33 34 33 40Z" fill="#1C1917"/>
    <ellipse cx="46" cy="46" rx="3.5" ry="4" fill="#fff"/>
    <ellipse cx="64" cy="46" rx="3.5" ry="4" fill="#fff"/>
    <circle cx="47" cy="46" r="2" fill="#1C1917"/>
    <circle cx="65" cy="46" r="2" fill="#1C1917"/>
    <circle cx="48" cy="45" r="0.7" fill="#fff"/>
    <circle cx="66" cy="45" r="0.7" fill="#fff"/>
    <path d="M42 40 C44 38 49 38 51 40" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M59 40 C61 38 66 38 68 40" stroke="#1C1917" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M47 55 C50 59 60 59 63 55" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <rect x="68" y="90" width="22" height="28" rx="5" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
    <rect x="71" y="93" width="16" height="18" rx="3" fill="#DBEAFE"/>
    <path d="M22 85 C14 78 10 70 14 64 C16 60 20 62 20 66" stroke="#D4956A" strokeWidth="5" strokeLinecap="round" fill="none"/>
    <path d="M14 64 C12 58 16 54 19 58" stroke="#D4956A" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <path d="M19 58 C18 52 22 50 24 54" stroke="#D4956A" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <path d="M24 54 C24 48 28 48 28 52" stroke="#D4956A" strokeWidth="3" strokeLinecap="round" fill="none"/>
  </svg>
);

/* ═══════════════════════════════════════════
   KPI STAT CARD
═══════════════════════════════════════════ */
const KpiCard = ({ label, value, subtext, icon: Icon, iconColor, iconBg, trend, onClick }) => (
  <div onClick={onClick} style={{
    padding: '24px',
    flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12,
    cursor: onClick ? 'pointer' : 'default'
  }} className="ios-card kpi-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={iconColor} />
      </div>
      {trend != null && (
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: trend >= 0 ? '#10B981' : '#EF4444', background: trend >= 0 ? '#F0FDF4' : '#FEF2F2', padding: '4px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={12} style={{ transform: trend < 0 ? 'scaleY(-1)' : 'none' }} /> {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#111827', lineHeight: 1, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', marginTop: 8 }}>{label}</div>
      {subtext && <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 2 }}>{subtext}</div>}
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   QUICK ACTION CARD
═══════════════════════════════════════════ */
const QuickAction = ({ icon: Icon, iconColor, iconBg, title, desc, onClick }) => (
  <div onClick={onClick} style={{
    padding: '20px 24px',
    flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 16,
    cursor: 'pointer'
  }} className="ios-card quick-action-card">
    <div style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={22} color={iconColor} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 2 }}>{desc}</div>
    </div>
    <ChevronRight size={18} color="#D1D5DB" />
  </div>
);

/* ═══════════════════════════════════════════
   MINI ACTIVITY CHART (SVG bar chart)
═══════════════════════════════════════════ */
const ActivityChart = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...data, 1);
  const total = data.reduce((a, b) => a + b, 0);
  return (
    <div className="ios-card" style={{ padding: '24px', flex: '1 1 340px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Weekly Activity</div>
          <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 4 }}>Scans analyzed by day</div>
        </div>
        <div style={{ padding: '4px 10px', background: '#F0FDF4', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, color: '#10B981' }}>{total} Total</div>
      </div>
      <svg width="100%" height="120" viewBox="0 0 280 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id="barInactive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DBEAFE" />
            <stop offset="100%" stopColor="#EFF6FF" />
          </linearGradient>
        </defs>
        {data.map((val, i) => {
          const barH = (val / maxVal) * 90;
          const x = i * 40 + 5;
          return (
            <g key={i} style={{ transition: 'all 0.3s' }}>
              <rect x={x} y={100 - barH} width="28" height={barH} rx="6"
                fill={i === data.length - 1 ? 'url(#barActive)' : 'url(#barInactive)'}
                stroke="none" />
              <text x={x + 14} y="118" textAnchor="middle" fontSize="9" fill={i === data.length - 1 ? '#1E40AF' : '#9CA3AF'} fontWeight={i === data.length - 1 ? "800" : "600"}>{days[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════
   RECENT SCANS LIST
═══════════════════════════════════════════ */
const RecentScans = ({ onViewAll, scans }) => {
  const getRiskLabel = (pred, type) => {
    if (type === 'clinical') {
      return pred === 'High symptom-based risk' 
        ? { bg: '#FEF2F2', color: '#DC2626', label: 'High' } 
        : { bg: '#F0FDF4', color: '#16A34A', label: 'Low' };
    }
    return pred === 'No Tumor' 
      ? { bg: '#F0FDF4', color: '#16A34A', label: 'Clear' } 
      : { bg: '#FEF2F2', color: '#DC2626', label: 'High' };
  };

  const formatDate = (timestamp) => {
    try {
      const utcString = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
      return new Date(utcString).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    } catch { return 'Recently'; }
  };

  return (
    <div className="ios-card" style={{ padding: '24px', flex: '1 1 340px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Recent Scans</div>
          <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 4 }}>Latest analysis results</div>
        </div>
        <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#1E40AF', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          View All <ArrowRight size={14} />
        </button>
      </div>
      
      {scans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: '0.85rem' }}>No recent assessments found.</div>
      ) : (
        scans.map((scan, i) => {
          const risk = getRiskLabel(scan.prediction, scan.type);
          const isClinical = scan.type === 'clinical';
          return (
            <div key={scan.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: risk.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isClinical ? <Activity size={18} color={risk.color} /> : <Brain size={18} color={risk.color} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scan.patient_name === 'Unknown Patient' ? 'Anonymous' : (scan.patient_name || 'Anonymous')} {isClinical && <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>(Clinical)</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scan.prediction} • {formatDate(scan.timestamp)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E40AF' }}>{(scan.confidence * 100).toFixed(1)}%</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: risk.color, background: risk.bg, padding: '3px 10px', borderRadius: 99 }}>{risk.label}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MINI BITMOJI: Thumbs Up (for empty states)
═══════════════════════════════════════════ */
const BitmojiThumbsUp = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <circle cx="30" cy="30" r="28" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5"/>
    <ellipse cx="30" cy="25" rx="12" ry="13" fill="#D4956A"/>
    <path d="M18 22 C18 13 24 9 30 9 C36 9 42 13 42 22 C42 18 40 14 36 13 C32 12 28 12 24 13 C20 14 18 18 18 22Z" fill="#1C1917"/>
    <ellipse cx="25" cy="25" rx="2" ry="2.5" fill="#fff"/>
    <ellipse cx="35" cy="25" rx="2" ry="2.5" fill="#fff"/>
    <circle cx="26" cy="25" r="1.2" fill="#1C1917"/>
    <circle cx="36" cy="25" r="1.2" fill="#1C1917"/>
    <path d="M26 31 C28 34 32 34 34 31" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    {/* Thumbs up */}
    <path d="M42 34 C46 30 50 28 50 32 L50 42 C50 46 48 48 44 48 L38 48" stroke="#D4956A" strokeWidth="4" strokeLinecap="round" fill="none"/>
    <path d="M50 32 C52 28 54 30 52 34" stroke="#D4956A" strokeWidth="3" strokeLinecap="round" fill="none"/>
  </svg>
);

/* ═══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════ */
const Dashboard = ({ onLogout, navigate }) => {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'overview';
  });
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }, 0);
    }
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyItems, setHistoryItems] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setHistoryItems(await res.json());
      } catch (e) { console.error(e); }
    };
    if (token) fetchHistory();
  }, [token, refreshHistory]);

  const handleAnalysisComplete = () => setRefreshHistory(prev => prev + 1);

  // Compute KPI data
  const totalAnalyses = historyItems.length;
  const criticalCases = historyItems.filter(h => h.prediction !== 'No Tumor' && h.prediction !== 'Low symptom-based risk').length;
  const recentItems = historyItems.slice(0, 3);
  
  // Compute Chart Data (Mon - Sun)
  const chartData = [0, 0, 0, 0, 0, 0, 0];
  historyItems.forEach(item => {
    try {
      const date = new Date(item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z');
      const dayIdx = (date.getDay() + 6) % 7; // Mon=0, Sun=6
      chartData[dayIdx] += 1;
    } catch (e) {}
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard-container">
      <Sidebar
        navigate={navigate} setActiveTab={handleTabChange} activeTab={activeTab}
        refreshHistory={refreshHistory} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      />
      <div className={`main-area ${sidebarOpen ? '' : 'main-area-expanded'}`} style={{
        backgroundColor: '#FAFAFA',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1.2px, transparent 1.2px)',
        backgroundSize: '16px 16px',
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Background Atmosphere */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '50%', background: 'radial-gradient(circle, rgba(30,64,175,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '30%', height: '40%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <Header onLogout={onLogout} setActiveTab={handleTabChange} sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen} activeTab={activeTab} />

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px 0', position: 'relative', zIndex: 100 }}>

          {/* ═══════ OVERVIEW TAB ═══════ */}
          {activeTab === 'overview' && (
            <div style={{ padding: '20px 24px 0' }}>

              {/* ── Welcome Banner ── */}
              <div className="dash-banner" style={{
                borderRadius: 24,
                boxShadow: '0 10px 40px rgba(30,64,175,0.15), inset 0 1px 1px rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 24, overflow: 'hidden', position: 'relative'
              }}>
                {/* Brain Overlay */}
                <img src="/network_brain.webp" alt="" style={{
                  position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)',
                  width: 320, opacity: 0.15, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 1
                }} />

                {/* Subtle dot pattern inside banner */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.2px, transparent 1.2px)', backgroundSize: '14px 14px', pointerEvents: 'none', zIndex: 0 }} />

                <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93C5FD', background: 'rgba(59,130,246,0.15)', padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(147,197,253,0.2)' }}>
                      NeuroMed AI Dashboard
                    </span>
                  </div>
                  <h1 className="dash-banner-title" style={{ fontWeight: 900, color: '#FFFFFF', marginBottom: 8, letterSpacing: '-0.5px' }}>
                    {greeting}, Doctor 👋
                  </h1>
                  <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500 }}>
                    Your workspace is ready. Upload an MRI scan or check your recent results below.
                  </p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
                      <span style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 600 }}>AI Model Online</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Clock size={14} color="#94A3B8" />
                      <span style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 600 }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: '5%', zIndex: 2 }} className="dash-bitmoji">
                  <img src="/doctor_bitmoji.webp" alt="Doctor greeting" style={{ 
                    height: '100%', objectFit: 'contain', display: 'block',
                    filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.3))'
                  }} />
                </div>
              </div>

              {/* ── KPI Stats Row ── */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                <KpiCard label="Total Analyses" value={totalAnalyses.toString()} subtext="All time" icon={Microscope} iconColor="#1E40AF" iconBg="rgba(30,64,175,0.08)" />
                <KpiCard label="Assessments" value={(historyItems.filter(h => h.type === 'clinical').length).toString()} subtext="Clinical" icon={Activity} iconColor="#7C3AED" iconBg="rgba(124,58,237,0.08)" />
                <KpiCard label="Scans" value={(historyItems.filter(h => h.type === 'mri').length).toString()} subtext="MRI" icon={Brain} iconColor="#0D9488" iconBg="rgba(13,148,136,0.08)" />
                <KpiCard label="Findings" value={criticalCases.toString()} subtext="Abnormalities detected" icon={AlertTriangle} iconColor="#EF4444" iconBg="rgba(239,68,68,0.08)" />
              </div>

              {/* ── Quick Actions Row ── */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                <QuickAction icon={Upload} iconColor="#1E40AF" iconBg="rgba(30,64,175,0.08)" title="Upload MRI Scan" desc="Analyze a new scan" onClick={() => setActiveTab('analyzer')} />
                <QuickAction icon={Activity} iconColor="#7C3AED" iconBg="rgba(124,58,237,0.08)" title="Clinical Assessment" desc="Symptom evaluation" onClick={() => setActiveTab('clinical')} />
                <QuickAction icon={Zap} iconColor="#0D9488" iconBg="rgba(13,148,136,0.08)" title="Fusion Model" desc="MRI + Symptoms" onClick={() => setActiveTab('fusion')} />
              </div>

              {/* ── Activity Chart + Recent Scans Row ── */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                <ActivityChart data={chartData} />
                <RecentScans onViewAll={() => setActiveTab('history')} scans={recentItems} />
              </div>
            </div>
          )}

          {/* ── Tab: MRI Analysis (Analyzer) ── */}
          {activeTab === 'analyzer' && (
            <div style={{ padding: '20px 24px 0' }}>
              <UploadArea onAnalysisComplete={handleAnalysisComplete} />
            </div>
          )}

          {activeTab === 'clinical' && (
            <div style={{ padding: '20px 24px 0' }}>
              <ClinicalSymptoms onAnalysisComplete={handleAnalysisComplete} />
            </div>
          )}

          {activeTab === 'fusion' && (
            <div style={{ padding: '20px 24px 0' }}>
              <FusionAnalysis onAnalysisComplete={handleAnalysisComplete} />
            </div>
          )}

          {activeTab === 'doctors' && (
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', marginBottom: 6, letterSpacing: '-0.3px' }}>Find a Specialist</h2>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Browse and connect with top-rated neurologists and neurosurgeons.</p>
              </div>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <DoctorRecommendation condition="Neurological Consultation" />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <Settings />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <Profile />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ padding: '20px 24px 0' }}>
              <HistoryPage navigate={navigate} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.09) !important; }
        .quick-action-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important; background: #FAFAFA !important; }
        
        @keyframes meshGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .dash-banner { 
          padding: 32px 36px;
          background: linear-gradient(135deg, #0F172A, #1E40AF, #3B82F6, #0D9488);
          background-size: 300% 300%;
          animation: meshGradient 14s ease infinite;
        }
        .dash-banner-title { font-size: 1.8rem; }
        .dash-bitmoji { height: 230px; }
        @media (max-width: 768px) {
          .dash-banner { padding: 24px 20px; }
          .dash-banner-title { font-size: 1.4rem; }
          .dash-bitmoji { height: 140px; right: -10px !important; opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
