import { useCallback, useEffect, useState } from 'react'
import {
  createInteraction,
  fetchInteractions,
  updateInteraction,
} from '../services/api/interactionApi'
import { formatDateTime } from '../utils/customerUtils'
import {
  toApiDateTime,
  toDatetimeLocalValue,
  toTimelineItem,
} from '../utils/interactionUtils'

const INTERACTION_TYPES = [
  { value: 'PHONE_CALL', label: 'Phone call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'IN_PERSON', label: 'In-person meeting' },
  { value: 'OTHER', label: 'Other' },
]

const PRIORITY_LEVELS = [
  { value: 'HIGHEST', label: 'Highest' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'VERY_LOW', label: 'Very low' },
]

const EMOTION_STATUSES = [
  { value: 'SATISFIED', label: 'Satisfied' },
  { value: 'EXCITED', label: 'Excited' },
  { value: 'FRUSTRATED', label: 'Frustrated' },
  { value: 'CONFUSED', label: 'Confused' },
  { value: 'NEUTRAL', label: 'Neutral' },
]

function emptyForm() {
  return {
    interactionType: 'PHONE_CALL',
    interactionTime: toDatetimeLocalValue(),
    title: '',
    description: '',
    priority: 'MEDIUM',
    emotionStatus: 'NEUTRAL',
  }
}

function createEditState(item) {
  return {
    interactionType: item.interactionType,
    interactionTime: toDatetimeLocalValue(new Date(item.date)),
    title: item.title || '',
    description: item.text || '',
    priority: item.priority || 'MEDIUM',
    emotionStatus: item.emotionStatus || 'NEUTRAL',
  }
}

export default function InteractionHistoryPanel({ customerId, createdById, disabled = false, disabledReason = '', onNotesChange }) {
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)

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
    if (!form.title.trim() || !form.description.trim()) return

    setSaving(true)
    setError('')

    try {
      await createInteraction(customerId, {
        interactionType: form.interactionType,
        interactionTime: toApiDateTime(form.interactionTime),
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.emotionStatus,
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
    if (!editForm.title.trim() || !editForm.description.trim()) return

    setSaving(true)
    setError('')

    try {
      await updateInteraction(id, {
        interactionType: editForm.interactionType,
        interactionTime: toApiDateTime(editForm.interactionTime),
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        status: editForm.emotionStatus,
      })
      setEditingId(null)
      setEditForm(emptyForm())
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
          <p>Track each customer touchpoint with title, time, type, description, priority, and customer emotion.</p>
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
            Title
            <input
              disabled={disabled || saving}
              placeholder="Short interaction title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
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
          <label>
            Priority
            <select
              disabled={disabled || saving}
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
            >
              {PRIORITY_LEVELS.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Customer emotion
            <select
              disabled={disabled || saving}
              value={form.emotionStatus}
              onChange={(event) => setForm((current) => ({ ...current, emotionStatus: event.target.value }))}
            >
              {EMOTION_STATUSES.map((emotion) => (
                <option key={emotion.value} value={emotion.value}>
                  {emotion.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Description
          <textarea
            disabled={disabled || saving}
            rows={3}
            placeholder="What happened during this interaction?"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </label>
        <button className="primary-button" disabled={disabled || saving || !form.title.trim() || !form.description.trim()} type="submit">
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
              <div className="interaction-item-head interaction-item-head-top">
                <strong>{item.title}</strong>
                {editingId !== item.id && !disabled && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditForm(createEditState(item))
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="interaction-meta-row">
                <span className="interaction-meta">{formatDateTime(item.date)}</span>
                <span className="interaction-meta">{item.type}</span>
                <span className={`priority-tag priority-${item.priority.toLowerCase()}`}>{item.priorityLabel}</span>
                <span className={`emotion-tag emotion-${item.emotionStatus.toLowerCase()}`}>{item.emotionLabel}</span>
              </div>
              {editingId === item.id ? (
                <div className="interaction-edit">
                  <div className="interaction-form-grid">
                    <label>
                      Title
                      <input
                        disabled={saving}
                        value={editForm.title}
                        onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                      />
                    </label>
                    <label>
                      Type
                      <select
                        disabled={saving}
                        value={editForm.interactionType}
                        onChange={(event) => setEditForm((current) => ({ ...current, interactionType: event.target.value }))}
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
                        disabled={saving}
                        type="datetime-local"
                        value={editForm.interactionTime}
                        onChange={(event) => setEditForm((current) => ({ ...current, interactionTime: event.target.value }))}
                      />
                    </label>
                    <label>
                      Priority
                      <select
                        disabled={saving}
                        value={editForm.priority}
                        onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))}
                      >
                        {PRIORITY_LEVELS.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Customer emotion
                      <select
                        disabled={saving}
                        value={editForm.emotionStatus}
                        onChange={(event) => setEditForm((current) => ({ ...current, emotionStatus: event.target.value }))}
                      >
                        {EMOTION_STATUSES.map((emotion) => (
                          <option key={emotion.value} value={emotion.value}>
                            {emotion.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <textarea
                    disabled={saving}
                    rows={3}
                    value={editForm.description}
                    onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                  />
                  <div className="form-actions">
                    <button
                      className="primary-button"
                      disabled={disabled || saving || !editForm.title.trim() || !editForm.description.trim()}
                      type="button"
                      onClick={() => handleUpdate(item.id)}
                    >
                      Save Interaction
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditForm(emptyForm())
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p>{item.text}</p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}
