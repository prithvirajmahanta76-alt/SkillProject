import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SignBridge Global ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#FAF6ED',
          color: '#1C1917',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '32px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #DC2626',
            boxShadow: '0 20px 25px -5px rgba(45, 35, 20, 0.15)'
          }}>
            <h1 style={{ color: '#DC2626', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
              ⚠️ Interface Recovery Mode
            </h1>
            <p style={{ color: '#57534E', fontSize: '14px', marginBottom: '16px' }}>
              SignBridge encountered an unexpected render issue. Don't worry—all backend healthcare endpoints remain healthy.
            </p>
            <div style={{
              padding: '12px',
              backgroundColor: '#FEF2F2',
              borderRadius: '8px',
              color: '#B91C1C',
              fontSize: '12px',
              textAlign: 'left',
              fontFamily: 'monospace',
              marginBottom: '20px',
              overflowX: 'auto'
            }}>
              {this.state.error ? this.state.error.toString() : 'Unknown Error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#B45309',
                color: '#FFF',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              🔄 Reload SignBridge
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
