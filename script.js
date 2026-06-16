let tasks = JSON.parse(localStorage.getItem('taskr-tasks') || '[]');
let filter = 'all';
let editId = null;

function save() {
  localStorage.setItem('taskr-tasks', JSON.stringify(tasks));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(str) {
  if (!str) return null;
  const [y,m,d] = str.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+m-1]} ${+d}`;
}

function isOverdue(str) {
  if (!str) return false;
  return str < todayStr();
}

function isSoon(str) {
  if (!str) return false;
  const diff = (new Date(str) - new Date(todayStr())) / 86400000;
  return diff >= 0 && diff <= 2;
}

function setDateLabel() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  document.getElementById('today-date').textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

function addTask() {
  const input = document.getElementById('task-input');
  const name = input.value.trim();
  if (!name) { input.focus(); return; }
  tasks.unshift({
    id: uid(),
    name,
    category: document.getElementById('new-category').value,
    priority: document.getElementById('new-priority').value,
    due: document.getElementById('new-due').value || null,
    done: false,
    created: Date.now()
  });
  input.value = '';
  document.getElementById('new-due').value = '';
  save();
  render();
}

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); render(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

function clearDone() {
  tasks = tasks.filter(t => !t.done);
  save();
  render();
}

function setFilter(f, el) {
  filter = f;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  render();
}

function openEdit(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  editId = id;
  document.getElementById('edit-name').value = t.name;
  document.getElementById('edit-category').value = t.category;
  document.getElementById('edit-priority').value = t.priority;
  document.getElementById('edit-due').value = t.due || '';
  document.getElementById('modal').classList.add('open');
  document.getElementById('edit-name').focus();
}

function closeModal(e) {
  if (e.target === document.getElementById('modal')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modal').classList.remove('open');
  editId = null;
}

function saveEdit() {
  const t = tasks.find(t => t.id === editId);
  if (!t) return;
  t.name = document.getElementById('edit-name').value.trim() || t.name;
  t.category = document.getElementById('edit-category').value;
  t.priority = document.getElementById('edit-priority').value;
  t.due = document.getElementById('edit-due').value || null;
  save();
  closeModalDirect();
  render();
}

function getFiltered() {
  const q = document.getElementById('search').value.toLowerCase();
  return tasks.filter(t => {
    if (q && !t.name.toLowerCase().includes(q)) return false;
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    if (filter === 'high') return t.priority === 'high';
    if (filter === 'medium') return t.priority === 'medium';
    if (filter === 'low') return t.priority === 'low';
    if (filter === 'overdue') return isOverdue(t.due) && !t.done;
    return true;
  });
}

function render() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');
  const filtered = getFiltered();

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pending = total - done;
  const overdue = tasks.filter(t => isOverdue(t.due) && !t.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-overdue').textContent = overdue;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';

  const filterNames = { all:'All tasks', active:'Active tasks', done:'Completed', high:'High priority', medium:'Medium priority', low:'Low priority', overdue:'Overdue' };
  document.getElementById('list-heading').textContent = `${filterNames[filter] || 'Tasks'} (${filtered.length})`;

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = filtered.map(t => {
    const od = isOverdue(t.due) && !t.done;
    const soon = isSoon(t.due) && !t.done;
    const dueClass = od ? 'overdue' : soon ? 'soon' : '';
    const dueIcon = od ? 'ti-alert-circle' : 'ti-calendar';
    return `
    <div class="task-item${t.done ? ' done' : ''}" data-id="${t.id}">
      <button class="check-btn" onclick="toggleDone('${t.id}')" aria-label="${t.done ? 'Mark incomplete' : 'Mark complete'}">
        ${t.done ? '<i class="ti ti-check" aria-hidden="true"></i>' : ''}
      </button>
      <div class="task-body">
        <p class="task-name">${escHtml(t.name)}</p>
        <div class="task-meta">
          <span class="priority-dot p-${t.priority}" title="${t.priority} priority"></span>
          <span class="tag tag-${t.category}">${t.category}</span>
          ${t.due ? `<span class="due-label ${dueClass}"><i class="ti ${dueIcon}" style="font-size:12px" aria-hidden="true"></i> ${formatDate(t.due)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" onclick="openEdit('${t.id}')" aria-label="Edit task"><i class="ti ti-pencil" aria-hidden="true"></i></button>
        <button class="icon-btn danger" onclick="deleteTask('${t.id}')" aria-label="Delete task"><i class="ti ti-trash" aria-hidden="true"></i></button>
      </div>
    </div>`;
  }).join('');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Keyboard shortcut: Escape closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModalDirect();
});

// Demo data on first visit
// if (tasks.length === 0) {
//   const today = todayStr();
//   const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
//   const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,10);
//   tasks = [
//     { id: uid(), name: 'Finalize Q3 project proposal', category: 'work', priority: 'high', due: today, done: false, created: Date.now() },
//     { id: uid(), name: 'Team standup at 10am', category: 'work', priority: 'medium', due: today, done: true, created: Date.now() },
//     { id: uid(), name: 'Morning run — 30 minutes', category: 'health', priority: 'medium', due: today, done: false, created: Date.now() },
//     { id: uid(), name: 'Review monthly budget', category: 'finance', priority: 'high', due: yesterday, done: false, created: Date.now() },
//     { id: uid(), name: 'Grocery shopping', category: 'personal', priority: 'low', due: tomorrow, done: false, created: Date.now() },
//     { id: uid(), name: 'Read 20 pages of book', category: 'personal', priority: 'low', due: null, done: true, created: Date.now() },
//   ];
//   save();
// }

setDateLabel();
render();