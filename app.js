// Bitville CRM – interactive board (no backend). Saves to localStorage.
// Works with your existing index.html (type tabs, user filter, + Add Deal button).

/* -------------------- Setup -------------------- */
const currentUserEmail = 'fiona@bitvillegaming.com';
const el = (id) => document.getElementById(id);
const qs = (sel, root=document) => root.querySelector(sel);
const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];

const cols = {
  "New": el('col-new'),
  "In Progress": el('col-progress'),
  "Follow-Up": el('col-follow'),
  "Closed": el('col-closed'),
};

if (el('currentUser')) el('currentUser').textContent = `Signed in as ${currentUserEmail}`;

/* -------------------- Data -------------------- */
const DEFAULT_DEALS = [
  {
    id: 'd1',
    title: 'BetConstruct',
    type: 'Aggregator',
    stage: 'New',
    contactName: 'Irina',
    contactEmail: 'irina@betconstruct.com',
    notes: 'Open doors to more SA operators; distribution channel for in-house games.',
    todo: 'Schedule intro call',
    assigned: [],
    mentioned: ['fiona@bitvillegaming.com'],
    owner: 'fiona@bitvillegaming.com'
  },
  {
    id: 'd2',
    title: 'Mbet & Marshalls World of Sport',
    type: 'Operator',
    stage: 'New',
    contactName: 'Jeremy Marshall',
    contactEmail: 'jeremy@mbet.co.za',
    notes: 'Assist with Evolution workaround detail.',
    todo: 'Prep NDA and agreement (URGENT)',
    assigned: ['yash@bitvillegaming.com'],
    mentioned: [],
    owner: 'fiona@bitvillegaming.com'
  },
  {
    id: 'd3',
    title: 'World Match',
    type: 'Provider',
    stage: 'New',
    contactName: '',
    contactEmail: '',
    notes: 'Would like us to certify using our Manufacturer Licence.',
    todo: 'Get NDA signed off',
    assigned: ['sharon@bitvillegaming.com'],
    mentioned: [],
    owner: 'fiona@bitvillegaming.com'
  }
];

function loadDeals() {
  const raw = localStorage.getItem('bitville_crm_deals');
  if (!raw) {
    localStorage.setItem('bitville_crm_deals', JSON.stringify(DEFAULT_DEALS));
    return [...DEFAULT_DEALS];
  }
  try { return JSON.parse(raw); } catch { return [...DEFAULT_DEALS]; }
}
function saveDeals(deals) {
  localStorage.setItem('bitville_crm_deals', JSON.stringify(deals));
}

/* -------------------- Filters -------------------- */
const state = {
  type: 'All',          // All | Operator | Provider | Aggregator
  userFilter: 'none',   // none | owner | assigned | mentioned
  showAssignedOnly: false,
  showMentionedOnly: false,
};

function setActiveType(button) {
  qsa('.typeTab').forEach(b => b.classList.remove('bg-cyan-600','text-white'));
  button.classList.add('bg-cyan-600','text-white');
  state.type = button.dataset.type || 'All';
  render();
}

function matchesFilters(deal) {
  if (state.type !== 'All' && deal.type !== state.type) return false;

  if (state.userFilter === 'owner' && deal.owner !== currentUserEmail) return false;
  if (state.userFilter === 'assigned' && !(deal.assigned||[]).includes(currentUserEmail)) return false;
  if (state.userFilter === 'mentioned' && !(deal.mentioned||[]).includes(currentUserEmail)) return false;

  if (state.showAssignedOnly && !(deal.assigned||[]).includes(currentUserEmail)) return false;
  if (state.showMentionedOnly && !(deal.mentioned||[]).includes(currentUserEmail)) return false;

  return true;
}

/* -------------------- Rendering -------------------- */
function renderBadges(deals) {
  const assignedCount = deals.filter(d => (d.assigned||[]).includes(currentUserEmail)).length;
  const mentionedCount = deals.filter(d => (d.mentioned||[]).includes(currentUserEmail)).length;
  const bA = el('badgeAssigned'); const bM = el('badgeMentioned');
  if (bA) bA.textContent = assignedCount;
  if (bM) bM.textContent = mentionedCount;
}

