import { useEffect, useMemo, useState } from 'react'
import { getDashboardStats } from '../services/dashboardApi'
import { formatDateTime } from '../utils/customerUtils'

const typeLabels = {
  PHONE_CALL: 'Phone call',
  EMAIL: 'Email',
  IN_PERSON: 'Meeting',
  OTHER: 'Other',
}

const emptyStats = {
  totalCustomers: 0,
  customersByStatus: [],
  recentInteractionsCount: 0,
  interactionsByType: [],
  recentActivities: [],
}

export default function DashboardPage({ onOpenProfile }) {
  const [statsData, setStatsData] = useState(emptyStats)
  const [dashboardError, setDashboardError] = useState('')
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadDashboardStats() {
      setLoadingDashboard(true)
      setDashboardError('')

      try {
        const data = await getDashboardStats({ force: true })
        if (!isMounted) return
        setStatsData(data)
      } catch (err) {
        if (!isMounted) return
        setDashboardError(err.message || 'Failed to load dashboard report.')
        setStatsData(emptyStats)
      } finally {
        if (isMounted) {
          setLoadingDashboard(false)
        }
      }
    }

    loadDashboardStats()

    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const customersByStatus = (statsData.customersByStatus || []).reduce((acc, item) => {
      acc[item.status] = item.count
      return acc
    }, {})

    const interactionsByType = (statsData.interactionsByType || []).reduce((acc, item) => {
      acc[item.type] = item.count
      return acc
    }, {})

    return {
      activeCustomers: customersByStatus.Active || 0,
      inactiveCustomers: customersByStatus.Inactive || 0,
      recentInteractionsCount: statsData.recentInteractionsCount || 0,
      interactionsByType,
      recentActivities: statsData.recentActivities || [],
    }
  }, [statsData])

  return (
    <section className="dashboard-page">
      <section className="metrics dashboard-metrics" aria-label="Dashboard metrics">
        <article>
          <span>Total Customers</span>
          <strong>{statsData.totalCustomers || 0}</strong>
        </article>
        <article>
          <span>Active Customers</span>
          <strong>{stats.activeCustomers}</strong>
        </article>
        <article>
          <span>Inactive Customers</span>
          <strong>{stats.inactiveCustomers}</strong>
        </article>
        <article>
          <span>Interactions Last 7 Days</span>
          <strong>{stats.recentInteractionsCount}</strong>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel dashboard-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Customer Status</p>
              <h2>Customers by Status</h2>
            </div>
          </div>
          <div className="status-summary">
            <article>
              <span className="status-dot active-dot" />
              <div>
                <strong>Active</strong>
                <span>{stats.activeCustomers} customer(s)</span>
              </div>
            </article>
            <article>
              <span className="status-dot inactive-dot" />
              <div>
                <strong>Inactive</strong>
                <span>{stats.inactiveCustomers} customer(s)</span>
              </div>
            </article>
          </div>
        </section>

        <section className="panel dashboard-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CRM Activity Summary</p>
              <h2>Interaction Mix</h2>
            </div>
          </div>
          <div className="activity-mix">
            {Object.entries(typeLabels).map(([type, label]) => (
              <article key={type}>
                <span>{label}</span>
                <strong>{stats.interactionsByType[type] || 0}</strong>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel dashboard-card recent-activity-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recent CRM Activities</p>
            <h2>Latest Customer Interactions</h2>
          </div>
          {loadingDashboard && <span className="loading-note">Loading...</span>}
        </div>

        {dashboardError && <div className="interaction-error">{dashboardError}</div>}

        <div className="activity-timeline">
          {stats.recentActivities.length === 0 ? (
            <div className="empty-state">No recent customer interactions yet.</div>
          ) : (
            stats.recentActivities.map((activity) => (
              <article key={activity.id}>
                <span className="timeline-marker" aria-hidden="true" />
                <div>
                  <div className="activity-title-row">
                    <strong>{activity.customerName}</strong>
                    <span>{formatDateTime(activity.interactionTime)}</span>
                  </div>
                  <p>
                    <b>{typeLabels[activity.interactionType] || activity.interactionType}:</b>{' '}
                    {activity.title}
                    {activity.description ? ` - ${activity.description}` : ''}
                  </p>
                  <button type="button" className="text-button" onClick={() => onOpenProfile(activity.customerId)}>
                    Open customer profile
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  )
}
