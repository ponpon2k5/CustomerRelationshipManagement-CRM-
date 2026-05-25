import { formatDateTime } from '../utils/customerUtils'

export default function Timeline({
  title,
  items,
  emptyText,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
}) {
  const sortedItems = [...items].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="timeline">
      {title && <h3>{title}</h3>}
      {sortedItems.length === 0 ? (
        <div className="empty-inline">{emptyText}</div>
      ) : (
        sortedItems.map((item) => (
          <article key={item.id}>
            {selectable && (
              <label className="timeline-select-label">
                <input
                  checked={selectedIds.includes(item.id)}
                  type="checkbox"
                  onChange={(event) => onToggleSelect?.(item.id, event.target.checked)}
                />
                <span>Select</span>
              </label>
            )}
            {item.title ? (
              <div className="note-card">
                <div className="note-card-time">{formatDateTime(item.date)}</div>
                <strong className="note-card-title">{item.title}</strong>
                <p className="note-card-description">{item.description || '-'}</p>
                <div className="note-card-tags">
                  <span className="interaction-meta">{item.interactionTypeLabel || item.type || 'Other'}</span>
                  <span className={`priority-tag priority-${String(item.priority || 'MEDIUM').toLowerCase()}`}>
                    {item.priorityLabel || item.priority || 'Medium'}
                  </span>
                  <span className={`emotion-tag emotion-${String(item.status || 'NEUTRAL').toLowerCase()}`}>
                    {item.statusLabel || item.status || 'Neutral'}
                  </span>
                  <span className={`done-tag ${item.isDone ? 'done' : 'open'}`}>
                    {item.isDone ? 'Done' : 'Not Done'}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <span>{formatDateTime(item.date)}</span>
                <strong>{item.type ? `${item.type}: ` : ''}{item.text}</strong>
              </>
            )}
          </article>
        ))
      )}
    </div>
  )
}
