import React from 'react';

type State = { hasError: boolean; error?: Error | null; info?: React.ErrorInfo | null };

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can send error to a logging service here
    console.error('Uncaught error in UI:', error, info);
    this.setState({ hasError: true, error, info });
  }

  render() {
    if (this.state.hasError) {
      // Show a readable error message in dev; avoid exposing stack in production
      const isDev = process.env.NODE_ENV !== 'production';
      return (
        <div style={{ padding: 24 }}>
          <h1 style={{ color: '#b91c1c' }}>Something went wrong</h1>
          <p>We encountered an unexpected error in the UI.</p>
          {isDev && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
              {this.state.error.stack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
