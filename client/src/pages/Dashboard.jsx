import { useEffect, useState } from 'react'
import api from '../api/axios'

const numberFormat = new Intl.NumberFormat('en-IN')

function getErrorMessage(error) {
  return error.response?.data?.error || 'Dashboard data could not be loaded. Check your connection and try again.'
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const [kpiResponse, suggestionResponse] = await Promise.all([
          api.get('/dashboard/kpis', { signal: controller.signal }),
          api.get('/dashboard/reorder-suggestions', { signal: controller.signal })
        ])
        setKpis(kpiResponse.data)
        setSuggestions(suggestionResponse.data)
      } catch (requestError) {
        if (!controller.signal.aborted) setError(getErrorMessage(requestError))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [reloadKey])

  const metrics = kpis && [
    { label: 'Total products', value: kpis.totalProducts, note: 'Active catalog', tone: 'forest' },
    { label: 'Low stock items', value: kpis.lowStockCount, note: 'At or below reorder level', tone: kpis.lowStockCount > 0 ? 'amber' : 'neutral' },
    { label: 'Out of stock', value: kpis.outOfStockCount, note: 'No units available', tone: kpis.outOfStockCount > 0 ? 'red' : 'neutral' },
    { label: 'Pending receipts', value: kpis.pendingReceipts, note: 'Awaiting validation', tone: 'blue' },
    { label: 'Pending deliveries', value: kpis.pendingDeliveries, note: 'Awaiting validation', tone: 'blue' },
    { label: 'Scheduled transfers', value: kpis.scheduledTransfers, note: 'Open internal moves', tone: 'neutral' }
  ]

  return (
    <main className="page-content dashboard-page">
      <header className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>Dashboard</h1>
          <p>A current view of stock positions, open work, and replenishment.</p>
        </div>
      </header>

      {error ? (
        <div className="dashboard-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey(key => key + 1)}>Try again</button>
        </div>
      ) : (
        <>
          <section className="kpi-grid" aria-label="Inventory key performance indicators" aria-busy={loading}>
            {loading ? (
              Array.from({ length: 6 }, (_, index) => (
                <div className="kpi-card kpi-skeleton" key={index} role="status">
                  <span className="skeleton-label" />
                  <span className="skeleton-value" />
                  <span className="skeleton-note" />
                </div>
              ))
            ) : metrics.map(metric => (
              <article className={`kpi-card tone-${metric.tone}`} key={metric.label}>
                <p className="kpi-label">{metric.label}</p>
                <p className="kpi-value">{numberFormat.format(metric.value)}</p>
                <p className="kpi-note">{metric.note}</p>
              </article>
            ))}
          </section>

          <section className="reorder-section" aria-labelledby="reorder-heading">
            <header className="section-heading">
              <div>
                <p className="eyebrow">Demand-led replenishment</p>
                <h2 id="reorder-heading">Reorder suggestions</h2>
              </div>
              {!loading && <span className="section-count">{suggestions.length} {suggestions.length === 1 ? 'product' : 'products'}</span>}
            </header>

            {loading ? (
              <p className="section-loading" role="status">Calculating recent demand...</p>
            ) : suggestions.length === 0 ? (
              <p className="suggestion-empty">No reorder signals yet. A product needs recent delivery history to estimate demand.</p>
            ) : (
              <div className="suggestion-list">
                {suggestions.map(suggestion => (
                  <article className="suggestion-row" key={String(suggestion.product_id)}>
                    <div className="suggestion-product">
                      <h3>{suggestion.name}</h3>
                      <p>{suggestion.sku}</p>
                    </div>
                    <div className="suggestion-stat">
                      <span>Daily movement</span>
                      <strong>{suggestion.avgDailySales} <small>units/day</small></strong>
                    </div>
                    <div className="suggestion-stat">
                      <span>On hand</span>
                      <strong>{numberFormat.format(suggestion.currentStock)} <small>units</small></strong>
                    </div>
                    <div className="suggestion-stat">
                      <span>Days of cover</span>
                      <strong>{suggestion.daysOfCover} <small>days</small></strong>
                    </div>
                    <div className="suggestion-order">
                      <span>Suggested order</span>
                      <strong>{numberFormat.format(suggestion.suggestedOrder)}</strong>
                    </div>
                    <p className="suggestion-reason">
                      Based on the last 30 days, average outbound movement is {suggestion.avgDailySales} units per day.
                      At current stock, that is about {suggestion.daysOfCover} days of cover. Suggested reorder: {numberFormat.format(suggestion.suggestedOrder)} units.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}