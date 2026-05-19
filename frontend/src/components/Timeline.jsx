import { formatDateTime } from '../utils/customerUtils'

export default function Timeline({ title, items, emptyText }) {
  const sortedItems = [...items].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="timeline">
      {title && <h3>{title}</h3>}
      {sortedItems.length === 0 ? (
        <div className="empty-inline">{emptyText}</div>
      ) : (
        sortedItems.map((item) => (
          <article key={item.id}>
            <span>{formatDateTime(item.date)}</span>
            <strong>{item.type ? `${item.type}: ` : ''}{item.text}</strong>
          </article>
        ))
      )}
    </div>
  )
}
