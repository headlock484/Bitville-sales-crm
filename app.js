// Bitville CRM Demo - stores data in your browser (localStorage)

// Set the signed-in user (for testing)
const currentUserEmail = 'fiona@bitvillegaming.com';
document.getElementById('currentUser').textContent = `Signed in as ${currentUserEmail}`;

// Pipeline columns
const cols = {
  "New": document.getElementById('col-new'),
  "In Progress": document.getElementById('col-progress'),
  "Follow-Up": document.getElementById('col-follow'),
  "Closed": document.getElementById('col-closed'),
};

// Default deals
const defaultDeals = [
  {
    id: '1',
    title: 'BetConstruct',
    type: 'Aggregator',
    stage: 'New',
    contactName: 'Irina',
    contactEmail: 'irina@betconstruct.com',
    notes: 'Open doors to more SA operators; distribution channel for in-house games.',
    todo: 'Schedule intro call',
    assigned: [],
    mentioned: ['fiona@bitvillegaming.com']
  },
  {
    id: '2',
    title: 'Mbet & Marshalls World of Sport',
    type: 'Operator',
    stage: 'New',
    contactName: 'Jeremy Marshall',
    contactEmail: 'jeremy@mbet.co.za',
    notes: 'Prep NDA and agreement. Assist with Evolution workaround.',
    todo: 'URGENT',
    assigned: ['yash@bitvillegaming.com'],
    mentioned: []
  },
  {
    id: '3',
    title: 'World Match',
    type: 'Provider',
    stage: 'New',
    contactName: '',
    contactEmail: '',
    notes: 'Certify using our Manufacturer Licence.',
    todo: 'Get NDA signed off',
    assigned: ['sharon@bitvillegaming.com'],
    mentioned: []
  }
];

// Load from browser or set defaults
function loadDeals() {
  const data = localStorage.getItem('bitville_crm_deals');
  if (!data) {
    localStorage.setItem('bitville_crm_deals', JSON.stringify(defaultDeals));
    return defaultDeals;
  }
  return JSON.parse(data);
}

function saveDeals(deals) {
  localStorage.setItem('bitville_crm_deals', JSON.stringify(deals));
  renderDeals();
}

// Render the deal cards
function renderDeals() {
  const deals = loadDeals();
  Object.values(cols).forEach(col => col.innerHTML = '');
  deals.forEach(deal => {
    const card = document.createElement('div');
    card.className = 'p-3 rounded border bg-white shadow-sm';
    card.innerHTML = `
      <div class="flex justify-between">
        <strong>${deal.title}</strong>
        <span class="text-xs px-2 rounded bg-gray-100">${deal.type}</span>
      </div>
      <div class="text-xs text-gray-600">${deal.contactName} ${deal.contactEmail}</div>
      <div class="text-xs mt-1">${deal.notes}</div>
      <div class="text-xs font-semibold mt-1">Next: ${deal.todo}</div>
    `;
    cols[deal.stage].appendChild(card);
  });
}

// Initial render
renderDeals();
