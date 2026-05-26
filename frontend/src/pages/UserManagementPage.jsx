import { useEffect, useMemo, useState } from 'react'
import CreateUserModal from '../components/CreateUserModal'
import EditUserModal from '../components/EditUserModal'
import { createUser, getUsers, updateUserAccount, updateUserRoleStatus } from '../services/userApi'
import { formatDate } from '../utils/customerUtils'

const roles = ['STAFF', 'MANAGER', 'ADMIN']
const roleFilterOptions = ['', ...roles]
const statuses = ['', 'ACTIVE', 'INACTIVE']

function userStatus(user) {
  return user.isActive ? 'ACTIVE' : 'INACTIVE'
}

export default function UserManagementPage({ currentUser }) {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)

  const isAdmin = String(currentUser?.role || '').toUpperCase() === 'ADMIN'

  const summary = useMemo(() => {
    return {
      active: users.filter((user) => user.isActive).length,
      inactive: users.filter((user) => !user.isActive).length,
      admins: users.filter((user) => user.role === 'ADMIN').length,
    }
  }, [users])

  async function loadUsers(nextPage = page) {
    if (!isAdmin || !currentUser?.id) return

    setLoading(true)
    setError('')

    try {
      const data = await getUsers(currentUser.id, {
        page: nextPage,
        size,
        role: roleFilter,
        status: statusFilter,
      })

      setUsers(data.items || [])
      setPage(data.page ?? nextPage)
      setTotalPages(Math.max(data.totalPages || 1, 1))
      setTotalItems(data.totalItems || 0)
    } catch (err) {
      setError(err.message || 'Failed to load users.')
      setUsers([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(0)
  }, [currentUser?.id, currentUser?.role, roleFilter, statusFilter])

  async function updateUserInline(userId, payload) {
    setSavingId(userId)
    setError('')

    try {
      const updated = await updateUserRoleStatus(currentUser.id, userId, payload)
      setUsers((current) => current.map((user) => (user.id === userId ? updated : user)))
    } catch (err) {
      setError(err.message || 'Failed to update user.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleCreateUser(payload) {
    setCreating(true)
    setCreateError('')

    try {
      await createUser(currentUser.id, payload)
      setShowCreateModal(false)
      await loadUsers(0)
    } catch (err) {
      setCreateError(err.message || 'Failed to create user.')
    } finally {
      setCreating(false)
    }
  }

  async function handleEditUser(payload) {
    if (!editingUser) return

    setEditing(true)
    setEditError('')

    try {
      const updated = await updateUserAccount(currentUser.id, editingUser.id, payload)
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)))
      setEditingUser(null)
    } catch (err) {
      setEditError(err.message || 'Failed to update user.')
    } finally {
      setEditing(false)
    }
  }

  if (!isAdmin) {
    return (
      <section className="permission-card panel">
        <p className="eyebrow">Restricted area</p>
        <h2>User Management is available for ADMIN accounts only.</h2>
      </section>
    )
  }

  return (
    <section className="user-management-page">
      <div className="metrics compact-metrics" aria-label="User metrics">
        <article>
          <span>Total Users</span>
          <strong>{totalItems}</strong>
        </article>
        <article>
          <span>Active On Page</span>
          <strong>{summary.active}</strong>
        </article>
        <article>
          <span>Inactive On Page</span>
          <strong>{summary.inactive}</strong>
        </article>
        <article>
          <span>Admins On Page</span>
          <strong>{summary.admins}</strong>
        </article>
      </div>

      <section className="panel table-panel" aria-labelledby="user-management-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">User Account and Role Management</p>
            <h2 id="user-management-title">Accounts</h2>
          </div>
          <div className="list-actions">
            <select
              className="role-select"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value)
                setPage(0)
              }}
            >
              {roleFilterOptions.map((role) => (
                <option key={role || 'all'} value={role}>
                  {role || 'NONE'}
                </option>
              ))}
            </select>
            <select
              className="role-select"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(0)
              }}
            >
              {statuses.map((status) => (
                <option key={status || 'all'} value={status}>
                  {status || 'NONE'}
                </option>
              ))}
            </select>
            <button className="primary-button" type="button" onClick={() => setShowCreateModal(true)}>
              Create User
            </button>
          </div>
        </div>

        {error && (
          <div className="api-banner inline-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => loadUsers(page)}>Retry</button>
            <button type="button" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.fullName}</strong>
                      {Number(user.id) === Number(currentUser.id) && (
                        <span className="match-pill">You</span>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="role-select"
                        disabled={savingId === user.id}
                        value={user.role}
                        onChange={(event) => updateUserInline(user.id, { role: event.target.value })}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className="status-switch">
                        <input
                          checked={user.isActive}
                          disabled={savingId === user.id}
                          type="checkbox"
                          onChange={(event) => updateUserInline(user.id, { isActive: event.target.checked })}
                        />
                        <span aria-hidden="true" />
                        <strong className={`status-pill ${user.isActive ? '' : 'inactive'}`}>
                          {userStatus(user)}
                        </strong>
                      </label>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.updatedAt)}</td>
                    <td>
                      <button
                        className="table-action"
                        disabled={savingId === user.id}
                        type="button"
                        onClick={() => {
                          setEditingUser(user)
                          setEditError('')
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            disabled={loading || page === 0}
            type="button"
            onClick={() => loadUsers(page - 1)}
          >
            Previous
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button
            disabled={loading || page + 1 >= totalPages}
            type="button"
            onClick={() => loadUsers(page + 1)}
          >
            Next
          </button>
        </div>
      </section>

      {showCreateModal && (
        <CreateUserModal
          error={createError}
          loading={creating}
          onClose={() => {
            setShowCreateModal(false)
            setCreateError('')
          }}
          onCreate={handleCreateUser}
        />
      )}

      {editingUser && (
        <EditUserModal
          error={editError}
          loading={editing}
          user={editingUser}
          onClose={() => {
            setEditingUser(null)
            setEditError('')
          }}
          onSave={handleEditUser}
        />
      )}
    </section>
  )
}
