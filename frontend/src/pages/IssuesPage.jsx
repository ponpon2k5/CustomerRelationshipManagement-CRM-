import { useEffect, useMemo, useState } from 'react'
import { fetchIssues } from '../services/api/issuesApi'
import { formatDateTime } from '../utils/customerUtils'

const defaultFilters = {
  priority: 'all',
  status: 'all',
  fromDate: '',
  toDate: '',
}

const priorityOptions = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW']
const statusOptions = ['SATISFIED', 'EXCITED', 'FRUSTRATED', 'CONFUSED', 'NEUTRAL']

function toLabel(value) {
  return String(value || '')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toDateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function IssuesPage({ onOpenProfile }) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(defaultFilters)

  useEffect(() => {
    let mounted = true

    async function loadIssues() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchIssues()
        if (!mounted) return
        setIssues(data)
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Failed to load issues.')
        setIssues([])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadIssues()
    return () => {
      mounted = false
    }
  }, [])

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        const priority = String(issue.priority || 'MEDIUM').toUpperCase()
        const status = String(issue.status || 'NEUTRAL').toUpperCase()
        const issueTime = issue.interactionTime ? new Date(issue.interactionTime) : null
        const issueDateKey = toDateKey(issue.interactionTime)

        const matchesPriority = filters.priority === 'all' || priority === filters.priority
        const matchesStatus = filters.status === 'all' || status === filters.status

        const hasValidIssueTime = issueTime instanceof Date && !Number.isNaN(issueTime.getTime())
        const matchesFrom = !filters.fromDate || (issueDateKey && issueDateKey >= filters.fromDate)
        const matchesTo = !filters.toDate || (issueDateKey && issueDateKey <= filters.toDate)
        const matchesTime = hasValidIssueTime && matchesFrom && matchesTo

        return matchesPriority && matchesStatus && matchesTime
      })
      .sort((a, b) => String(b.interactionTime || '').localeCompare(String(a.interactionTime || '')))
  }, [filters, issues])

  return (
    <section className="panel issues-panel" aria-labelledby="issues-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Interaction Issues</p>
          <h2 id="issues-title">All Customer Interactions</h2>
        </div>
      </div>
      <div className="issues-filters" aria-label="Issue filters">
        <label>
          Priority
          <select
            value={filters.priority}
            onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
          >
            <option value="all">All priorities</option>
            {priorityOptions.map((value) => (
              <option key={value} value={value}>{toLabel(value)}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>{toLabel(value)}</option>
            ))}
          </select>
        </label>
        <label>
          From date
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
          />
        </label>
        <label>
          To date
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
          />
        </label>
        <button className="secondary-button" type="button" onClick={() => setFilters(defaultFilters)}>
          Reset Filters
        </button>
      </div>

      {error && <div className="interaction-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading issues...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="empty-state">No interactions match the selected filters.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Customer Info</th>
                <th>Owner</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <strong>{issue.title || '-'}</strong>
                  </td>
                  <td>
                    <div className="issue-customer-info">
                      <strong>{issue.customerName || '-'}</strong>
                      <span>{issue.customerEmail || '-'}</span>
                      <span>{issue.customerPhone || '-'}</span>
                      <span>{issue.customerCompany || '-'}</span>
                      {issue.customerId && (
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => onOpenProfile(issue.customerId)}
                        >
                          Open profile
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{issue.createdByName || `User #${issue.createdById}`}</td>
                  <td>
                    <span className={`priority-tag priority-${String(issue.priority || 'MEDIUM').toLowerCase()}`}>
                      {toLabel(issue.priority || 'MEDIUM')}
                    </span>
                  </td>
                  <td>
                    <span className={`emotion-tag emotion-${String(issue.status || 'NEUTRAL').toLowerCase()}`}>
                      {toLabel(issue.status || 'NEUTRAL')}
                    </span>
                  </td>
                  <td>{formatDateTime(issue.interactionTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
