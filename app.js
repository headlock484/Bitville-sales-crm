// Bitville CRM – interactive board with modal editing (no backend). localStorage persistence.

const currentUserEmail = 'fiona@bitvillegaming.com';
const el = (id) => document.getElementById(id);
const qs = (sel, root=document) => root.querySelector(sel);
const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];

if (el('currentUser')) el('currentUser').textContent = `Signed in as ${currentUserEmail}`;

const cols = {
  "New": el('col-new'),
  "In Progress": el('col-progress'),
  "Follow-Up": el('col-follow'),
  "Closed": el('col-closed'),
};

const DEFAULT_DEALS = [
  { id:'d1', title:'BetConstruct', type:'Aggregator', stage:'New', priority:'Normal',
    contactName:'Irina', contactEmail:'irina@betconstruct.com', contactSite:'',
    notes:'Open doors to more SA operators; distribution channel for in-house games.',
    todo:'Schedule intro call', remind:'', assigned:[], mentioned:[currentUserEmail], owner: currentUserEmail },
  { id:'d2', title:'Mbet & Marshalls World of Sport', type:'Operator', stage:'New', priority:'URGENT',
    contactName:'Jeremy Marshall', contactEmail:'jeremy@mbet.co.za', contactSite:'https://www.mbet.co.za',
    notes:'Assist with Evolution workaround detail.', todo:'Prep NDA and agreement (URGENT)', remind:'',
    assigned:['yash@bitvillegaming.com'], mentioned:[], owner: currentUserEmail },
  { id:'d3', title:'World Match', type:'Provider', stage:'New', priority:'Normal',
    contactName:'', contactEmail:'', contactSite:'',
    notes:'Would like us to certify using our Manufacturer Licence.',
    todo:'Get NDA signed off', remind:'', assigned:['sharon@bitvillegaming.com'], mentioned:[], owner: currentUserEmail },
];

function loadDeals() {
  const raw = localStorage.getItem('bitville_crm_deals');
  if (!raw) {
    localStorage.setItem('bitville_crm_deals', JSON.stringify(DEFAULT_DEALS));
    return [...DEFAULT_DEALS];
  }
  try { return JSON.parse(raw); } catch { return [...DEFAULT_DEALS]; }
}
function saveDeals(deals) { localStorage.setItem('bitville_crm_deals', JSON.stringify(deals)); }

const state = {
  type: 'All',
  userFilter: 'none',      // none | owner | assigned | mentioned
  showAssignedOnly: false,
  showMentionedOnly: false,
  searchText: '',
  searchStage: 'Any',
  editingId: null
};

function matchesFilters(deal) {
  if (state.type !== 'All' && deal.type !== state.type) return false;
  if (state.userFilter === 'owner' && deal.owner !== currentUserEmail) return false;
  if (state.userFilter === 'assigned' && !(deal.assigned||[]).includes(currentUserEmail)) return false;
  if (state.userFilter === 'mentioned' && !(deal.mentioned||[]).includes(currentUserEmail)) return false;
  if (state.showAssignedOnly && !(deal.assigned||[]).includes(currentUserEmail)) return false;
  if (state.showMentionedOnly && !(deal.mentioned||[]).includes(currentUserEmail)) return false;
  return true;
}

function renderBadges(deals) {
  const assignedCount = deals.filter(d => (d.assigned||[]).includes(currentUserEmail)).length;
  const mentionedCount = deals.filter(d => (d.mentioned||[]).includes(currentUserEmail)).length;
  if (el('badgeAssigned')) el('badgeAssigned').textContent = assignedCount;
  if (el('badgeMentioned')) el('badgeMentioned').textContent = mentionedCount;
}

function cardEl(deal) {
  const pill = (txt, cls) => `<span class="px-2 py-0.5 rounded ${cls}">${txt}</span>`;
  const urg = deal.priority === 'URGENT' ? `<span class="text-[10px] ml-2 px-2 py-0.5 rounded bg-red-600 text-white">URGENT</span>` : '';
  const card = document.createElement('div');
  card.className = 'p-3 rounded border bg-white shadow-sm cursor-move';
  card.draggable = true;
  card.dataset.id = deal.id;
  card.innerHTML = `
    <div class="flex justify-between items-center">
      <div><strong>${deal.title}</strong>${urg}</div>
      <span class="text-xs px-2 py-0.5 rounded ${deal.type==='Operator'?'bg-blue-100 text-blue-700':deal.type==='Provider'?'bg-purple-100 text-purple-700':'bg-emerald-100 text-emerald-700'}">${deal.type}</span>
    </div>
    <div class="text-xs text-gray-600 mt-1">${deal.contactName || ''} ${deal.contactEmail ? '• '+deal.contactEmail : ''}</div>
    ${deal.notes ? `<div class="text-xs mt-1">${deal.notes}</div>` : ''}
    ${deal.todo ? `<div class="text-xs font-semibold mt-1">Next: ${deal.todo}</div>` : ''}
    <div class="text-[11px] mt-2 flex gap-2 flex-wrap">
      ${(deal.assigned && deal.assigned.length) ? pill('Assigned: '+deal.assigned.join(', '), 'bg-red-50 text-red-700') : ''}
      ${(deal.mentioned && deal.mentioned.length) ? pill('Mentioned: '+deal.mentioned.join(', '), 'bg-amber-50 text-amber-800') : ''}
    </div>
  `;
  card.addEventListener('dblclick', () => openModal(deal.id));
  card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', deal.id));
  return card;
}

