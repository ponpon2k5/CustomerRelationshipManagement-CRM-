import { formatDate } from '../utils/customerUtils'
import CreateCustomerModal from '../components/CreateCustomerModal'

export default function CustomersPage({
  activeCount,
  allowDuplicate,
  createdToday,
  duplicateMatch,
  errors,
  form,
  inactiveCount,
  onChangeSort,
  onCloseCreate,
  onOpenCreate,
  onOpenProfile,
  onSaveCustomer,
  onSelectCustomer,
  onShowInactiveChange,
  onToggleDuplicate,
  onUpdateForm,
  page,
  pageCustomers,
  selectedCustomer,
  setPage,
  showCreateModal,
  showInactive,
  totalPages,
  visibleCustomers,
}) {
  return (
    <>
      <section className="metrics" aria-label="Customer metrics">
        <article>
          <span>Active Customers</span>
          <strong>{activeCount}</strong>
        </article>
        <article>
          <span>Inactive Archive</span>
          <strong>{inactiveCount}</strong>
        </article>
        <article>
          <span>Created Today</span>
          <strong>{createdToday}</strong>
        </article>
        <article>
          <span>Default Page Size</span>
          <strong>20</strong>
        </article>
      </section>

      <div className="content-grid">
        <section className="panel table-panel" aria-labelledby="list-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Customer List</p>
              <h2 id="list-title">20 Customers Per Page</h2>
            </div>
            <div className="list-actions">
              <button className="primary-button" type="button" onClick={onOpenCreate}>
                Create Customer
              </button>
              <label className="toggle-line">
                <input
                  checked={showInactive}
                  type="checkbox"
                  onChange={(event) => onShowInactiveChange(event.target.checked)}
                />
                Show inactive
              </label>
            </div>
          </div>

          {visibleCustomers.length === 0 ? (
            <div className="empty-state">No customers found.</div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <button type="button" onClick={() => onChangeSort('name')}>Customer Name</button>
                      </th>
                      <th>Phone Number</th>
                      <th>Email</th>
                      <th>Company Name</th>
                      <th>
                        <button type="button" onClick={() => onChangeSort('createdAt')}>Created Date</button>
                      </th>
                      <th>Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageCustomers.map((customer) => (
                      <tr
                        className={selectedCustomer?.id === customer.id ? 'selected-row' : ''}
                        key={customer.id}
                        onClick={() => onSelectCustomer(customer.id)}
                      >
                        <td>
                          <strong>{customer.name}</strong>
                          <span className={`status-pill ${customer.status.toLowerCase()}`}>{customer.status}</span>
                        </td>
                        <td>{customer.phone || '-'}</td>
                        <td>{customer.email || '-'}</td>
                        <td>{customer.companyName || '-'}</td>
                        <td>{formatDate(customer.createdAt)}</td>
                        <td>
                          <button
                            className="table-action"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              onOpenProfile(customer.id)
                            }}
                          >
                            Detail Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button disabled={page === 1} type="button" onClick={() => setPage((current) => current - 1)}>
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {showCreateModal && (
        <CreateCustomerModal
          allowDuplicate={allowDuplicate}
          duplicateMatch={duplicateMatch}
          errors={errors}
          form={form}
          onClose={onCloseCreate}
          onSave={onSaveCustomer}
          onToggleDuplicate={onToggleDuplicate}
          onUpdateForm={onUpdateForm}
        />
      )}
    </>
  )
}
