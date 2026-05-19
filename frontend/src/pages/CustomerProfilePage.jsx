import { useCallback, useState } from 'react'
import InteractionHistoryPanel from '../components/InteractionHistoryPanel'
import Timeline from '../components/Timeline'
import { currentUser } from '../data/customers'
import { formatDateTime } from '../utils/customerUtils'
import { toNoteItem } from '../utils/interactionUtils'

export default function CustomerProfilePage({
  allowDuplicateUpdate,
  editDuplicateMatch,
  editErrors,
  editForm,
  isEditing,
  onBackToList,
  onCancelEdit,
  onDeactivate,
  onSave,
  onStartEdit,
  onToggleDuplicate,
  onUpdateForm,
  selectedCustomer,
}) {
  const [apiNotes, setApiNotes] = useState([])

  const handleNotesChange = useCallback((interactions) => {
    setApiNotes(interactions.map(toNoteItem))
  }, [])

  if (!selectedCustomer) {
    return (
      <section className="panel detail-panel empty-profile">
        <div className="empty-state">Select a customer from the customer list first.</div>
      </section>
    )
  }

  return (
    <>
      <section className="panel detail-panel" aria-labelledby="detail-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Customer Profile</p>
            <h2 id="detail-title">{selectedCustomer.name}</h2>
          </div>
          <div className="detail-actions">
            <button className="secondary-button" type="button" onClick={onBackToList}>
              Back to List
            </button>
            {!isEditing && (
              <button className="secondary-button" type="button" onClick={() => onStartEdit(selectedCustomer)}>
                Edit
              </button>
            )}
            {currentUser.role === 'Admin' && selectedCustomer.status === 'Active' && !isEditing && (
              <button className="danger-button" type="button" onClick={() => onDeactivate(selectedCustomer.id)}>
                Deactivate
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid">
          {isEditing ? (
            <form className="edit-customer-form" onSubmit={onSave}>
              <label>
                Customer name
                <input value={editForm.name} onChange={(event) => onUpdateForm('name', event.target.value)} />
                {editErrors.name && <span className="field-error">{editErrors.name}</span>}
              </label>
              <label>
                Phone number
                <input value={editForm.phone} onChange={(event) => onUpdateForm('phone', event.target.value)} />
              </label>
              <label>
                Email
                <input value={editForm.email} onChange={(event) => onUpdateForm('email', event.target.value)} />
                {editErrors.email && <span className="field-error">{editErrors.email}</span>}
              </label>
              {editErrors.contact && <span className="field-error">{editErrors.contact}</span>}
              <label>
                Address
                <input value={editForm.address} onChange={(event) => onUpdateForm('address', event.target.value)} />
              </label>
              <label>
                Company name
                <input
                  value={editForm.companyName}
                  onChange={(event) => onUpdateForm('companyName', event.target.value)}
                />
              </label>

              {editDuplicateMatch && (
                <div className="duplicate-alert">
                  <strong>This customer may already exist.</strong>
                  <span>Matched with {editDuplicateMatch.name}. Confirm to update anyway.</span>
                  <label className="confirm-line">
                    <input
                      checked={allowDuplicateUpdate}
                      type="checkbox"
                      onChange={(event) => onToggleDuplicate(event.target.checked)}
                    />
                    I confirm this is not a duplicate
                  </label>
                </div>
              )}

              <div className="locked-meta">
                <span>Created date and created by are locked.</span>
                <strong>{formatDateTime(selectedCustomer.createdAt)} · {selectedCustomer.createdBy}</strong>
              </div>

              <div className="form-actions">
                <button className="primary-button" type="submit">Save Changes</button>
                <button className="secondary-button" type="button" onClick={onCancelEdit}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="info-list">
              <span>Phone</span><strong>{selectedCustomer.phone || '-'}</strong>
              <span>Email</span><strong>{selectedCustomer.email || '-'}</strong>
              <span>Address</span><strong>{selectedCustomer.address || '-'}</strong>
              <span>Company</span><strong>{selectedCustomer.companyName || '-'}</strong>
              <span>Created</span><strong>{formatDateTime(selectedCustomer.createdAt)}</strong>
              <span>Created By</span><strong>{selectedCustomer.createdBy}</strong>
              <span>Updated</span><strong>{formatDateTime(selectedCustomer.updatedAt)}</strong>
              <span>Updated By</span><strong>{selectedCustomer.updatedBy}</strong>
              {selectedCustomer.status === 'Inactive' && (
                <>
                  <span>Deactivated</span><strong>{formatDateTime(selectedCustomer.deactivatedAt)}</strong>
                  <span>Deactivated By</span><strong>{selectedCustomer.deactivatedBy}</strong>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="profile-history-grid" aria-label="Customer notes and interaction history">
        <div className="panel history-panel">
          <Timeline
            title="Notes"
            items={apiNotes}
            emptyText="No notes for this customer."
          />
        </div>
        <div className="panel history-panel">
          <InteractionHistoryPanel
            createdById={currentUser.id}
            customerId={selectedCustomer.id}
            onNotesChange={handleNotesChange}
          />
        </div>
      </section>
    </>
  )
}
