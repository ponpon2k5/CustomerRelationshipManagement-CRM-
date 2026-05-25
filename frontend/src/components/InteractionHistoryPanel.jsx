import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  batchProcessInteractionSummaries,
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
    isDone: false,
  }
}

export default function InteractionHistoryPanel({
  customerId,
  createdById,
  disabled = false,
  disabledReason = '',
  onNotesChange,
  selectedNoteIds = [],
  selectedNotes = [],
  onClearSelectedNotes,
}) {
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchMessage, setBatchMessage] = useState('')
  const [editingInteractionId, setEditingInteractionId] = useState(null)

  function toLocalInputValue(value) {
    if (!value) return toDatetimeLocalValue()
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return toDatetimeLocalValue()
    return toDatetimeLocalValue(date)
  }

  const loadInteractions = useCallback(async () => {
    if (!customerId) return

    setLoading(true)
    setError('')

    try {
      const data = await fetchInteractions(customerId, createdById)
      setInteractions(data)
      onNotesChange?.(data)
    } catch (err) {
      setError(err.message || 'Failed to load interactions.')
      setInteractions([])
      onNotesChange?.([])
    } finally {
      setLoading(false)
    }
  }, [createdById, customerId, onNotesChange])

  useEffect(() => {
    loadInteractions()
  }, [loadInteractions])

  useEffect(() => {
    setBatchMessage('')
    setEditingInteractionId(null)
    setForm(emptyForm())
  }, [customerId])

  useEffect(() => {
    if (selectedNoteIds.length === 0) {
      setEditingInteractionId(null)
      setForm(emptyForm())
      return
    }

    const selectedId = selectedNoteIds[selectedNoteIds.length - 1]
    const selectedNote = selectedNotes.find((item) => item.id === selectedId)
    if (!selectedNote) return

    setEditingInteractionId(selectedId)
    setForm({
      interactionType: String(selectedNote.interactionType || 'PHONE_CALL').toUpperCase(),
      interactionTime: toLocalInputValue(selectedNote.date),
      title: selectedNote.title || '',
      description: selectedNote.description || '',
      priority: String(selectedNote.priority || 'MEDIUM').toUpperCase(),
      emotionStatus: String(selectedNote.status || 'NEUTRAL').toUpperCase(),
      isDone: Boolean(selectedNote.isDone),
    })
  }, [selectedNoteIds, selectedNotes])

  useEffect(() => {
    const hasActiveSummary = interactions.some((item) => {
      const status = String(item.summaryStatus || 'PENDING').toUpperCase()
      return status === 'PENDING' || status === 'PROCESSING'
    })
    if (!hasActiveSummary) return undefined

    const timerId = window.setInterval(() => {
      loadInteractions()
    }, 5000)

    return () => window.clearInterval(timerId)
  }, [interactions, loadInteractions])

  async function handleCreate(event) {
    event.preventDefault()
    if (disabled) return
    if (!form.title.trim() || !form.description.trim()) return

    setSaving(true)
    setError('')

    try {
      const basePayload = {
        interactionType: form.interactionType,
        interactionTime: toApiDateTime(form.interactionTime),
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.emotionStatus,
        isDone: form.isDone,
      }

      if (editingInteractionId != null) {
        await updateInteraction(editingInteractionId, basePayload)
      } else {
        const payload = { ...basePayload, createdById }
        await createInteraction(customerId, payload)
      }

      setForm(emptyForm())
      setEditingInteractionId(null)
      await loadInteractions()
    } catch (err) {
      setError(err.message || 'Failed to save interaction.')
    } finally {
      setSaving(false)
    }
  }

  async function handleBatchProcess(action) {
    if (disabled || batchSubmitting || selectedNoteIds.length === 0) return
    setBatchSubmitting(true)
    setError('')
    setBatchMessage('')

    const selectedSnapshot = [...selectedNoteIds]

    try {
      const response = await batchProcessInteractionSummaries(selectedSnapshot, action)
      const accepted = Number(response?.accepted || 0)
      const skipped = Number(response?.skipped || 0)
      setBatchMessage(`Queued ${accepted} note(s). Skipped ${skipped}.`)
      await loadInteractions()
      onClearSelectedNotes?.()
    } catch (err) {
      setError(err.message || 'Failed to process selected notes.')
    } finally {
      setBatchSubmitting(false)
    }
  }

  const timelineItems = useMemo(
    () => interactions.map(toTimelineItem).sort((a, b) => b.date.localeCompare(a.date)),
    [interactions],
  )
  const selectedCount = selectedNoteIds.length

  const selectedNoteById = useMemo(() => {
    const map = new Map()
    selectedNotes.forEach((note) => map.set(note.id, note))
    return map
  }, [selectedNotes])

  const interactionById = useMemo(() => {
    const map = new Map()
    timelineItems.forEach((item) => map.set(item.id, item))
    return map
  }, [timelineItems])

  const displayedNotes = useMemo(
    () => selectedNoteIds
      .map((id) => {
        const note = selectedNoteById.get(id)
        if (!note) return null
        return {
          ...note,
          interaction: interactionById.get(id) || null,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [selectedNoteIds, selectedNoteById, interactionById],
  )

  return (
    <div className="interaction-panel" id="interaction-history-panel">
      <div className="interaction-panel-heading">
        <div>
          <h3>Interaction History</h3>
          <p>Track each customer touchpoint with title, time, type, description, priority, and customer emotion.</p>
          {editingInteractionId != null && (
            <p className="interaction-meta">Editing selected note #{editingInteractionId}.</p>
          )}
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
          <label className="interaction-checkbox">
            <input
              checked={form.isDone}
              disabled={disabled || saving}
              type="checkbox"
              onChange={(event) => setForm((current) => ({ ...current, isDone: event.target.checked }))}
            />
            Mark note as done
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
          {saving ? 'Saving...' : editingInteractionId != null ? 'Save Note Changes' : 'Log Interaction + Note'}
        </button>
      </form>

      {error && <div className="interaction-error">{error}</div>}
      {batchMessage && <div className="interaction-success">{batchMessage}</div>}

      <div className="summary-batch-toolbar">
        <label className="summary-select-all">
          <span>Selected from Notes: {selectedCount}</span>
        </label>
        <div className="summary-batch-actions">
          <button
            className="secondary-button"
            disabled={disabled || batchSubmitting || selectedCount === 0}
            type="button"
            onClick={() => handleBatchProcess('generate')}
          >
            {batchSubmitting ? 'Processing...' : 'AI Summary Selected'}
          </button>
          <button
            className="text-button"
            disabled={disabled || batchSubmitting || selectedCount === 0}
            type="button"
            onClick={() => handleBatchProcess('regenerate')}
          >
            Regenerate Selected
          </button>
          <button
            className="text-button"
            disabled={batchSubmitting || selectedCount === 0}
            type="button"
            onClick={() => onClearSelectedNotes?.()}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="selected-notes-panel">
        <h4>Selected Notes</h4>
        {loading ? (
          <div className="empty-inline">Loading interactions...</div>
        ) : displayedNotes.length === 0 ? (
          <div className="empty-inline">Select notes in Notes to display summaries here.</div>
        ) : (
          <div className="timeline">
            {displayedNotes.map((note) => (
              <article key={`selected-${note.id}`}>
                <span>{formatDateTime(note.date)}</span>
                <strong>{note.text}</strong>
                <div className="note-card-tags">
                  <span className={`done-tag ${note.isDone ? 'done' : 'open'}`}>
                    {note.isDone ? 'Done' : 'Not Done'}
                  </span>
                </div>
                {note.interaction && (
                  <div className="interaction-summary-card">
                    <div className="interaction-summary-head">
                      <strong>AI Summary</strong>
                      <span className={`summary-status summary-status-${String(note.interaction.summaryStatus || 'PENDING').toLowerCase()}`}>
                        {note.interaction.summaryStatus}
                      </span>
                    </div>
                    {note.interaction.latestSummary ? (
                      <div className="interaction-summary-body">
                        <p><strong>Summary:</strong> {note.interaction.latestSummary.conversationSummary || 'unknown'}</p>
                        <p><strong>Customer needs:</strong> {note.interaction.latestSummary.customerNeeds || 'unknown'}</p>
                        <p><strong>Pain points:</strong> {note.interaction.latestSummary.painPoints || 'unknown'}</p>
                        <p><strong>Commitments:</strong> {note.interaction.latestSummary.commitments || 'unknown'}</p>
                        <p><strong>Next steps:</strong> {note.interaction.latestSummary.nextSteps || 'unknown'}</p>
                        <p><strong>Risk flags:</strong> {note.interaction.latestSummary.riskFlags || 'none'}</p>
                      </div>
                    ) : (
                      <p className="interaction-meta">Summary is pending...</p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
