import React from 'react';
import { ArrowLeft, Shield, Zap, FlaskConical, Users, BookOpen, Globe } from 'lucide-react';
import './Pages.css';

const NeuroMedLogo = ({ size = 28 }) => (
  <img src="/neuromed_logo.png" alt="NeuroMed Logo" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
);

const team = [
  { name: 'Zaheer Ahmed', role: 'Lead Software & AI Engineer', initials: 'ZA', color: '#1E40AF' },
  { name: 'Aisha Khan', role: 'AI Researcher & Frontend Developer', initials: 'AK', color: '#0D9488' },
  { name: 'Tufail Ahmed', role: 'Backend Developer & Data Architect', initials: 'TA', color: '#1E40AF' },
];

const AboutUs = ({ navigate, isLoggedIn }) => {
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
          <div className="section-label" style={{ marginBottom: 10 }}>About NeuroMed</div>
          <h1>The Future of Transparent Neurology</h1>
          <p>Bridging the gap between artificial intelligence and clinical trust through explainability.</p>
        </div>
      </div>

      <div className="page-content">
        {/* Who We Are */}
        <div className="info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(30,64,175,0.1)', border: '1px solid rgba(30,64,175,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <NeuroMedLogo size={22} />
            </div>
            <h2>Who We Are</h2>
          </div>
          <p>
            Born out of the Department of Software Engineering at <strong>Mehran University of Engineering and Technology (MUET)</strong>,
            NeuroMed is a research initiative aimed at advancing transparent, multimodal diagnostic support for brain tumor classification.
            We recognized a critical gap in modern medical AI: most systems operate as "black boxes," analyzing scans without
            explaining their reasoning or incorporating multimodal patient data. NeuroMed was built to address this through
            explainable, multimodal AI.
          </p>
        </div>

        {/* Mission & SDGs */}
        <div className="info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={20} color="#2DD4BF" />
            </div>
            <h2>Our Mission & Global Impact</h2>
          </div>
          <p style={{ marginBottom: 20 }}>
            Our core philosophy aligns with the United Nations Sustainable Development Goals:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {[
              { icon: <Shield size={16} color="#60A5FA" />, title: 'SDG 3 — Good Health & Well-being', desc: 'Facilitating early, accessible brain tumor detection to support improved health outcomes.' },
              { icon: <Zap size={16} color="#2DD4BF" />, title: 'SDG 9 — Industry & Innovation', desc: 'Developing interpretable AI frameworks that advance transparency in digital healthcare.' },
            ].map(item => (
              <div key={item.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(30,64,175,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Context */}
        <div className="info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(30,64,175,0.1)', border: '1px solid rgba(30,64,175,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={20} color="#60A5FA" />
            </div>
            <h2>Clinical Context</h2>
          </div>
          <p>
            NeuroMed is a professional medical AI platform designed to assist healthcare providers.
            It leverages multimodal AI with explainability to ensure transparent, reliable decision-support in a clinical context.
            The system acts as an augmented intelligence tool and should be used alongside professional medical expertise.
          </p>
          <div className="alert alert-warning" style={{ marginTop: 16 }}>
            <Shield size={14} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem' }}>
              NeuroMed is a clinical decision-support tool. It does not replace professional medical advice or diagnosis.
            </span>
          </div>
        </div>

        {/* Team */}
        <section aria-labelledby="team-heading">
          <h2 id="team-heading" className="team-section-title">The Team</h2>
          <div className="team-grid">
            {team.map((member) => (
              <div key={member.name} className="team-card">
                <div
                  style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                    background: `linear-gradient(135deg, ${member.color}, #0D9488)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.35rem', fontWeight: 800, color: '#fff',
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: `0 0 20px ${member.color}40`,
                  }}
                >
                  {member.initials}
                </div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
