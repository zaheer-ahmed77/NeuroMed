import React, { useState, useContext, useRef, useEffect } from 'react';
import { User, Save, Upload, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Camera } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';

const Profile = () => {
  const { user, token, setUser } = useContext(AuthContext);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' | 'error'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setAvatar(user.avatar);
    }
  }, [user]);

  const getInitials = () => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return names[0][0].toUpperCase();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage('Image must be smaller than 2MB.');
        setMessageType('error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 200;
          let { width, height } = img;
          if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } }
          else { if (height > max_size) { width *= max_size / height; height = max_size; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setAvatar(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const updateData = { fullName, email, avatar };
      if (password) updateData.password = password;

      const response = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setMessage('Profile updated successfully.');
        setMessageType('success');
        setPassword('');
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to update profile. Please try again.');
        setMessageType('error');
      }
    } catch {
      setMessage('A network error occurred. Please check your connection.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="content-area" style={{ justifyContent: 'flex-start', paddingTop: 28 }}>
      <div style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Page Header */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>My Profile</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B' }}>Manage your account details and avatar.</p>
        </div>

        {/* Avatar Section */}
        <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: avatar ? 'transparent' : 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-teal) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '2px solid var(--border-medium)',
              fontSize: '1.4rem', fontWeight: 700, color: '#fff',
            }}>
              {avatar ? <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials()}
            </div>
            <button
              onClick={() => fileInputRef.current.click()}
              aria-label="Change avatar"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--brand-primary)', color: '#fff',
                border: '2px solid var(--bg-surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-primary-600)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--brand-primary)'}
            >
              <Camera size={13} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} aria-label="Upload avatar image" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{fullName || 'Your Name'}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 10 }}>{email}</div>
            <button
              onClick={() => fileInputRef.current.click()}
              className="btn btn-outline btn-sm"
            >
              <Upload size={13} /> Upload Photo
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            Account Details
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="profile-name" className="nm-label">Full Name</label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="nm-input"
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="profile-email" className="nm-label">Email Address</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="nm-input"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="profile-password" className="nm-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="profile-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="nm-input"
                style={{ paddingRight: 42 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', padding: 2 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`alert alert-${messageType}`}>
              {messageType === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              <span>{message}</span>
            </div>
          )}

          {/* Save */}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ alignSelf: 'flex-start', padding: '10px 20px' }}
          >
            {isSaving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