function renderBoard() {
  const deals = loadDeals();
  Object.values(cols).forEach(c => c.innerHTML = '');
  deals.filter(matchesFilters).forEach(d => (cols[d.stage]||cols['New']).appendChild(cardEl(d)));
  Object.entries(cols).forEach(([stage, col]) => {
    col.ondragover = e => e.preventDefault();
    col.ondrop = e => { e.preventDefault(); moveDeal(e.dataTransfer.getData('text/plain'), stage); };
  });
  renderBadges(deals);
}

function moveDeal(id, stage) {
  const next = loadDeals().map(d => d.id === id ? ({...d, stage}) : d);
  saveDeals(next);
  renderBoard();
}

/* ---------- Modal add/edit ---------- */
function openModal(id=null) {
  state.editingId = id;
  const deals = loadDeals();
  const d = id ? deals.find(x => x.id === id) : null;

  el('modalTitle').textContent = d ? 'Edit Deal' : 'New Deal';
  el('f_title').value = d?.title || '';
  el('f_type').value = d?.type || 'Operator';
  el('f_stage').value = d?.stage || 'New';
  el('f_priority').value = d?.priority || 'Normal';
  el('f_contactName').value = d?.contactName || '';
  el('f_contactEmail').value = d?.contactEmail || '';
  el('f_contactSite').value = d?.contactSite || '';
  el('f_notes').value = d?.notes || '';
  el('f_todo').value = d?.todo || '';
  el('f_remind').value = d?.remind || '';
  el('f_assigned').value = (d?.assigned || []).join(', ');
  el('f_mentioned').value = (d?.mentioned || []).join(', ');

  el('btnDelete').classList.toggle('hidden', !d);
  el('modal').classList.remove('hidden'); el('modal').classList.add('flex');
}

function closeModal() {
  el('modal').classList.add('hidden'); el('modal').classList.remove('flex');
  state.editingId = null;
}

function saveModal() {
  const deals = loadDeals();
  const d = state.editingId ? deals.find(x => x.id === state.editingId) : null;

  const next = {
    id: d?.id || ('d' + Math.random().toString(36).slice(2)),
    title: el('f_title').value.trim(),
    type: el('f_type').value,
    stage: el('f_stage').value,
    priority: el('f_priority').value,
    contactName: el('f_contactName').value.trim(),
    contactEmail: el('f_contactEmail').value.trim(),
    contactSite: el('f_contactSite').value.trim(),
    notes: el('f_notes').value.trim(),
    todo: el('f_todo').value.trim(),
    remind: el('f_remind').value,
    assigned: el('f_assigned').value.split(',').map(s=>s.trim()).filter(Boolean),
    mentioned: el('f_mentioned').value.split(',').map(s=>s.trim()).filter(Boolean),
    owner: d?.owner || currentUserEmail
  };

  const arr = d ? deals.map(x => x.id === d.id ? next : x) : [...deals, next];
  saveDeals(arr);
  closeModal();
  renderBoard();
}

function deleteDeal() {
  if (!state.editingId) return;
  const arr = loadDeals().filter(x => x.id !== state.editingId);
  saveDeals(arr);
  closeModal();
  renderBoard();
}

/* ---------- My Tags drawer ---------- */
function openDrawer() { el('drawer').style.transform = 'translateX(0%)'; renderTagList('Assigned'); }
function closeDrawer() { el('drawer').style.transform = 'translateX(100%)'; }
function renderTagList(kind) {
  const deals = loadDeals();
  let items = [];
  if (kind==='Assigned') items = deals.filter(d => (d.assigned||[]).includes(currentUserEmail));
  else if (kind==='Mentioned') items = deals.filter(d => (d.mentioned||[]).includes(currentUserEmail));
  else items = deals.filter(d => (d.assigned||[]).includes(currentUserEmail) || (d.mentioned||[]).includes(currentUserEmail));

  el('tagList').innerHTML = items.map(d => `
    <div class="p-2 border rounded flex justify-between items-center">
      <div>
        <div class="font-medium">${d.title}</div>
        <div class="text-xs text-slate-600">${d.type} • ${d.stage} ${d.priority==='URGENT' ? '• URGENT' : ''}</div>
      </div>
      <button class="text-cyan-700 underline text-sm" onclick="(function(){closeDrawer(); openModal('${d.id}')})()">Open</button>
    </div>
  `).join('') || '<div class="text-slate-500 text-sm">No tagged items</div>';
}

