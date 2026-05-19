export const MOCK_USER = { email: 'admin@crm.com', password: '123456' }

export const currentUser = {
  name: 'Amelia Burrows',
  role: 'Admin',
}

export const navItems = ['Customers', 'Search', 'Profile']

export const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  companyName: '',
}

export const initialCustomers = [
  {
    id: 1,
    name: 'Skinder Pharma',
    phone: '+1 415 555 0137',
    normalizedPhone: '14155550137',
    email: 'procurement@skinderpharma.com',
    address: '204 Market Street, San Francisco',
    companyName: 'Skinder Pharma',
    status: 'Active',
    createdAt: '2026-05-19T08:15:00',
    createdBy: 'Amelia Burrows',
    updatedAt: '2026-05-19T08:15:00',
    updatedBy: 'Amelia Burrows',
    deactivatedAt: '',
    deactivatedBy: '',
    notes: [
      { id: 101, text: 'Requested pricing for annual CRM support.', date: '2026-05-19T10:40:00' },
      { id: 102, text: 'Prefers email follow-up after demos.', date: '2026-05-18T14:10:00' },
    ],
    interactions: [
      { id: 201, type: 'Call', text: 'Qualification call completed.', date: '2026-05-19T09:20:00' },
      { id: 202, type: 'Email', text: 'Sent onboarding checklist.', date: '2026-05-18T16:30:00' },
    ],
  },
  {
    id: 2,
    name: 'Morlong Associates',
    phone: '+1 212 555 0199',
    normalizedPhone: '12125550199',
    email: 'hello@morlong.co',
    address: '82 Hudson Avenue, New York',
    companyName: 'Morlong Associates',
    status: 'Active',
    createdAt: '2026-05-18T13:45:00',
    createdBy: 'Raghav Rao',
    updatedAt: '2026-05-18T13:45:00',
    updatedBy: 'Raghav Rao',
    deactivatedAt: '',
    deactivatedBy: '',
    notes: [],
    interactions: [
      { id: 203, type: 'Meeting', text: 'Reviewed migration timeline.', date: '2026-05-18T15:00:00' },
    ],
  },
  {
    id: 3,
    name: 'Viva Health',
    phone: '+1 650 555 0144',
    normalizedPhone: '16505550144',
    email: 'care@vivahealth.com',
    address: '499 Castro Street, Mountain View',
    companyName: 'Viva Health',
    status: 'Active',
    createdAt: '2026-05-17T11:30:00',
    createdBy: 'Joane Lee',
    updatedAt: '2026-05-18T09:05:00',
    updatedBy: 'Amelia Burrows',
    deactivatedAt: '',
    deactivatedBy: '',
    notes: [
      { id: 103, text: 'Needs inactive-customer archive access for compliance.', date: '2026-05-18T11:12:00' },
    ],
    interactions: [],
  },
  {
    id: 4,
    name: 'BrekWire Inc.',
    phone: '+1 408 555 0171',
    normalizedPhone: '14085550171',
    email: 'ops@brekwire.com',
    address: '17 First Avenue, San Jose',
    companyName: 'BrekWire Inc.',
    status: 'Inactive',
    createdAt: '2026-05-15T16:20:00',
    createdBy: 'Amelia Burrows',
    updatedAt: '2026-05-18T17:10:00',
    updatedBy: 'Amelia Burrows',
    deactivatedAt: '2026-05-18T17:10:00',
    deactivatedBy: 'Amelia Burrows',
    notes: [
      { id: 104, text: 'Archived after duplicate buying team was confirmed.', date: '2026-05-17T10:20:00' },
    ],
    interactions: [
      { id: 204, type: 'Email', text: 'Confirmed account deactivation.', date: '2026-05-18T17:05:00' },
    ],
  },
]
