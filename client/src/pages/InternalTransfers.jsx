import { useEffect, useState } from 'react'
import api from '../api/axios'

const emptyForm = () => ({
  source_location_id: '',
  dest_location_id: '',
  lines: [{ product_id: '', quantity: 1 }]
})

export default function InternalTransfers() {
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
          api.get('/operations?type=internal', { signal: controller.signal }),
          api.get('/products', { signal: controller.signal }),
          api.get('/locations', { signal: controller.signal })
        ])
        setOperations(operationResponse.data)
        setProducts(productResponse.data)
        setLocations(locationResponse.data)
      } catch (requestError) {
        if (!controller.signal.aborted) setLoadError(requestError.response?.data?.error || 'Transfer data could not be loaded.')
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

  const addLine = () => setForm(current => ({ ...current, lines: [...current.lines, { product_id: '', quantity: 1 }] }))
  const removeLine = (index) => setForm(current => ({ ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) }))

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    if (form.source_location_id === form.dest_location_id) {
      setError('Source and destination locations must be different.')
      return
    }
    setSaving(true)
    const payload = {
      type: 'internal',
      source_location_id: form.source_location_id,
      dest_location_id: form.dest_location_id,
      lines: form.lines.map(line => ({ product_id: line.product_id, quantity: Number(line.quantity) }))
    }
    try {
      await api.post('/operations', payload)
      setForm(emptyForm())
      setReloadKey(key => key + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Transfer could not be created.')
    } finally {
      setSaving(false)
    }
  }

  const handleValidate = async (operation) => {
    setActionError('')
    setValidatingId(operation._id)
    try {
      await api.post(`/operations/${operation._id}/validate`)
      setReloadKey(key => key + 1)
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || 'Transfer validation failed.')
    } finally {
      setValidatingId(null)
    }
  }

  return (
    <main className="page-content receipts-page">
      <header className="page-heading receipt-heading">
        <div>
          <p className="eyebrow">Internal movement</p>
          <h1>Internal Transfers</h1>
          <p>Move stock between locations while preserving the inventory total.</p>
        </div>
        <span className="section-count">{operations.length} {operations.length === 1 ? 'transfer' : 'transfers'}</span>
      </header>

      <section className="receipt-editor" aria-labelledby="transfer-form-heading">
        <header className="receipt-editor-heading">
          <div><p className="eyebrow">Stock movement</p><h2 id="transfer-form-heading">Create transfer draft</h2></div>
          <span className="draft-label">Draft</span>
        </header>
        <form onSubmit={handleCreate}>
          <div className="receipt-header-fields">
            <div className="product-field">
              <label htmlFor="transfer-source">From location</label>
              <select id="transfer-source" value={form.source_location_id} onChange={event => setForm(current => ({ ...current, source_location_id: event.target.value }))} required disabled={saving}>
                <option value="">Select source</option>
                {locations.map(location => <option key={location._id} value={location._id}>{location.name} ({location.type})</option>)}
              </select>
            </div>
            <div className="product-field">
              <label htmlFor="transfer-destination">To location</label>
              <select id="transfer-destination" value={form.dest_location_id} onChange={event => setForm(current => ({ ...current, dest_location_id: event.target.value }))} required disabled={saving}>
                <option value="">Select destination</option>
                {locations.map(location => <option key={location._id} value={location._id}>{location.name} ({location.type})</option>)}
              </select>
            </div>
          </div>
          <div className="receipt-lines-heading"><h3>Product lines</h3><span>{form.lines.length} {form.lines.length === 1 ? 'line' : 'lines'}</span></div>
          <div className="receipt-lines">
            {form.lines.map((line, index) => (
              <div className="receipt-line" key={index}>
                <span className="receipt-line-number">{String(index + 1).padStart(2, '0')}</span>
                <div className="product-field receipt-line-product">
                  <label htmlFor={`transfer-product-${index}`}>Product</label>
                  <select id={`transfer-product-${index}`} value={line.product_id} onChange={event => updateLine(index, 'product_id', event.target.value)} required disabled={saving}>
                    <option value="">Select product</option>
                    {products.map(product => <option key={product._id} value={product._id}>{product.name} ({product.sku})</option>)}
                  </select>
                </div>
                <div className="product-field receipt-line-quantity">
                  <label htmlFor={`transfer-quantity-${index}`}>Quantity</label>
                  <input id={`transfer-quantity-${index}`} type="number" min="1" step="1" value={line.quantity} onChange={event => updateLine(index, 'quantity', event.target.value)} required disabled={saving} />
                </div>
                <button className="line-remove-button" type="button" onClick={() => removeLine(index)} disabled={saving || form.lines.length === 1} aria-label={`Remove line ${index + 1}`} title="Remove line">×</button>
              </div>
            ))}
          </div>
          <div className="receipt-form-footer">
            <button className="quiet-button add-line-button" type="button" onClick={addLine} disabled={saving}>+ Add product line</button>
            <div className="receipt-submit-group">
              {error && <p className="product-error" role="alert">{error}</p>}
              <button className="product-primary-button" type="submit" disabled={saving || !products.length || locations.length < 2}>
                {saving ? 'Creating draft...' : 'Create transfer draft'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="receipt-list-section" aria-labelledby="transfer-list-heading">
        <header className="product-list-heading">
          <div><p className="eyebrow">Location activity</p><h2 id="transfer-list-heading">Transfer history</h2></div>
        </header>
        {actionError && <p className="receipt-action-error" role="alert">{actionError}</p>}
        {loadError ? (
          <div className="products-load-error" role="alert"><p>{loadError}</p><button className="quiet-button" type="button" onClick={() => setReloadKey(key => key + 1)}>Try again</button></div>
        ) : loading ? (
          <p className="products-status" role="status">Loading transfers...</p>
        ) : operations.length === 0 ? (
          <p className="products-status">No transfers recorded yet.</p>
        ) : (
          <div className="product-table-scroll">
            <table className="product-table receipt-table">
              <thead><tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Product lines</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {operations.map(operation => (
                  <tr key={operation._id}>
                    <td className="product-name-cell">{operation.source_location_id?.name || 'Unknown location'}</td>
                    <td>{operation.dest_location_id?.name || 'Unknown location'}</td>
                    <td><div className="receipt-line-summary">{operation.lines.map((line, index) => <span key={`${operation._id}-${index}`}>{line.product_id?.name || 'Unknown product'} <b>× {line.quantity}</b></span>)}</div></td>
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