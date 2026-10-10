import React from 'react';
import { ArrowLeft, Activity, Brain, Eye, FileText, Network, BarChart3 } from 'lucide-react';
import './Pages.css';

const services = [
  {
    icon: <Activity size={24} color="#60A5FA" />,
    color: 'blue',
    title: 'Clinical Symptom Analysis',
    badge: 'Coming Soon',
    description:
      'Machine learning analysis of patient-reported clinical symptoms — including headache severity, vision changes, and neurological signs — to generate a preliminary risk assessment with explainable feature importance.',
  },
  {
    icon: <Brain size={24} color="#2DD4BF" />,
    color: 'teal',
    title: 'MRI Scan Classification',
    badge: 'Active',
    description:
      'Deep learning model classifies uploaded brain MRI scans into four categories: Glioma Tumor, Meningioma Tumor, Pituitary Tumor, and No Tumor. Includes automatic image quality validation.',
  },
  {
    icon: <Eye size={24} color="#60A5FA" />,
    color: 'blue',
    title: 'Explainable AI (XAI)',
    badge: 'In Progress',
    description:
      'Transparency through explainability: Grad-CAM heatmaps visually highlight MRI regions that influenced the model\'s decision, while clinical predictions include feature importance scores.',
  },
  {
    icon: <Network size={24} color="#2DD4BF" />,
    color: 'teal',
    title: 'Multimodal Late Fusion',
    badge: 'Coming Soon',
    description:
      'Independent clinical and MRI predictions are combined through a late-fusion mechanism to generate a more robust final assessment — the defining multimodal feature of NeuroMed.',
  },
  {
    icon: <BarChart3 size={24} color="#60A5FA" />,
    color: 'blue',
    title: 'Uncertainty Estimation',
    badge: 'Active',
    description:
      'Every prediction includes a model confidence score. When uncertainty is high (confidence < 55%), the system prominently flags the result for specialist review rather than presenting an unreliable diagnosis.',
  },
  {
    icon: <FileText size={24} color="#2DD4BF" />,
    color: 'teal',
    title: 'Unified Diagnostic Report',
    badge: 'Active',
    description:
      'Exportable PDF reports containing the full assessment, AI classification, confidence score, patient information, and a clear medical disclaimer — suitable for research review and archiving.',
  },
];

const badgeColors = {
  'Active': { bg: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'rgba(16,185,129,0.25)' },
  'In Progress': { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  'Coming Soon': { bg: 'rgba(100,116,139,0.1)', color: '#94A3B8', border: 'rgba(100,116,139,0.2)' },
};

const Services = ({ navigate, isLoggedIn }) => {
  return (
    <div className="page-container">
      {/* Background */}
      <div className="nm-orb nm-orb-blue" style={{ width: 600, height: 600, top: -200, right: -100, position: 'absolute' }} />
      <div className="nm-orb nm-orb-teal" style={{ width: 400, height: 400, bottom: -100, left: -50, position: 'absolute' }} />

      {/* Header */}
      <div className="page-header">
        <button
          className="back-btn"
          onClick={() => navigate(isLoggedIn ? 'dashboard' : 'home')}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="header-text">
          <div className="section-label" style={{ marginBottom: 10 }}>Capabilities</div>
          <h1>NeuroMed Diagnostic Services</h1>
          <p>A multimodal AI pipeline designed for transparent, explainable brain tumor classification.</p>
        </div>
      </div>

      <div className="page-content">
        <div className="services-grid">
          {services.map((service) => {
            const badge = badgeColors[service.badge];
            return (
              <div key={service.title} className="service-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="service-icon" style={{
                    background: service.color === 'teal' ? 'rgba(13,148,136,0.1)' : 'rgba(30,64,175,0.1)',
                    border: service.color === 'teal' ? '1px solid rgba(13,148,136,0.25)' : '1px solid rgba(30,64,175,0.25)',
                  }}>
                    {service.icon}
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: '0.68rem',
                    fontWeight: 700, background: badge.bg, color: badge.color,
                    border: `1px solid ${badge.border}`, whiteSpace: 'nowrap',
                  }}>
                    {service.badge}
                  </span>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Services;
