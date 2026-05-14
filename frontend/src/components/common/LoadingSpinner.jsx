// src/components/common/LoadingSpinner.jsx
function LoadingSpinner({ size = 40, text = 'Loading...' }) {
  return (
    <div className="flex-center" style={{ minHeight: '200px', flexDirection: 'column', gap: '1rem' }}>
      <div
        className="spinner"
        style={{ width: size, height: size, borderWidth: size > 30 ? 3 : 2 }}
      />
      {text && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
