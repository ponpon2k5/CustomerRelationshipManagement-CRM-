import { useEffect, useRef, useState } from 'react'
import { sendChatMessage } from '../services/aiApi'

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Xin chào! Tôi là Trợ lý AI của hệ thống CRM. Bạn cần tôi tìm kiếm khách hàng hay truy vấn dữ liệu nào hôm nay?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const suggestions = [
    'Tìm khách hàng ở Quận 5',
    'Khách hàng có độ ưu tiên cao',
    'Danh sách quản trị viên hoạt động',
    'Tóm tắt các cuộc gọi gần đây',
  ]

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  async function handleSend(textToSend) {
    const queryText = textToSend || input.trim()
    if (!queryText) return

    if (!textToSend) {
      setInput('')
    }

    const userMsg = {
      id: String(Date.now()),
      role: 'user',
      text: queryText,
    }

    setMessages((current) => [...current, userMsg])
    setLoading(true)

    try {
      const data = await sendChatMessage(queryText)
      
      const assistantMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: data.response || 'Tôi không nhận được phản hồi hợp lệ.',
        sql: data.sql,
        error: data.error,
        success: data.success,
      }
      setMessages((current) => [...current, assistantMsg])
    } catch (err) {
      const assistantMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: `Đã xảy ra lỗi: ${err.message}`,
        error: err.message,
        success: false,
      }
      setMessages((current) => [...current, assistantMsg])
    } finally {
      setLoading(false)
    }
  }

  function renderMessageText(text) {
    if (!text) return null

    const lines = text.split('\n')
    const elements = []
    
    let currentCustomer = null
    
    const flushCustomer = () => {
      if (currentCustomer) {
        elements.push(
          <div key={`cust-${Date.now()}-${elements.length}-${Math.random()}`} className="ai-customer-card">
            <div className="card-header">
              <span className="card-avatar">👤</span>
              <div className="card-header-info">
                <span className="card-label">Khách hàng</span>
                <h4 className="card-name">{currentCustomer.name || 'Không rõ'}</h4>
              </div>
              {currentCustomer.stage && (
                <span className={`card-stage-badge ${currentCustomer.stage.toLowerCase()}`}>
                  {currentCustomer.stage}
                </span>
              )}
            </div>
            <div className="card-body">
              {currentCustomer.company && (
                <div className="card-field">
                  <span className="field-icon">🏢</span>
                  <span className="field-label">Công ty:</span>
                  <span className="field-value">{currentCustomer.company}</span>
                </div>
              )}
              {currentCustomer.email && (
                <div className="card-field">
                  <span className="field-icon">✉️</span>
                  <span className="field-label">Email:</span>
                  <span className="field-value">{currentCustomer.email}</span>
                </div>
              )}
              {currentCustomer.phone && (
                <div className="card-field">
                  <span className="field-icon">📞</span>
                  <span className="field-label">Điện thoại:</span>
                  <span className="field-value">{currentCustomer.phone}</span>
                </div>
              )}
              {currentCustomer.address && (
                <div className="card-field">
                  <span className="field-icon">📍</span>
                  <span className="field-label">Địa chỉ:</span>
                  <span className="field-value">{currentCustomer.address}</span>
                </div>
              )}
            </div>
          </div>
        )
        currentCustomer = null
      }
    }

    const parseInlineBold = (txt) => {
      const parts = txt.split('**')
      return parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) {
        flushCustomer()
        elements.push(<div key={`space-${i}`} className="ai-chat-spacing" />)
        continue
      }

      // Check if it's a numbered list customer header (e.g. 1. **Nguyễn Minh Anh**)
      const matchNumberedCustomer = line.match(/^\d+\.\s*\*\*(.*?)\*\*$/)
      if (matchNumberedCustomer) {
        flushCustomer()
        const val = matchNumberedCustomer[1].trim()
        currentCustomer = { name: val }
        continue
      }

      const isBullet = line.startsWith('*') || line.startsWith('-')
      if (isBullet) {
        const content = line.substring(1).trim()
        const cleanContent = content.replace(/[\*_]/g, '').trim()
        
        if (cleanContent.startsWith('Tên đầy đủ:')) {
          flushCustomer()
          const val = cleanContent.substring('Tên đầy đủ:'.length).trim()
          currentCustomer = { name: val }
          continue
        }
        
        if (currentCustomer) {
          if (cleanContent.startsWith('Email:')) {
            currentCustomer.email = cleanContent.substring('Email:'.length).trim()
            continue
          }
          if (cleanContent.startsWith('Điện thoại:')) {
            currentCustomer.phone = cleanContent.substring('Điện thoại:'.length).trim()
            continue
          }
          if (cleanContent.startsWith('Số điện thoại:')) {
            currentCustomer.phone = cleanContent.substring('Số điện thoại:'.length).trim()
            continue
          }
          if (cleanContent.startsWith('Công ty:')) {
            currentCustomer.company = cleanContent.substring('Công ty:'.length).trim()
            continue
          }
          if (cleanContent.startsWith('Tên công ty:')) {
            currentCustomer.company = cleanContent.substring('Tên công ty:'.length).trim()
            continue
          }
          if (cleanContent.startsWith('Địa chỉ:')) {
            currentCustomer.address = cleanContent.substring('Địa chỉ:'.length).trim()
            continue
          }
          if (cleanContent.startsWith('Giai đoạn khách hàng:')) {
            currentCustomer.stage = cleanContent.substring('Giai đoạn khách hàng:'.length).trim()
            continue
          }
          if (cleanContent.startsWith('Giai đoạn:')) {
            currentCustomer.stage = cleanContent.substring('Giai đoạn:'.length).trim()
            continue
          }
        }

        flushCustomer()
        
        // General bullet point
        const matchBoldKey = content.match(/^\*\*(.*?)\*\*:(.*)$/)
        if (matchBoldKey) {
          const key = matchBoldKey[1]
          const val = matchBoldKey[2]
          elements.push(
            <div key={`bullet-${i}`} className="ai-chat-bullet-item">
              <span className="bullet-dot">•</span>
              <span className="bullet-content">
                <strong>{key}:</strong> {parseInlineBold(val)}
              </span>
            </div>
          )
        } else {
          elements.push(
            <div key={`bullet-${i}`} className="ai-chat-bullet-item">
              <span className="bullet-dot">•</span>
              <span className="bullet-content">{parseInlineBold(content)}</span>
            </div>
          )
        }
      } else {
        flushCustomer()
        elements.push(
          <p key={`text-${i}`} className="ai-chat-paragraph">
            {parseInlineBold(line)}
          </p>
        )
      }
    }

    flushCustomer()
    return <div className="parsed-chat-content">{elements}</div>
  }

  return (
    <div className="ai-chatbot-container">
      {/* Floating Toggle Button */}
      <button
        className={`ai-chatbot-toggle ${isOpen ? 'active' : ''}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <span className="icon-close">✕</span>
        ) : (
          <span className="icon-sparkle">✨</span>
        )}
      </button>
 
      {/* Chat window */}
      {isOpen && (
        <section className="ai-chatbot-window" aria-label="AI CRM Assistant">
          <header className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="sparkle-dot">✨</span>
              <strong>AI CRM Assistant</strong>
            </div>
          </header>
 
          <div className="chatbot-body">
            <div className="messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-bubble-wrapper ${msg.role}`}>
                  <div className="message-bubble">
                    {msg.role === 'assistant' ? (
                      renderMessageText(msg.text)
                    ) : (
                      <p className="message-text">{msg.text}</p>
                    )}


                    {msg.error && (
                      <div className="chat-error-info">
                        <strong>Lỗi:</strong> {msg.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-bubble-wrapper assistant">
                  <div className="message-bubble loading-bubble">
                    <div className="typing-indicator">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* suggestion chips */}
            {messages.length === 1 && !loading && (
              <div className="suggestion-chips">
                <p className="suggestion-title">Gợi ý câu hỏi:</p>
                <div className="chips-grid">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleSend(sug)}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            className="chatbot-footer"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <input
              type="text"
              placeholder="Hỏi AI (Ví dụ: khách hàng quận 5...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Gửi
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
