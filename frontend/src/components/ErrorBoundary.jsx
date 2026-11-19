import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to telemetry/logging service if available
    console.error('SignBridge ErrorBoundary captured an exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 20px 40px rgba(180, 83, 9, 0.08)',
            textAlign: 'center',
            margin: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              marginBottom: '20px',
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h3
            style={{
              fontSize: '20px',
              fontWeight: '900',
              color: '#1C1917',
              marginBottom: '8px',
              letterSpacing: '-0.3px',
            }}
          >
            Clinical Module Recovered
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: '#78716C',
              maxWidth: '460px',
              lineHeight: 1.5,
              marginBottom: '24px',
            }}
          >
            An isolated component error occurred in this view. SignBridge's fault-tolerant architecture
            prevented the hospital kiosk system from halting.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #B45309, #D97706)',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
              }}
            >
              <RefreshCw size={15} /> Reset This View
            </button>

            <button
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#57534E',
                fontWeight: '700',
                fontSize: '13px',
                border: '1px solid rgba(217, 180, 130, 0.5)',
                cursor: 'pointer',
              }}
            >
              <Home size={15} /> Reload Full Kiosk
            </button>
          </div>

          {this.state.error && (
            <div
              style={{
                marginTop: '24px',
                maxWidth: '600px',
                width: '100%',
                background: 'rgba(28, 25, 23, 0.04)',
                border: '1px solid rgba(217, 180, 130, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'left',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#991B1B',
                overflowX: 'auto',
              }}
            >
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
