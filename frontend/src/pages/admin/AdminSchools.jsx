import { useEffect, useState } from 'react'
import api from '../../api'

export default function AdminSchools() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingSchool, setEditingSchool] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadSchools = () => {
    setLoading(true)
    api.get('/schools/?limit=500')
      .then(res => setSchools(res.data.schools || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSchools() }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`DELETE "${name}" permanently? All its majors, scholarships will be deleted too.`)) return
    try {
      await api.delete(`/admin/schools/${id}`)
      loadSchools()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const filtered = schools.filter(s => {
    if (!search) return true
    return s.name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">Schools</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{schools.length} total schools</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 sm:px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0"
        >
          + Add School
        </button>
      </div>

      <input
        type="text"
        placeholder="Search schools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
      />

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
          {filtered.map(school => (
            <SchoolRow 
              key={school.id} 
              school={school} 
              onEdit={() => setEditingSchool(school)}
              onDelete={() => handleDelete(school.id, school.name)}
              onUploadDone={loadSchools}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <SchoolFormModal
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); loadSchools() }}
        />
      )}

      {editingSchool && (
        <SchoolFormModal
          school={editingSchool}
          onClose={() => setEditingSchool(null)}
          onSaved={() => { setEditingSchool(null); loadSchools() }}
        />
      )}
    </div>
  )
}


function SchoolRow({ school, onEdit, onDelete, onUploadDone }) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/admin/schools/${school.id}/upload-logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onUploadDone()
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploadingLogo(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/admin/schools/${school.id}/upload-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onUploadDone()
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      {/* Top row: Logo + Info */}
      <div className="flex items-start gap-3">
        {/* Logo preview */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-gray-100 p-1 border border-gray-200 flex-shrink-0">
          {school.logo_url ? (
            <img src={school.logo_url} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-500 to-purple-500 rounded text-white font-bold flex items-center justify-center text-sm sm:text-base">
              {school.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Cover photo - hidden on mobile */}
        <div className="hidden md:block w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
          {school.image_url ? (
            <img src={school.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white break-words">
            {school.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">
            ID: {school.id} • {school.type || 'No type'} • {school.region || 'No region'}
          </div>
        </div>
      </div>

      {/* Action buttons - wraps on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-3">
        <label className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1 whitespace-nowrap">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploadingLogo ? 'Uploading...' : 'Logo'}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={uploadingLogo}
            className="hidden"
          />
        </label>
        
        <label className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-1 whitespace-nowrap">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {uploadingPhoto ? 'Uploading...' : 'Cover'}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
            className="hidden"
          />
        </label>

        <button
          onClick={onEdit}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium whitespace-nowrap"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs whitespace-nowrap"
        >
          Delete
        </button>
      </div>
    </div>
  )
}


function SchoolFormModal({ school, onClose, onSaved }) {
  const [form, setForm] = useState({
    name_kh: school?.name || '',
    type: school?.type || '',
    region: school?.region || '',
    address: school?.address || '',
    phones: (school?.phones || []).join(', '),
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name_kh: form.name_kh,
        type: form.type || null,
        region: form.region || null,
        address: form.address || null,
        phones: form.phones.split(',').map(s => s.trim()).filter(Boolean),
      }
      
      if (school) {
        await api.patch(`/admin/schools/${school.id}`, payload)
      } else {
        await api.post('/admin/schools', payload)
      }
      onSaved()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {school ? 'Edit School' : 'Add New School'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <Field label="School Name (Khmer)" required>
            <input
              type="text"
              required
              value={form.name_kh}
              onChange={e => setForm({...form, name_kh: e.target.value})}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </Field>

          <Field label="Type">
            <select
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            >
              <option value="">-- Select --</option>
              <option value="គ្រឹះស្ថានឧត្តមសិក្សាសាធារណៈ">សាធារណៈ</option>
              <option value="គ្រឹះស្ថានឧត្តមសិក្សាឯកជន">ឯកជន</option>
            </select>
          </Field>

          <Field label="Region (Province)">
            <input
              type="text"
              value={form.region}
              onChange={e => setForm({...form, region: e.target.value})}
              placeholder="e.g., រាជធានីភ្នំពេញ"
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </Field>

          <Field label="Address">
            <textarea
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </Field>

          <Field label="Phone Numbers (comma-separated)">
            <input
              type="text"
              value={form.phones}
              onChange={e => setForm({...form, phones: e.target.value})}
              placeholder="012 345 678, 098 765 432"
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </Field>

          <div className="flex justify-end gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 sm:px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? 'Saving...' : (school ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {children}
    </label>
  )
}