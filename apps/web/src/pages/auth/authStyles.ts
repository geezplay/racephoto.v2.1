import { CSSProperties } from 'react';

export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#020202',
  color: 'white',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
};

export const cardStyle: CSSProperties = {
  background: '#0a0a0a',
  borderRadius: '1.5rem',
  padding: '2rem',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.75rem',
  padding: '1rem 1.5rem',
  color: 'white',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export const buttonStyle: CSSProperties = {
  width: '100%',
  background: '#39FF14',
  color: 'black',
  padding: '1rem',
  borderRadius: '1rem',
  fontWeight: 900,
  textTransform: 'uppercase',
  fontSize: '1.125rem',
  fontStyle: 'italic',
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Archivo Black', sans-serif",
};

export const googleButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  width: '100%',
  background: 'white',
  color: '#1a1a1a',
  padding: '0.9rem',
  borderRadius: '1rem',
  textDecoration: 'none',
  fontWeight: 600,
};

export const headerTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: '1.5rem',
  textTransform: 'uppercase',
  fontStyle: 'italic',
  fontFamily: "'Archivo Black', sans-serif",
};
