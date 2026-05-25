import { Component } from 'react'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error.',
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: '#f5f7fb',
        }}
        >
          <section style={{
            width: 'min(680px, 100%)',
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
          }}
          >
            <p style={{ margin: 0, color: '#b45309', fontWeight: 600 }}>System error</p>
            <h1 style={{ margin: '8px 0 10px', fontSize: '1.4rem' }}>Đã có lỗi xảy ra</h1>
            <p style={{ margin: '0 0 18px', color: '#374151' }}>
              Ứng dụng vừa gặp lỗi ngoài dự kiến. Vui lòng thử lại.
            </p>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.92rem' }}>
              Chi tiết: {this.state.errorMessage}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="primary-button" type="button" onClick={this.handleRetry}>Thử lại</button>
              <button type="button" onClick={this.handleReload}>Tải lại trang</button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
