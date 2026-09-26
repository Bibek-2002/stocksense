import { useEffect, useState } from 'react'
import api from '../api/axios'

const emptyForm = () => ({
  name: '',
  sku: '',
  category_id: '',
  uom: 'unit',
  reorder_level: 0,
  lead_time_days: 5
})

function getErrorMessage(error, fallback) {
  return error.response?.data?.error || fallback
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const fetchAll = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          api.get('/products', { signal: controller.signal }),
          api.get('/categories', { signal: controller.signal })
        ])
        setProducts(productResponse.data)
        setCategories(categoryResponse.data)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setLoadError(getErrorMessage(requestError, 'Products could not be loaded. Check your connection and try again.'))
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchAll()
    return () => controller.abort()
  }, [reloadKey])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      category_id: form.category_id || null,
      reorder_level: Number(form.reorder_level),
      lead_time_days: Number(form.lead_time_days)
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload)
      } else {
        await api.post('/products', payload)
      }
      resetForm()
      setReloadKey(key => key + 1)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Product could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product._id)
    setError('')
    setForm({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id?._id || '',
      uom: product.uom || 'unit',
      reorder_level: product.reorder_level ?? 0,
      lead_time_days: product.lead_time_days ?? 5
    })
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return
    setError('')
    setDeletingId(product._id)
    try {
      await api.delete(`/products/${product._id}`)
      setProducts(current => current.filter(item => item._id !== product._id))
      if (editingId === product._id) resetForm()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Product could not be deleted.'))
    } finally {
      setDeletingId(null)
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const visibleProducts = products.filter(product =>
    `${product.name} ${product.sku} ${product.category_id?.name || ''}`.toLowerCase().includes(normalizedQuery)
  )

  return (
    <main className="page-content products-page">
      <header className="page-heading products-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
          <p>Manage the items your team stores and moves.</p>
        </div>
        <span className="section-count">{products.length} {products.length === 1 ? 'product' : 'products'}</span>
      </header>

      <section className="product-editor" aria-labelledby="product-form-heading">
        <header className="product-editor-heading">
          <div>
            <p className="eyebrow">Product details</p>
            <h2 id="product-form-heading">{editingId ? 'Edit product' : 'Add a product'}</h2>
          </div>
          {editingId && <button className="quiet-button" type="button" onClick={resetForm}>Cancel edit</button>}
        </header>
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="product-field">
            <label htmlFor="product-name">Product name</label>
            <input id="product-name" name="name" autoComplete="off" value={form.name} onChange={handleChange} required disabled={saving} />
          </div>
          <div className="product-field">
            <label htmlFor="product-sku">SKU</label>
            <input id="product-sku" name="sku" autoComplete="off" value={form.sku} onChange={handleChange} required disabled={saving} />
          </div>
          <div className="product-field">
            <label htmlFor="product-category">Category</label>
            <select id="product-category" name="category_id" value={form.category_id} onChange={handleChange} disabled={saving}>
              <option value="">No category</option>
              {categories.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          <div className="product-field">
            <label htmlFor="product-uom">Unit of measure</label>
            <input id="product-uom" name="uom" value={form.uom} onChange={handleChange} disabled={saving} />
          </div>
          <div className="product-field">
            <label htmlFor="product-reorder-level">Reorder level</label>
            <input id="product-reorder-level" name="reorder_level" type="number" min="0" step="1" value={form.reorder_level} onChange={handleChange} required disabled={saving} />
          </div>
          <div className="product-field">
            <label htmlFor="product-lead-time">Lead time (days)</label>
            <input id="product-lead-time" name="lead_time_days" type="number" min="0" step="1" value={form.lead_time_days} onChange={handleChange} required disabled={saving} />
          </div>
          {error && <p className="product-error" role="alert">{error}</p>}
          <div className="product-form-actions">
            <button className="product-primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add product'}
            </button>
            {editingId && <span className="edit-indicator">Editing catalog item</span>}
          </div>
        </form>
      </section>

      <section className="product-list-section" aria-labelledby="product-list-heading">
        <header className="product-list-heading">
          <div>
            <p className="eyebrow">Inventory catalog</p>
            <h2 id="product-list-heading">All products</h2>
          </div>
          <label className="product-search">
            <span className="visually-hidden">Search products</span>
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, SKU, category" />
          </label>
        </header>

        {loadError ? (
          <div className="products-load-error" role="alert">
            <p>{loadError}</p>
            <button className="quiet-button" type="button" onClick={() => setReloadKey(key => key + 1)}>Try again</button>
          </div>
        ) : loading ? (
          <p className="products-status" role="status">Loading products...</p>
        ) : visibleProducts.length === 0 ? (
          <p className="products-status">{products.length ? 'No products match this search.' : 'No products in the catalog yet.'}</p>
        ) : (
          <div className="product-table-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Category</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Reorder</th>
                  <th scope="col">Lead time</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map(product => (
                  <tr key={product._id}>
                    <td className="product-name-cell">{product.name}</td>
                    <td><span className="sku-value">{product.sku}</span></td>
                    <td>{product.category_id?.name || <span className="muted-value">Unassigned</span>}</td>
                    <td>{product.uom || 'unit'}</td>
                    <td>{product.reorder_level ?? 0}</td>
                    <td>{product.lead_time_days ?? 5} days</td>
                    <td>
                      <div className="product-row-actions">
                        <button className="row-action" type="button" onClick={() => handleEdit(product)} disabled={saving || deletingId === product._id}>Edit</button>
                        <button className="row-action row-action-delete" type="button" onClick={() => handleDelete(product)} disabled={deletingId === product._id}>
                          {deletingId === product._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
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