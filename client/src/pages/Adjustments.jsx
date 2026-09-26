import { useEffect, useState } from 'react'
import api from '../api/axios'

const emptyForm = () => ({
  notes: '',
  dest_location_id: '',
  lines: [{ product_id: '', quantity: 0 }]
})

export default function Adjustments() {
  const [operations, setOperations] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validatingId, setValidatingId] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const fetchAll = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [operationResponse, productResponse, locationResponse] = await Promise.all([
          api.get('/operations?type=adjustment', { signal: controller.signal }),
          api.get('/products', { signal: controller.signal }),
          api.get('/locations', { signal: controller.signal })
        ])
        setOperations(operationResponse.data)
        setProducts(productResponse.data)
        setLocations(locationResponse.data)
      } catch (requestError) {
        if (!controller.signal.aborted) setLoadError(requestError.response?.data?.error || 'Adjustment data could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchAll()
    return () => controller.abort()
  }, [reloadKey])

  const updateLine = (index, field, value) => {
    setForm(current => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line)
    }))
  }

  const addLine = () => setForm(current => ({ ...current, lines: [...current.lines, { product_id: '', quantity: 0 }] }))
  const removeLine = (index) => setForm(current => ({ ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) }))

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      type: 'adjustment',
      notes: form.notes.trim(),
      dest_location_id: form.dest_location_id,
      lines: form.lines.map(line => ({ product_id: line.product_id, quantity: Number(line.quantity) }))
    }
    try {
      await api.post('/operations', payload)
      setForm(emptyForm())
      setReloadKey(key => key + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Adjustment could not be created.')
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async (operation) => {
    const hasNegativeDelta = operation.lines.some(line => line.quantity < 0)
    if (hasNegativeDelta && !window.confirm('This adjustment will reduce stock. Validate this loss?')) return
    setActionError('')
    setValidatingId(operation._id)
    try {
      await api.post(`/operations/${operation._id}/validate`)
      setReloadKey(key => key + 1)
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || 'Adjustment validation failed.')
    } finally {
      setValidatingId(null)
    }
  }

  return (
    <main className="page-content receipts-page">
      <header className="page-heading receipt-heading">
        <div>
          <p className="eyebrow">Stock reconciliation</p>
          <h1>Adjustments</h1>
          <p>Record count corrections, found stock, damage, or loss at a location.</p>
        </div>
        <span className="section-count">{operations.length} {operations.length === 1 ? 'adjustment' : 'adjustments'}</span>
      </header>

      <section className="receipt-editor" aria-labelledby="adjustment-form-heading">
        <header className="receipt-editor-heading">
          <div><p className="eyebrow">Inventory correction</p><h2 id="adjustment-form-heading">Create adjustment draft</h2></div>
          <span className="draft-label">Draft</span>
        </header>
        <form onSubmit={handleCreate}>
          <div className="receipt-header-fields">
            <div className="product-field">
              <label htmlFor="adjustment-reason">Reason</label>
              <input id="adjustment-reason" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} required disabled={saving} />
            </div>
            <div className="product-field">
              <label htmlFor="adjustment-location">Location</label>
              <select id="adjustment-location" value={form.dest_location_id} onChange={event => setForm(current => ({ ...current, dest_location_id: event.target.value }))} required disabled={saving}>
                <option value="">Select a location</option>
                {locations.map(location => <option key={location._id} value={location._id}>{location.name} ({location.type})</option>)}
              </select>
            </div>
          </div>
          <div className="receipt-lines-heading">
            <h3>Stock deltas</h3>
            <span>Positive adds stock · negative removes stock</span>
          </div>
          <div className="receipt-lines">
            {form.lines.map((line, index) => (
              <div className="receipt-line" key={index}>
                <span className="receipt-line-number">{String(index + 1).padStart(2, '0')}</span>
                <div className="product-field receipt-line-product">
                  <label htmlFor={`adjustment-product-${index}`}>Product</label>
                  <select id={`adjustment-product-${index}`} value={line.product_id} onChange={event => updateLine(index, 'product_id', event.target.value)} required disabled={saving}>
                    <option value="">Select product</option>
                    {products.map(product => <option key={product._id} value={product._id}>{product.name} ({product.sku})</option>)}
                  </select>
                </div>
                <div className="product-field receipt-line-quantity">
                  <label htmlFor={`adjustment-quantity-${index}`}>Signed quantity</label>
                  <input id={`adjustment-quantity-${index}`} type="number" step="any" value={line.quantity} onChange={event => updateLine(index, 'quantity', event.target.value)} required disabled={saving} />
                </div>
                <button className="line-remove-button" type="button" onClick={() => removeLine(index)} disabled={saving || form.lines.length === 1} aria-label={`Remove line ${index + 1}`} title="Remove line">×</button>
              </div>
            ))}
          </div>
          <div className="receipt-form-footer">
            <button className="quiet-button add-line-button" type="button" onClick={addLine} disabled={saving}>+ Add product line</button>
            <div className="receipt-submit-group">
              {error && <p className="product-error" role="alert">{error}</p>}
              <button className="product-primary-button" type="submit" disabled={saving || !products.length || !locations.length}>
                {saving ? 'Creating draft...' : 'Create adjustment draft'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="receipt-list-section" aria-labelledby="adjustment-list-heading">
        <header className="product-list-heading">
          <div><p className="eyebrow">Reconciliation activity</p><h2 id="adjustment-list-heading">Adjustment history</h2></div>
        </header>
        {actionError && <p className="receipt-action-error" role="alert">{actionError}</p>}
        {loadError ? (
          <div className="products-load-error" role="alert"><p>{loadError}</p><button className="quiet-button" type="button" onClick={() => setReloadKey(key => key + 1)}>Try again</button></div>
        ) : loading ? (
          <p className="products-status" role="status">Loading adjustments...</p>
        ) : operations.length === 0 ? (
          <p className="products-status">No adjustments recorded yet.</p>
        ) : (
          <div className="product-table-scroll">
            <table className="product-table receipt-table">
              <thead><tr><th scope="col">Reason</th><th scope="col">Location</th><th scope="col">Stock deltas</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {operations.map(operation => (
                  <tr key={operation._id}>
                    <td className="product-name-cell">{operation.notes || 'Unspecified reason'}</td>
                    <td>{operation.dest_location_id?.name || operation.source_location_id?.name || 'Unknown location'}</td>
                    <td><div className="receipt-line-summary">{operation.lines.map((line, index) => <span className={line.quantity < 0 ? 'delta-negative' : 'delta-positive'} key={`${operation._id}-${index}`}>{line.product_id?.name || 'Unknown product'} <b>{line.quantity > 0 ? '+' : ''}{line.quantity}</b></span>)}</div></td>
                    <td><span className={`operation-status status-${operation.status}`}>{operation.status}</span></td>
                    <td>{operation.status !== 'done' && operation.status !== 'canceled' && <button className="validate-button" type="button" onClick={() => handleValidate(operation)} disabled={validatingId === operation._id}>{validatingId === operation._id ? 'Validating...' : 'Validate'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}