import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const emptyForm = () => ({ name: '', type: 'warehouse', parent_id: '' })

export default function Locations() {
  const { user } = useAuth()
  const canManage = user?.role === 'manager'
  const [locations, setLocations] = useState([])
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
    const fetchLocations = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const { data } = await api.get('/locations', { signal: controller.signal })
        setLocations(data)
      } catch (requestError) {
        if (!controller.signal.aborted) setLoadError(requestError.response?.data?.error || 'Locations could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchLocations()
    return () => controller.abort()
  }, [reloadKey])

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    const payload = { ...form, name: form.name.trim(), parent_id: form.parent_id || null }
    try {
      if (editingId) await api.put(`/locations/${editingId}`, payload)
      else await api.post('/locations', payload)
      resetForm()
      setReloadKey(key => key + 1)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Manager access required, or the location could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (location) => {
    if (!window.confirm(`Delete ${location.name}?`)) return
    setError('')
    setDeletingId(location._id)
    try {
      await api.delete(`/locations/${location._id}`)
      setLocations(current => current.filter(item => item._id !== location._id))
      if (editingId === location._id) resetForm()
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Manager access required, or the location could not be deleted.')
    } finally {
      setDeletingId(null)
    }
  }

  const visibleLocations = locations.filter(location =>
    `${location.name} ${location.type} ${location.parent_id?.name || ''}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <main className="page-content catalog-page">
      <header className="page-heading catalog-heading">
        <div>
          <p className="eyebrow">Warehouse structure</p>
          <h1>Locations</h1>
          <p>Keep warehouse sites and stock locations in view.</p>
        </div>
        <span className="section-count">{locations.length} {locations.length === 1 ? 'location' : 'locations'}</span>
      </header>

      {!canManage && <p className="manager-notice" role="note">Manager access is required to add, edit, or delete locations. You can still view the location list.</p>}

      <section className="catalog-editor" aria-labelledby="location-form-heading">
        <header className="catalog-editor-heading">
          <div>
            <p className="eyebrow">Warehouse structure</p>
            <h2 id="location-form-heading">{editingId ? 'Edit location' : 'Add a location'}</h2>
          </div>
          {editingId && canManage && <button className="quiet-button" type="button" onClick={resetForm}>Cancel edit</button>}
        </header>
        <form className="location-form" onSubmit={handleSubmit}>
          <div className="product-field">
            <label htmlFor="location-name">Location name</label>
            <input id="location-name" name="name" value={form.name} onChange={handleChange} required disabled={!canManage || saving} />
          </div>
          <div className="product-field">
            <label htmlFor="location-type">Type</label>
            <select id="location-type" name="type" value={form.type} onChange={handleChange} disabled={!canManage || saving}>
              <option value="warehouse">Warehouse</option>
              <option value="rack">Rack</option>
              <option value="floor">Floor</option>
              <option value="vendor">Vendor</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div className="product-field">
            <label htmlFor="location-parent">Parent location</label>
            <select id="location-parent" name="parent_id" value={form.parent_id} onChange={handleChange} disabled={!canManage || saving}>
              <option value="">No parent</option>
              {locations.filter(location => location._id !== editingId).map(location => (
                <option key={location._id} value={location._id}>{location.name} ({location.type})</option>
              ))}
            </select>
          </div>
          {canManage && (
            <div className="product-form-actions">
              <button className="product-primary-button" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add location'}
              </button>
            </div>
          )}
          {error && <p className="product-error" role="alert">{error}</p>}
        </form>
      </section>

      <section className="catalog-list-section" aria-labelledby="location-list-heading">
        <header className="product-list-heading">
          <div>
            <p className="eyebrow">Warehouse structure</p>
            <h2 id="location-list-heading">All locations</h2>
          </div>
          <label className="product-search">
            <span className="visually-hidden">Search locations</span>
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search locations" />
          </label>
        </header>
        {loadError ? (
          <div className="products-load-error" role="alert">
            <p>{loadError}</p>
            <button className="quiet-button" type="button" onClick={() => setReloadKey(key => key + 1)}>Try again</button>
          </div>
        ) : loading ? (
          <p className="products-status" role="status">Loading locations...</p>
        ) : visibleLocations.length === 0 ? (
          <p className="products-status">{locations.length ? 'No locations match this search.' : 'No locations in the warehouse structure yet.'}</p>
        ) : (
          <div className="product-table-scroll">
            <table className="product-table simple-table">
              <thead><tr><th scope="col">Location</th><th scope="col">Type</th><th scope="col">Parent</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {visibleLocations.map(location => (
                  <tr key={location._id}>
                    <td className="product-name-cell">{location.name}</td>
                    <td><span className={`location-type type-${location.type}`}>{location.type}</span></td>
                    <td>{location.parent_id?.name || <span className="muted-value">No parent</span>}</td>
                    <td>
                      {canManage && (
                        <div className="product-row-actions">
                          <button className="row-action" type="button" onClick={() => { setEditingId(location._id); setForm({ name: location.name, type: location.type, parent_id: location.parent_id?._id || '' }); setError('') }} disabled={saving || deletingId === location._id}>Edit</button>
                          <button className="row-action row-action-delete" type="button" onClick={() => handleDelete(location)} disabled={deletingId === location._id}>
                            {deletingId === location._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
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