/* ---------- Search panel ---------- */
function openSearch() { el('searchPanel').classList.remove('hidden'); renderSearch(); }
function closeSearch() { el('searchPanel').classList.add('hidden'); }
function renderSearch() {
  const text = (state.searchText || '').toLowerCase();
  const stage = state.searchStage;
  const deals = loadDeals().filter(d => {
    const hitText =
      d.title.toLowerCase().includes(text) ||
      (d.contactName||'').toLowerCase().includes(text) ||
      (d.contactEmail||'').toLowerCase().includes(text) ||
      (d.notes||'').toLowerCase().includes(text) ||
      (d.todo||'').toLowerCase().includes(text);
    const hitStage = (stage==='Any') ? true : d.stage === stage;
    return hitText && hitStage;
  });
  el('searchResults').innerHTML = deals.map(d => `
    <div class="p-2 border rounded mb-2">
      <div class="flex justify-between">
        <div class="font-medium">${d.title}</div>
        <div class="text-xs">${d.type} • ${d.stage} ${d.priority==='URGENT' ? '• URGENT' : ''}</div>
      </div>
      <div class="text-xs text-slate-600">${d.contactName || ''} ${d.contactEmail ? '• '+d.contactEmail : ''}</div>
      ${d.notes ? `<div class="text-xs mt-1">${d.notes}</div>` : ''}
      ${d.todo ? `<div class="text-xs mt-1"><span class="font-semibold">Next:</span> ${d.todo}</div>` : ''}
      <div class="mt-2">
        <button class="text-cyan-700 underline text-sm" onclick="(function(){closeSearch(); openModal('${d.id}')})()">Open</button>
      </div>
    </div>
  `).join('') || '<div class="p-2 text-slate-500 text-sm">No results</div>';
}

/* ---------- Wire up ---------- */
// Type tabs
qsa('.typeTab').forEach(btn => btn.addEventListener('click', () => {
  qsa('.typeTab').forEach(b => b.classList.remove('bg-cyan-600','text-white'));
  btn.classList.add('bg-cyan-600','text-white');
  state.type = btn.dataset.type || 'All';
  renderBoard();
}));

// User filter
if (el('userFilter')) el('userFilter').addEventListener('change', (e) => {
  state.userFilter = e.target.value || 'none';
  renderBoard();
});

// Assigned/Mentioned toggles
if (el('btnAssigned')) el('btnAssigned').addEventListener('click', () => {
  state.showAssignedOnly = !state.showAssignedOnly;
  el('btnAssigned').classList.toggle('ring-2');
  renderBoard();
});
if (el('btnMentioned')) el('btnMentioned').addEventListener('click', () => {
  state.showMentionedOnly = !state.showMentionedOnly;
  el('btnMentioned').classList.toggle('ring-2');
  renderBoard();
});

// My tags drawer
if (el('btnMyTags')) el('btnMyTags').addEventListener('click', openDrawer);
if (el('closeDrawer')) el('closeDrawer').addEventListener('click', closeDrawer);
qsa('.tabBtn').forEach(b => b.addEventListener('click', () => renderTagList(b.dataset.tab)));

// Search panel
if (el('btnSearch')) el('btnSearch').addEventListener('click', openSearch);
if (el('closeSearch')) el('closeSearch').addEventListener('click', closeSearch);
if (el('searchText')) el('searchText').addEventListener('input', (e)=>{ state.searchText = e.target.value; renderSearch(); });
if (el('searchStage')) el('searchStage').addEventListener('change', (e)=>{ state.searchStage = e.target.value; renderSearch(); });

// Modal buttons
if (el('btnAddDeal')) el('btnAddDeal').addEventListener('click', () => openModal(null));
if (el('closeModal')) el('closeModal').addEventListener('click', closeModal);
if (el('btnCancel')) el('btnCancel').addEventListener('click', closeModal);
if (el('btnSave')) el('btnSave').addEventListener('click', saveModal);
if (el('btnDelete')) el('btnDelete').addEventListener('click', deleteDeal);

// Initial paint
renderBoard();
