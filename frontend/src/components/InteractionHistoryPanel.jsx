import { useCallback, useEffect, useState } from 'react'
import {
  createInteraction,
  fetchInteractions,
  updateInteraction,
} from '../services/api/interactionApi'
import { formatDateTime } from '../utils/customerUtils'
import { toApiDateTime, toDatetimeLocalValue, toTimelineItem } from '../utils/interactionUtils'

const INTERACTION_TYPES = [
  { value: 'PHONE_CALL', label: 'Phone call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'IN_PERSON', label: 'In-person meeting' },
  { value: 'OTHER', label: 'Other' },
]

function emptyForm() {
  return {
    interactionType: 'PHONE_CALL',
    interactionTime: toDatetimeLocalValue(),
    noteContent: '',
  }
}

export default function InteractionHistoryPanel({ customerId, createdById, disabled = false, disabledReason = '', onNotesChange }) {
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')

  const loadInteractions = useCallback(async () => {
    if (!customerId) return

    setLoading(true)
    setError('')

    try {
      const data = await fetchInteractions(customerId)
      setInteractions(data)
      onNotesChange?.(data)
    } catch (err) {
      setError(err.message || 'Failed to load interactions.')
      setInteractions([])
      onNotesChange?.([])
    } finally {
      setLoading(false)
    }
  }, [customerId, onNotesChange])

  useEffect(() => {
    loadInteractions()
  }, [loadInteractions])

  async function handleCreate(event) {
    event.preventDefault()
    if (disabled) return
    if (!form.noteContent.trim()) return

    setSaving(true)
    setError('')

    try {
      await createInteraction(customerId, {
        interactionType: form.interactionType,
        interactionTime: toApiDateTime(form.interactionTime),
        noteContent: form.noteContent.trim(),
        createdById,
      })
      setForm(emptyForm())
      await loadInteractions()
    } catch (err) {
      setError(err.message || 'Failed to create interaction.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id) {
    if (disabled) return
    if (!editContent.trim()) return

    setSaving(true)
    setError('')

    try {
      await updateInteraction(id, { noteContent: editContent.trim() })
      setEditingId(null)
      setEditContent('')
      await loadInteractions()
    } catch (err) {
      setError(err.message || 'Failed to update interaction.')
    } finally {
      setSaving(false)
    }
  }

  const timelineItems = interactions.map(toTimelineItem).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="interaction-panel" id="interaction-history-panel">
      <div className="interaction-panel-heading">
        <div>
          <h3>Interaction History</h3>
          <p>Record interaction type, time, and a note after each customer contact.</p>
        </div>
      </div>

      {disabled && (
        <div className="interaction-disabled">
          {disabledReason || 'Inactive customers cannot receive new interactions or note updates.'}
        </div>
      )}

      <form className="interaction-form" onSubmit={handleCreate}>
        <div className="interaction-form-grid">
          <label>
            Type
            <select
              disabled={disabled || saving}
              value={form.interactionType}
              onChange={(event) => setForm((current) => ({ ...current, interactionType: event.target.value }))}
            >
              {INTERACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date & time
            <input
              disabled={disabled || saving}
              type="datetime-local"
              value={form.interactionTime}
              onChange={(event) => setForm((current) => ({ ...current, interactionTime: event.target.value }))}
            />
          </label>
        </div>
        <label>
          Note
          <textarea
            disabled={disabled || saving}
            rows={3}
            placeholder="Log what happened during this interaction..."
            value={form.noteContent}
            onChange={(event) => setForm((current) => ({ ...current, noteContent: event.target.value }))}
          />
        </label>
        <button className="primary-button" disabled={disabled || saving || !form.noteContent.trim()} type="submit">
          {saving ? 'Saving...' : 'Log Interaction + Note'}
        </button>
      </form>

      {error && <div className="interaction-error">{error}</div>}

      <div className="timeline">
        {loading ? (
          <div className="empty-inline">Loading interactions...</div>
        ) : timelineItems.length === 0 ? (
          <div className="empty-inline">No interactions for this customer.</div>
        ) : (
          timelineItems.map((item) => (
            <article key={item.id}>
              <div className="interaction-item-head">
                <span>{formatDateTime(item.date)}</span>
                {editingId !== item.id && !disabled && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditContent(item.text)
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingId === item.id ? (
                <div className="interaction-edit">
                  <textarea
                    disabled={saving}
                    rows={3}
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                  />
                  <div className="form-actions">
                    <button
                      className="primary-button"
                      disabled={disabled || saving || !editContent.trim()}
                      type="button"
                      onClick={() => handleUpdate(item.id)}
                    >
                      Save Note
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditContent('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <strong>
                  {item.type ? `${item.type}: ` : ''}
                  {item.text}
                </strong>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}