function cardEl(deal) {
  const card = document.createElement('div');
  card.className = 'p-3 rounded border bg-white shadow-sm cursor-move';
  card.draggable = true;
  card.dataset.id = deal.id;
  card.innerHTML = `
    <div class="flex justify-between items-center">
      <strong>${deal.title}</strong>
      <span class="text-xs px-2 py-0.5 rounded ${deal.type==='Operator'?'bg-blue-100 text-blue-700':deal.type==='Provider'?'bg-purple-100 text-purple-700':'bg-emerald-100 text-emerald-700'}">${deal.type}</span>
    </div>
    <div class="text-xs text-gray-600 mt-1">${deal.contactName || ''} ${deal.contactEmail ? '• '+deal.contactEmail : ''}</div>
    ${deal.notes ? `<div class="text-xs mt-1">${deal.notes}</div>` : ''}
    ${deal.todo ? `<div class="text-xs font-semibold mt-1">Next: ${deal.todo}</div>` : ''}
    <div class="text-[11px] mt-2 flex gap-2 flex-wrap">
      ${(deal.assigned&&deal.assigned.length) ? `<span class="px-2 py-0.5 rounded bg-red-50 text-red-700">Assigned: ${deal.assigned.join(', ')}</span>` : ''}
      ${(deal.mentioned&&deal.mentioned.length) ? `<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-800">Mentioned: ${deal.mentioned.join(', ')}</span>` : ''}
    </div>
  `;
  // Edit on double click
  card.addEventListener('dblclick', () => editDeal(deal.id));
  // Drag
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', deal.id);
  });
  return card;
}

function render() {
  const deals = loadDeals();

  // Clear columns
  Object.values(cols).forEach(col => col.innerHTML = '');

  // Populate by stage with filters
  deals.filter(matchesFilters).forEach(d => {
    const col = cols[d.stage] || cols['New'];
    col.appendChild(cardEl(d));
  });

  // Dropzones
  Object.entries(cols).forEach(([stage, col]) => {
    col.ondragover = (e) => e.preventDefault();
    col.ondrop = (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      moveDeal(id, stage);
    };
  });

  // Badges
  renderBadges(deals);
}

/* -------------------- Actions -------------------- */
function moveDeal(id, stage) {
  const deals = loadDeals().map(d => d.id === id ? ({...d, stage}) : d);
  saveDeals(deals);
  render();
}

function addDeal() {
  const title = prompt('Company / Opportunity title?');
  if (!title) return;
  const type = prompt('Type (Operator / Provider / Aggregator)?', 'Operator') || 'Operator';
  const contactName = prompt('Contact name?') || '';
  const contactEmail = prompt('Contact email?') || '';
  const notes = prompt('Notes / Opportunity?') || '';
  const todo = prompt('Next step / To-do?') || '';
  const assignedStr = prompt('Assign (emails, comma separated)?') || '';
  const mentionedStr = prompt('Mention (emails, comma separated)?') || '';

  const newDeal = {
    id: 'd' + Math.random().toString(36).slice(2),
    title, type,
    stage: 'New',
    contactName, contactEmail,
    notes, todo,
    assigned: assignedStr.split(',').map(s => s.trim()).filter(Boolean),
    mentioned: mentionedStr.split(',').map(s => s.trim()).filter(Boolean),
    owner: currentUserEmail
  };

  const deals = loadDeals();
  deals.push(newDeal);
  saveDeals(deals);
  render();
  alert('Deal added.');
}

function editDeal(id) {
  const deals = loadDeals();
  const d = deals.find(x => x.id === id);
  if (!d) return;

  const title = prompt('Edit title:', d.title) ?? d.title;
  const type = prompt('Edit type (Operator/Provider/Aggregator):', d.type) ?? d.type;
  const stage = prompt('Edit stage (New/In Progress/Follow-Up/Closed):', d.stage) ?? d.stage;
  const contactName = prompt('Edit contact name:', d.contactName) ?? d.contactName;
  const contactEmail = prompt('Edit contact email:', d.contactEmail) ?? d.contactEmail;
  const notes = prompt('Edit notes:', d.notes) ?? d.notes;
  const todo = prompt('Edit next step:', d.todo) ?? d.todo;
  const assignedStr = prompt('Assigned (emails, comma separated):', (d.assigned||[]).join(', ')) ?? (d.assigned||[]).join(', ');
  const mentionedStr = prompt('Mentioned (emails, comma separated):', (d.mentioned||[]).join(', ')) ?? (d.mentioned||[]).join(', ');

  const next = {
    ...d,
    title, type, stage,
    contactName, contactEmail,
    notes, todo,
    assigned: assignedStr.split(',').map(s => s.trim()).filter(Boolean),
    mentioned: mentionedStr.split(',').map(s => s.trim()).filter(Boolean)
  };

  const arr = deals.map(x => x.id === d.id ? next : x);
  saveDeals(arr);
  render();
  alert('Deal updated.');
}

/* -------------------- Wire up UI -------------------- */
// Type tabs
qsa('.typeTab').forEach(btn => {
  btn.addEventListener('click', () => setActiveType(btn));
});

// User filter dropdown
const userSel = el('userFilter');
if (userSel) {
  userSel.addEventListener('change', (e) => {
    state.userFilter = e.target.value || 'none';
    render();
  });
}

// Assigned / Mentioned buttons toggle
const btnAssigned = el('btnAssigned');
const btnMentioned = el('btnMentioned');
if (btnAssigned) {
  btnAssigned.addEventListener('click', () => {
    state.showAssignedOnly = !state.showAssignedOnly;
    btnAssigned.classList.toggle('ring-2');
    render();
  });
}
if (btnMentioned) {
  btnMentioned.addEventListener('click', () => {
    state.showMentionedOnly = !state.showMentionedOnly;
    btnMentioned.classList.toggle('ring-2');
    render();
  });
}

// Add deal
const btnAdd = el('btnAddDeal');
if (btnAdd) btnAdd.addEventListener('click', addDeal);

// Initial render
render();
