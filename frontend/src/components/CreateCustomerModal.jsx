export default function CreateCustomerModal({
  allowDuplicate,
  duplicateMatch,
  errors,
  form,
  onClose,
  onSave,
  onToggleDuplicate,
  onUpdateForm,
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="panel create-modal"
        aria-labelledby="create-title"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Create New Customer</p>
            <h2 id="create-title">Basic Contact Information</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="customer-form" onSubmit={onSave}>
          <label>
            Customer name
            <input value={form.name} onChange={(event) => onUpdateForm('name', event.target.value)} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <div className="form-row">
            <label>
              Phone number
              <input value={form.phone} onChange={(event) => onUpdateForm('phone', event.target.value)} />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(event) => onUpdateForm('email', event.target.value)} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
          </div>
          {errors.contact && <span className="field-error">{errors.contact}</span>}
          <label>
            Address
            <input value={form.address} onChange={(event) => onUpdateForm('address', event.target.value)} />
          </label>
          <label>
            Company name
            <input value={form.companyName} onChange={(event) => onUpdateForm('companyName', event.target.value)} />
          </label>

          {duplicateMatch && (
            <div className="duplicate-alert">
              <strong>This customer may already exist.</strong>
              <span>Matched with {duplicateMatch.name}. Confirm to save anyway.</span>
              <label className="confirm-line">
                <input
                  checked={allowDuplicate}
                  type="checkbox"
                  onChange={(event) => onToggleDuplicate(event.target.checked)}
                />
                I confirm this is not a duplicate
              </label>
            </div>
          )}

          <div className="form-actions">
            <button className="primary-button" type="submit">Save Customer</button>
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  )
}
