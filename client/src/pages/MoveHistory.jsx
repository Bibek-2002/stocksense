import { useEffect, useState } from 'react'
import api from '../api/axios'

const pageSize = 15

export default function MoveHistory() {
  const [moves, setMoves] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const fetchLedger = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/dashboard/ledger?page=${page}&limit=${pageSize}`, { signal: controller.signal })
        setMoves(data.moves)
        setPages(Math.max(1, data.pages))
        setTotal(data.total)
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError.response?.data?.error || 'Ledger could not be loaded. Check your connection and try again.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchLedger()
    return () => controller.abort()
  }, [page, retryKey])

  const formatDate = (date) => {
    const parsedDate = new Date(date)
    return Number.isNaN(parsedDate.getTime()) ? 'Unknown date' : parsedDate.toLocaleString()
  }

  return (
    <main className="page-content ledger-page">
      <header className="page-heading ledger-heading">
        <div>
          <p className="eyebrow">Immutable audit trail</p>
          <h1>Move History</h1>
          <p>Every validated stock movement, permanently recorded and never edited.</p>
        </div>
        <span className="section-count">{total} {total === 1 ? 'movement' : 'movements'}</span>
      </header>

      {error ? (
        <div className="ledger-error" role="alert">
          <p>{error}</p>
          <button className="quiet-button" type="button" onClick={() => setRetryKey(key => key + 1)}>Try again</button>
        </div>
      ) : loading ? (
        <p className="products-status" role="status">Loading ledger...</p>
      ) : moves.length === 0 ? (
        <p className="products-status">No stock movements have been recorded yet.</p>
      ) : (
        <>
          <div className="product-table-scroll ledger-table-scroll">
            <table className="product-table ledger-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Product</th>
                  <th scope="col">Type</th>
                  <th scope="col">From</th>
                  <th scope="col">To</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Reference</th>
                </tr>
              </thead>
              <tbody>
                {moves.map(move => (
                  <tr key={move._id}>
                    <td className="ledger-date">{formatDate(move.created_at)}</td>
                    <td className="product-name-cell">{move.product_id?.name || 'Unknown product'}<span className="ledger-sku">{move.product_id?.sku}</span></td>
                    <td><span className={`ledger-type ledger-${move.move_type}`}>{move.move_type}</span></td>
                    <td>{move.from_location_id?.name || <span className="muted-value">External</span>}</td>
                    <td>{move.to_location_id?.name || <span className="muted-value">External</span>}</td>
                    <td className="ledger-quantity">{move.move_type === 'adjustment' && move.from_location_id ? '-' : ''}{move.quantity}</td>
                    <td className="ledger-reference">{move.reference || <span className="muted-value">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="ledger-pagination" aria-label="Ledger pages">
            <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
            <div>
              <button className="quiet-button" type="button" onClick={() => setPage(current => current - 1)} disabled={page <= 1 || loading}>Previous</button>
              <span className="ledger-page-number">Page {page} of {pages}</span>
              <button className="quiet-button" type="button" onClick={() => setPage(current => current + 1)} disabled={page >= pages || loading}>Next</button>
            </div>
          </nav>
        </>
      )}
    </main>
  )
}