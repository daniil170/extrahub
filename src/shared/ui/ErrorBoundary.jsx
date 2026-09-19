import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logClientError } from '../services/errorLogging.js';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: null,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error in background without leaking technical details to UI
    logClientError({
      error,
      componentStack: errorInfo?.componentStack,
      message: error?.message || 'React Render ErrorBoundary caught an exception',
    }).then((id) => {
      if (id) this.setState({ errorId: id });
    });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-primary, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.1))',
              padding: '36px 28px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-light, rgba(239, 68, 68, 0.1))',
                color: 'var(--danger, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary, #0f172a)',
              }}
            >
              Что-то пошло не так
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary, #64748b)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Произошла непредвиденная ошибка при загрузке страницы. Мы уже автоматически
              зафиксировали её в журнале телеметрии системы для устранения.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                width: '100%',
                marginTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md, 10px)',
                  backgroundColor: 'var(--primary, #0284c7)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <RefreshCw size={15} />
                <span>Обновить</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md, 10px)',
                  backgroundColor: 'var(--bg-subtle, #f1f5f9)',
                  color: 'var(--text-primary, #0f172a)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Home size={15} />
                <span>На главную</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
