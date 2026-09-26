import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const fetchCategories = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/categories', { signal: controller.signal })
        setCategories(data)
      } catch (requestError) {
        if (!controller.signal.aborted) setError(requestError.response?.data?.error || 'Categories could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchCategories()
    return () => controller.abort()
  }, [reloadKey])

  const resetForm = () => {
    setName('')
    setEditingId(null)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) await api.put(`/categories/${editingId}`, { name: name.trim() })
      else await api.post('/categories', { name: name.trim() })
      resetForm()
      setReloadKey(key => key + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Category could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return
    setError('')
    setDeletingId(category._id)
    try {
      await api.delete(`/categories/${category._id}`)
      setCategories(current => current.filter(item => item._id !== category._id))
      if (editingId === category._id) resetForm()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Category could not be deleted.')
    } finally {
      setDeletingId(null)
    }
  }

  const visibleCategories = categories.filter(category =>
    category.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <main className="page-content catalog-page">
      <header className="page-heading catalog-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Categories</h1>
          <p>Organize products into useful inventory groups.</p>
        </div>
        <span className="section-count">{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>
      </header>

      <section className="catalog-editor" aria-labelledby="category-form-heading">
        <header className="catalog-editor-heading">
          <div>
            <p className="eyebrow">Product organization</p>
            <h2 id="category-form-heading">{editingId ? 'Edit category' : 'Add a category'}</h2>
          </div>
          {editingId && <button className="quiet-button" type="button" onClick={resetForm}>Cancel edit</button>}
        </header>
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="product-field">
            <label htmlFor="category-name">Category name</label>
            <input id="category-name" value={name} onChange={event => setName(event.target.value)} required disabled={saving} />
          </div>
          <div className="product-form-actions">
            <button className="product-primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add category'}
            </button>
          </div>
          {error && <p className="product-error" role="alert">{error}</p>}
        </form>
      </section>

      <section className="catalog-list-section" aria-labelledby="category-list-heading">
        <header className="product-list-heading">
          <div>
            <p className="eyebrow">Product organization</p>
            <h2 id="category-list-heading">All categories</h2>
          </div>
          <label className="product-search">
            <span className="visually-hidden">Search categories</span>
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search categories" />
          </label>
        </header>
        {error && !loading && <p className="product-error" role="alert">{error}</p>}
        {loading ? (
          <p className="products-status" role="status">Loading categories...</p>
        ) : visibleCategories.length === 0 ? (
          <p className="products-status">{categories.length ? 'No categories match this search.' : 'No categories in the catalog yet.'}</p>
        ) : (
          <div className="product-table-scroll">
            <table className="product-table simple-table">
              <thead><tr><th scope="col">Category</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {visibleCategories.map(category => (
                  <tr key={category._id}>
                    <td className="product-name-cell">{category.name}</td>
                    <td>
                      <div className="product-row-actions">
                        <button className="row-action" type="button" onClick={() => { setEditingId(category._id); setName(category.name); setError('') }} disabled={saving || deletingId === category._id}>Edit</button>
                        <button className="row-action row-action-delete" type="button" onClick={() => handleDelete(category)} disabled={deletingId === category._id}>
                          {deletingId === category._id ? 'Deleting...' : 'Delete'}
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