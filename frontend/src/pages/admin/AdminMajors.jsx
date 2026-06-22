import { useEffect, useState } from 'react'
import api from '../../api'

export default function AdminMajors() {
  const [majors, setMajors] = useState([])
  const [schools, setSchools] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('')
  const [editingMajor, setEditingMajor] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [page, setPage] = useState(0)
  const [showDeptManager, setShowDeptManager] = useState(false)
  const limit = 50

  const loadMajors = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (schoolFilter) params.append('school_id', schoolFilter)
    params.append('limit', limit)
    params.append('offset', page * limit)
    
    api.get(`/admin/majors?${params}`)
      .then(res => {
        setMajors(res.data.majors || [])
        setTotal(res.data.total || 0)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const loadSchools = () => {
    api.get('/admin/schools-list')
      .then(res => setSchools(res.data.schools || []))
      .catch(err => console.error(err))
  }

  useEffect(() => { loadSchools() }, [])
  useEffect(() => { loadMajors() }, [search, schoolFilter, page])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete major "${name}"?`)) return
    try {
      await api.delete(`/admin/majors/${id}`)
      loadMajors()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Majors</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total majors</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeptManager(true)}
            className="px-4 py-2 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-semibold"
          >
            Manage Departments
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold"
          >
            + Add Major
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search majors..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />

        <select
          value={schoolFilter}
          onChange={(e) => { setSchoolFilter(e.target.value); setPage(0) }}
          className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 min-w-[200px]"
        >
          <option value="">All schools</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            {majors.length === 0 ? (
              <p className="text-center py-12 text-gray-500">No majors found</p>
            ) : (
              majors.map(major => (
                <div
                  key={major.id}
                  className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {major.name_kh}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {major.school_name || 'Unknown school'}
                      {major.department_name && ` • ${major.department_name}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingMajor(major)}
                      className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(major.id, major.name_kh)}
                      className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showAddForm && (
        <MajorFormModal
          schools={schools}
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); loadMajors() }}
        />
      )}

      {editingMajor && (
        <MajorFormModal
          major={editingMajor}
          schools={schools}
          onClose={() => setEditingMajor(null)}
          onSaved={() => { setEditingMajor(null); loadMajors() }}
        />
      )}

      {showDeptManager && (
        <DepartmentManager
          schools={schools}
          onClose={() => setShowDeptManager(false)}
        />
      )}
    </div>
  )
}


function MajorFormModal({ major, schools, onClose, onSaved }) {
  const [form, setForm] = useState({
    name_kh: major?.name_kh || '',
    institution_id: major?.institution_id || '',
    department_id: major?.department_id || '',
  })
  const [departments, setDepartments] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingDepts, setLoadingDepts] = useState(false)

  // Load departments when school changes
  useEffect(() => {
    if (!form.institution_id) {
      setDepartments([])
      return
    }
    setLoadingDepts(true)
    api.get(`/admin/departments?school_id=${form.institution_id}`)
      .then(res => setDepartments(res.data.departments || []))
      .catch(err => console.error(err))
      .finally(() => setLoadingDepts(false))
  }, [form.institution_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.institution_id) {
      alert('Please select a school')
      return
    }
    
    if (!major && !form.department_id) {
      alert('Please select a department, or create one first using "Manage Departments"')
      return
    }
    
    setSaving(true)
    try {
      if (major) {
        const payload = { name_kh: form.name_kh }
        if (form.department_id) payload.department_id = parseInt(form.department_id)
        await api.patch(`/admin/majors/${major.id}`, payload)
      } else {
        await api.post('/admin/majors', {
          name_kh: form.name_kh,
          institution_id: parseInt(form.institution_id),
          department_id: parseInt(form.department_id),
        })
      }
      onSaved()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {major ? 'Edit Major' : 'Add New Major'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Major Name (Khmer) <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              required
              value={form.name_kh}
              onChange={e => setForm({...form, name_kh: e.target.value})}
              placeholder="e.g., គណនេយ្យ"
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          {!major ? (
            <>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  School <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  value={form.institution_id}
                  onChange={e => setForm({...form, institution_id: e.target.value, department_id: ''})}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Select a school --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Department <span className="text-red-500">*</span>
                </span>
                {!form.institution_id ? (
                  <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-500">
                    Select a school first
                  </div>
                ) : loadingDepts ? (
                  <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-500">
                    Loading departments...
                  </div>
                ) : departments.length === 0 ? (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-400">
                    No departments yet. Click "Manage Departments" first to create one.
                  </div>
                ) : (
                  <select
                    required
                    value={form.department_id}
                    onChange={e => setForm({...form, department_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Select a department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name_kh}</option>
                    ))}
                  </select>
                )}
              </label>
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1">
              <div>
                <span className="text-gray-500 dark:text-gray-400">School:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{major.school_name}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Department:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{major.department_name || 'None'}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : (major ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function DepartmentManager({ schools, onClose }) {
  const [selectedSchool, setSelectedSchool] = useState('')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')

  const loadDepartments = () => {
    if (!selectedSchool) {
      setDepartments([])
      return
    }
    setLoading(true)
    api.get(`/admin/departments?school_id=${selectedSchool}`)
      .then(res => setDepartments(res.data.departments || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDepartments() }, [selectedSchool])

  const handleCreate = async () => {
    if (!selectedSchool) {
      alert('Select a school first')
      return
    }
    if (!newDeptName.trim()) {
      alert('Enter department name')
      return
    }
    try {
      await api.post('/admin/departments', {
        name_kh: newDeptName.trim(),
        institution_id: parseInt(selectedSchool),
      })
      setNewDeptName('')
      loadDepartments()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create')
    }
  }

  const handleDelete = async (id, name, majorCount) => {
    if (majorCount > 0) {
      if (!confirm(`Department "${name}" has ${majorCount} majors. Deleting will also delete all majors. Continue?`)) return
    } else {
      if (!confirm(`Delete department "${name}"?`)) return
    }
    try {
      await api.delete(`/admin/departments/${id}`)
      loadDepartments()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Manage Departments
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Select School
            </span>
            <select
              value={selectedSchool}
              onChange={e => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Select a school --</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          {selectedSchool && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="New department name (e.g., មហាវិទ្យាល័យបច្ចេកវិទ្យា)"
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold"
                >
                  + Add
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : departments.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">
                  No departments yet. Create one above.
                </p>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {departments.map(dept => (
                    <div
                      key={dept.id}
                      className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {dept.name_kh}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dept.major_count} majors
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(dept.id, dept.name_kh, dept.major_count)}
                        className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}