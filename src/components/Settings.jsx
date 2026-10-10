import React, { useState, useEffect, useContext } from 'react';
import { Save, CheckCircle2, AlertCircle, Loader2, Globe, Bell, History } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const TIMEZONES = [
  { label: 'Pakistan Standard Time (UTC+5)', value: 'Asia/Karachi' },
  { label: 'India Standard Time (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'Bangladesh Standard Time (UTC+6)', value: 'Asia/Dhaka' },
  { label: 'Gulf Standard Time (UTC+4)', value: 'Asia/Dubai' },
  { label: 'Saudi Arabia Time (UTC+3)', value: 'Asia/Riyadh' },
  { label: 'Turkey Time (UTC+3)', value: 'Europe/Istanbul' },
  { label: 'Eastern Europe (UTC+2)', value: 'Europe/Athens' },
  { label: 'Central Europe (UTC+1)', value: 'Europe/Berlin' },
  { label: 'GMT / London (UTC+0)', value: 'Europe/London' },
  { label: 'US Eastern Time (UTC-5)', value: 'America/New_York' },
  { label: 'US Central Time (UTC-6)', value: 'America/Chicago' },
  { label: 'US Mountain Time (UTC-7)', value: 'America/Denver' },
  { label: 'US Pacific Time (UTC-8)', value: 'America/Los_Angeles' },
  { label: 'China Standard Time (UTC+8)', value: 'Asia/Shanghai' },
  { label: 'Japan Standard Time (UTC+9)', value: 'Asia/Tokyo' },
  { label: 'Australia Eastern (UTC+10)', value: 'Australia/Sydney' },
];

/* ── Toggle Switch ── */
const ToggleSwitch = ({ id, checked, onChange, label, description }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ flex: 1 }}>
      <label htmlFor={id} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'block', marginBottom: 3 }}>
        {label}
      </label>
      <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>{description}</p>
    </div>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--brand-primary)' : 'var(--bg-surface-3)',
        border: `2px solid ${checked ? 'var(--brand-primary)' : 'var(--border-medium)'}`,
        cursor: 'pointer', transition: 'all 0.25s',
        position: 'relative', flexShrink: 0,
        boxShadow: checked ? '0 0 10px rgba(30,64,175,0.3)' : 'none',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  </div>
);

const Settings = () => {
  const { settings, updateSettings } = useContext(AuthContext);
  const [saveHistory, setSaveHistory] = useState(settings.saveHistory !== false);
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications !== false);
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Karachi');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    if (settings.saveHistory !== undefined) setSaveHistory(settings.saveHistory);
    if (settings.emailNotifications !== undefined) setEmailNotifications(settings.emailNotifications);
    if (settings.timezone) setTimezone(settings.timezone);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await updateSettings({ saveHistory, emailNotifications, timezone });
      setMessage('Settings saved successfully.');
      setMessageType('success');
    } catch {
      setMessage('Failed to save settings. Please try again.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="content-area" style={{ justifyContent: 'flex-start', paddingTop: 28 }}>
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Page Header */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Settings</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B' }}>Manage your account preferences.</p>
        </div>

        {/* Timezone */}
        <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(30,64,175,0.1)', border: '1px solid rgba(30,64,175,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color="var(--brand-primary-400)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Time Zone</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>History timestamps are displayed in this timezone</div>
            </div>
          </div>
          <label htmlFor="tz-select" className="nm-label">Select Timezone</label>
          <select
            id="tz-select"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="nm-select"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        {/* Preferences */}
        <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(30,64,175,0.1)', border: '1px solid rgba(30,64,175,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="var(--brand-primary-400)" />
            </div>
            <div style={{ paddingTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Preferences</div>
            </div>
          </div>

          <ToggleSwitch
            id="toggle-save-history"
            checked={saveHistory}
            onChange={setSaveHistory}
            label="Save Assessment History"
            description="Automatically save MRI analysis results to your history panel."
          />
          <ToggleSwitch
            id="toggle-email-notifications"
            checked={emailNotifications}
            onChange={setEmailNotifications}
            label="Email Notifications"
            description="Receive email updates about your account and system announcements."
          />
        </div>

        {/* Status Message */}
        {message && (
          <div className={`alert alert-${messageType}`}>
            {messageType === 'success'
              ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
            <span>{message}</span>
          </div>
        )}

        {/* Save */}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
          style={{ alignSelf: 'flex-start', padding: '10px 22px' }}
        >
          {isSaving
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
            : <><Save size={16} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
};

export default Settings;
