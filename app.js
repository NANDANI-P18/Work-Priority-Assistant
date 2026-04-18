// ============================================
// USERS — hardcoded credential system
// ============================================
const USERS = [
  { username: "rajvi",     password: "ts@306",    name: "Rajvi Patel",    role: 1 },
  { username: "priya",   password: "ts@306",    name: "Priya Panchal",   role: 1 },
  { username: "meera",   password: "ts@306",    name: "Meera Shah",  role: 1 },
  { username: "mentor",  password: "faculty@33", name: "Prof. Sharma", role: 2 },
  { username: "teacher", password: "teach@123",   name: "Dr. Mehta",    role: 3 },
];

// ============================================
// DATA
// ============================================
let tasks = [];
let currentUser = { name: "", role: 1 };
let nextId = 1;

// ============================================
// EISENHOWER MATRIX — auto quadrant detection
// User never manually enters urgency
// System derives it from deadline + impact
// ============================================
function getQuadrant(daysLeft, impact) {
  let isUrgent    = daysLeft <= 5;
  let isImportant = impact >= 3;

  if  (isUrgent && isImportant)  return { q: 1, label: "Do First",  color: "#e74c3c" };
  if  (!isUrgent && isImportant) return { q: 2, label: "Schedule",  color: "#3498db" };
  if  (isUrgent && !isImportant) return { q: 3, label: "Delegate",  color: "#f39c12" };
  return                                { q: 4, label: "Eliminate", color: "#95a5a6" };
}

// ============================================
// PRIORITY SCORING FORMULA
// Deadline: 50% weight  (most important)
// Impact:   35% weight  (business value)
// Effort:  -15% penalty (easier tasks first when tied)
// Tiebreaker: tiny impact bonus + effort penalty
// ============================================
function calculateScore(task) {
  // Step 1 — Convert days left into a deadline urgency score
  let deadlineScore = 0;
  if      (task.daysLeft <= 0) deadlineScore = 10;  // overdue
  else if (task.daysLeft <= 1) deadlineScore = 8;   // due tomorrow
  else if (task.daysLeft <= 3) deadlineScore = 6;   // due very soon
  else if (task.daysLeft <= 7) deadlineScore = 4;   // due this week
  else                         deadlineScore = 1;   // plenty of time

  // Step 2 — Weighted formula
  let score = (deadlineScore * 0.50)
            + (task.impact   * 0.35)
            - (task.effort   * 0.15);

  // Step 3 — Tiebreaker (when deadline + impact + effort are identical)
  // Higher impact wins, lower effort wins
  score += (task.impact * 0.001) - (task.effort * 0.0005);

  // Step 4 — Auto assign quadrant (no manual input needed)
  task.quadrant = getQuadrant(task.daysLeft, task.impact);

  return Math.round(score * 100) / 100;
}

// ============================================
// DYNAMIC SCORE RECALCULATION
// Called every time app opens and after every change
// This is what makes prioritization "real-time"
// As days pass, scores update automatically
// ============================================
function recalculateAllScores() {
  tasks.forEach(task => {
    if (!task.isDone) {
      task.score    = calculateScore(task);
      task.quadrant = getQuadrant(task.daysLeft, task.impact);
      // Mark overdue automatically
      if (task.daysLeft <= 0) task.isOverdue = true;
    }
  });
  saveToStorage();
}

// ============================================
// LOGIN
// ============================================
function login() {
  let username = document.getElementById('username').value.trim().toLowerCase();
  let password = document.getElementById('password').value.trim();
  let errorBox = document.getElementById('login-error');

  let matchedUser = USERS.find(u => u.username === username && u.password === password);

  if (!matchedUser) {
    errorBox.style.display = 'block';
    return;
  }

  errorBox.style.display = 'none';
  currentUser = { name: matchedUser.name, role: matchedUser.role };

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('user-info').innerText =
    matchedUser.name + ' · ' + getRoleName(matchedUser.role);

  loadFromStorage();
  loadSampleData();

  // IMPORTANT: recalculate FIRST, then render
  // This ensures scores are always fresh before display
  recalculateAllScores();
  renderAll();
}

function getRoleName(role) {
  return ['', 'Team Member', 'Faculty Mentor', 'Subject Teacher'][role];
}

// ============================================
// ADD TASK
// ============================================
function openAddModal() {
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  // Clear form
  document.getElementById('t-title').value    = '';
  document.getElementById('t-assigned').value = '';
  document.getElementById('t-category').value = '';
  document.getElementById('t-days').value     = '';
  document.getElementById('t-impact').value   = 3;
  document.getElementById('t-effort').value   = 3;
  document.getElementById('impact-val').innerText = 3;
  document.getElementById('effort-val').innerText = 3;
}

function addTask() {
  let title    = document.getElementById('t-title').value.trim();
  let assigned = document.getElementById('t-assigned').value.trim();
  let category = document.getElementById('t-category').value.trim();
  let daysLeft = parseInt(document.getElementById('t-days').value);
  let impact   = parseInt(document.getElementById('t-impact').value);
  let effort   = parseInt(document.getElementById('t-effort').value);

  if (!title || !assigned || isNaN(daysLeft)) {
    alert('Please fill in Task Title, Assigned To, and Days Until Deadline.');
    return;
  }

  let task = {
    id: nextId++,
    title, assigned, category,
    daysLeft, impact, effort,
    isDone: false,
    isOverdue: daysLeft <= 0,
    score: 0,
    quadrant: null,
    createdAt: new Date().toLocaleDateString()
  };

  // Score and quadrant calculated automatically — no manual urgency input
  task.score    = calculateScore(task);
  task.quadrant = getQuadrant(task.daysLeft, task.impact);

  tasks.push(task);
  saveToStorage();
  recalculateAllScores(); // re-rank everything after new task added
  renderAll();
  closeModal();
}

// ============================================
// MARK DONE
// ============================================
function markDone(id) {
  let task = tasks.find(t => t.id === id);
  if (task) {
    task.isDone    = true;
    task.isOverdue = false;
    task.completedAt = new Date().toLocaleDateString();
    saveToStorage();
    recalculateAllScores();
    renderAll();
  }
}

// ============================================
// DELETE TASK
// ============================================
function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveToStorage();
  renderAll();
}

// ============================================
// EDIT DEADLINE — for Faculty Mentor
// Judges specifically asked about dynamic updates
// This shows real-time re-prioritization
// ============================================
function editDeadline(id) {
  let task = tasks.find(t => t.id === id);
  if (!task) return;

  let newDays = prompt(
    `Current deadline for "${task.title}": ${task.daysLeft} days left.\nEnter new number of days:`
  );

  if (newDays === null || newDays === '') return;
  newDays = parseInt(newDays);
  if (isNaN(newDays)) { alert('Please enter a valid number.'); return; }

  task.daysLeft  = newDays;
  task.isOverdue = newDays <= 0;

  // Recalculate score immediately after deadline change
  // This is what "dynamic real-time prioritization" means
  task.score    = calculateScore(task);
  task.quadrant = getQuadrant(task.daysLeft, task.impact);

  saveToStorage();
  recalculateAllScores();
  renderAll();

  alert(`Deadline updated! New priority score: ${task.score}`);
}

// ============================================
// SORTING
// Highest score first, completed tasks at bottom
// ============================================
function getSortedTasks() {
  return [...tasks].sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    return b.score - a.score;
  });
}

// ============================================
// RENDER TASKS TABLE
// ============================================
function renderTasks() {
  let sorted = getSortedTasks();
  let tbody  = document.getElementById('task-body');
  tbody.innerHTML = '';

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:2rem;color:#aaa">
      No tasks yet. Click "+ Add Task" to begin.
    </td></tr>`;
    renderSuggestion([]);
    return;
  }

  sorted.forEach((task, index) => {
    let scoreClass = task.score >= 6 ? 'score-high'
                   : task.score >= 3 ? 'score-med'
                   : 'score-low';

    let daysDisplay = task.daysLeft <= 0
      ? `<span style="color:#e74c3c;font-weight:700">OVERDUE</span>`
      : task.daysLeft === 1
        ? `<span style="color:#e74c3c;font-weight:600">1 day</span>`
        : task.daysLeft <= 3
          ? `<span style="color:#f39c12;font-weight:600">${task.daysLeft} days</span>`
          : `<span style="color:#27ae60">${task.daysLeft} days</span>`;

    let statusBadge = task.isDone
      ? '<span class="done-badge">Done</span>'
      : task.isOverdue
        ? '<span style="background:#ffe0e0;color:#c0392b;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600">Overdue</span>'
        : '<span class="pending-badge">Pending</span>';

    let q = task.quadrant || getQuadrant(task.daysLeft, task.impact);

    let actionBtns = task.isDone
      ? `<button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>`
      : `<button class="btn-done"   onclick="markDone(${task.id})">✓ Done</button>
         <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
         ${currentUser.role >= 2
           ? `<button class="btn-secondary" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="editDeadline(${task.id})">Edit</button>`
           : ''}`;

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:700;color:#aaa">${index + 1}</td>
        <td><strong>${task.title}</strong>
          <div style="font-size:0.75rem;color:#aaa;margin-top:2px">Added: ${task.createdAt || '-'}</div>
        </td>
        <td>${task.assigned}</td>
        <td><span style="background:#f0f0f0;padding:2px 8px;border-radius:10px;font-size:0.78rem">${task.category || '-'}</span></td>
        <td>${daysDisplay}</td>
        <td>${task.impact}/5</td>
        <td>${task.effort}/5</td>
        <td><span class="${scoreClass}">${task.score}</span></td>
        <td>
          <span style="background:${q.color}22;color:${q.color};padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:600">
            Q${q.q}: ${q.label}
          </span>
        </td>
        <td>${statusBadge}</td>
        <td>${actionBtns}</td>
      </tr>`;
  });

  // renderSuggestion called AFTER table is rendered
  renderSuggestion(sorted);
}

// ============================================
// AI SUGGESTION BOX
// Shows the single most important pending task
// This is the "actionable task sequencing" feature
// renderSuggestion always called after renderTasks
// ============================================
function renderSuggestion(sorted) {
  let box = document.getElementById('suggestion-box');
  let top = sorted.find(t => !t.isDone);

  if (!top) {
    box.innerHTML = `<span style="color:#27ae60;font-weight:600">
      🎉 All tasks completed! Great work.
    </span>`;
    return;
  }

  let q = top.quadrant || getQuadrant(top.daysLeft, top.impact);

  box.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="
        background:${q.color};
        color:white;
        width:44px;height:44px;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-weight:800;font-size:1.1rem;flex-shrink:0
      ">Q${q.q}</div>
      <div>
        <div style="font-size:0.72rem;color:#888;letter-spacing:0.5px;margin-bottom:2px">
          AI RECOMMENDATION — FOCUS ON THIS TASK NEXT
        </div>
        <div style="font-size:1.05rem;font-weight:700;color:#1a1a2e">${top.title}</div>
        <div style="font-size:0.82rem;color:#666;margin-top:3px">
          Assigned to: <strong>${top.assigned}</strong>
          &nbsp;·&nbsp; Score: <strong>${top.score}</strong>
          &nbsp;·&nbsp; ${top.daysLeft <= 0
            ? '<span style="color:#e74c3c;font-weight:600">OVERDUE — immediate action required</span>'
            : `${top.daysLeft} day(s) remaining`}
          &nbsp;·&nbsp; Quadrant: <span style="color:${q.color};font-weight:600">${q.label}</span>
        </div>
      </div>
    </div>`;
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  let total   = tasks.length;
  let done    = tasks.filter(t => t.isDone).length;
  let overdue = tasks.filter(t => !t.isDone && t.daysLeft <= 0).length;
  let highPri = tasks.filter(t => !t.isDone && t.score >= 6).length;
  let rate    = total > 0 ? Math.round(done * 100 / total) : 0;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-num">${total}</div>
      <div class="stat-label">Total Tasks</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#27ae60">${done}</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#e74c3c">${overdue}</div>
      <div class="stat-label">Overdue</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#f39c12">${highPri}</div>
      <div class="stat-label">High Priority</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${rate}%</div>
      <div class="stat-label">Completion Rate</div>
    </div>`;

  // Quadrant distribution
  let q1 = tasks.filter(t => !t.isDone && t.quadrant && t.quadrant.q === 1).length;
  let q2 = tasks.filter(t => !t.isDone && t.quadrant && t.quadrant.q === 2).length;
  let q3 = tasks.filter(t => !t.isDone && t.quadrant && t.quadrant.q === 3).length;
  let q4 = tasks.filter(t => !t.isDone && t.quadrant && t.quadrant.q === 4).length;

  document.getElementById('stats-grid').innerHTML += `
    <div class="stat-card">
      <div style="font-size:0.75rem;color:#888;margin-bottom:6px">MATRIX BREAKDOWN</div>
      <div style="font-size:0.82rem;line-height:1.8">
        <span style="color:#e74c3c">●</span> Q1 Do First: <strong>${q1}</strong><br>
        <span style="color:#3498db">●</span> Q2 Schedule: <strong>${q2}</strong><br>
        <span style="color:#f39c12">●</span> Q3 Delegate: <strong>${q3}</strong><br>
        <span style="color:#95a5a6">●</span> Q4 Eliminate: <strong>${q4}</strong>
      </div>
    </div>`;

  // Workload per person
  let people = [...new Set(tasks.map(t => t.assigned))];
  let wGrid  = document.getElementById('workload-grid');
  wGrid.innerHTML = '';

  people.forEach(person => {
    let pTasks  = tasks.filter(t => t.assigned === person);
    let pDone   = pTasks.filter(t => t.isDone).length;
    let pPct    = Math.round(pDone * 100 / pTasks.length);
    let pOver   = pTasks.filter(t => !t.isDone && t.daysLeft <= 0).length;
    let barColor = pOver > 0 ? '#e74c3c' : pPct === 100 ? '#27ae60' : '#4361ee';

    wGrid.innerHTML += `
      <div class="workload-card">
        <span style="min-width:140px;font-size:0.88rem;font-weight:600">${person}</span>
        <span style="font-size:0.78rem;color:#888;min-width:60px">${pTasks.length} tasks</span>
        ${pOver > 0
          ? `<span style="font-size:0.75rem;color:#e74c3c;font-weight:600;min-width:80px">${pOver} overdue</span>`
          : `<span style="min-width:80px"></span>`}
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pPct}%;background:${barColor}"></div>
        </div>
        <span style="font-size:0.82rem;font-weight:700;min-width:36px;color:${barColor}">${pPct}%</span>
      </div>`;
  });

  if (people.length === 0) {
    wGrid.innerHTML = '<p style="color:#aaa;font-size:0.88rem">No tasks assigned yet.</p>';
  }
}

// ============================================
// ALERTS
// ============================================
function renderAlerts() {
  let list   = document.getElementById('alerts-list');
  let banner = document.getElementById('alert-banner');
  list.innerHTML = '';
  let urgentCount = 0;

  let sorted = getSortedTasks();

  sorted.forEach(task => {
    if (task.isDone) return;

    if (task.daysLeft <= 0) {
      urgentCount++;
      list.innerHTML += `
        <div class="alert-card alert-overdue">
          <strong>OVERDUE:</strong> ${task.title}
          <span style="float:right;font-size:0.78rem">Assigned to: ${task.assigned} · Score: ${task.score}</span>
        </div>`;
    } else if (task.daysLeft <= 2) {
      urgentCount++;
      list.innerHTML += `
        <div class="alert-card alert-duesoon">
          <strong>Due in ${task.daysLeft} day(s):</strong> ${task.title}
          <span style="float:right;font-size:0.78rem">Assigned to: ${task.assigned}</span>
        </div>`;
    } else if (task.daysLeft <= 5) {
      list.innerHTML += `
        <div class="alert-card alert-reminder">
          <strong>Reminder:</strong> "${task.title}" due in ${task.daysLeft} days
          <span style="float:right;font-size:0.78rem">Assigned to: ${task.assigned}</span>
        </div>`;
    }
  });

  if (list.innerHTML === '') {
    list.innerHTML = '<p style="color:#888;padding:1rem">No alerts. All tasks on track. ✓</p>';
  }

  // Top banner
  if (urgentCount > 0) {
    banner.classList.remove('hidden');
    banner.innerText = `⚠ ${urgentCount} task(s) are overdue or due very soon — check Alerts tab.`;
  } else {
    banner.classList.add('hidden');
  }

  // Email alert previews
  generateEmailAlerts(sorted);
}

// ============================================
// EMAIL ALERT PREVIEW
// Shows what automated emails would look like
// In production: connects to EmailJS for real sending
// ============================================
function generateEmailAlerts(sorted) {
  let alertBox = document.getElementById('email-alerts');
  if (!alertBox) return;
  alertBox.innerHTML = '';

  let emailsGenerated = 0;

  sorted.forEach(task => {
    if (task.isDone) return;

    let subject = '';
    let message = '';
    let color   = '';
    let urgency = '';

    if (task.daysLeft <= 0) {
      subject = `URGENT: Overdue Task — ${task.title}`;
      message = 'This task is overdue. Immediate action is required. Please update the task status or contact your mentor.';
      color   = '#e74c3c';
      urgency = 'OVERDUE';
    } else if (task.daysLeft <= 2) {
      subject = `REMINDER: Task due in ${task.daysLeft} day(s) — ${task.title}`;
      message = `This task is due very soon. Please ensure it is completed within ${task.daysLeft} day(s).`;
      color   = '#f39c12';
      urgency = 'DUE SOON';
    } else {
      return;
    }

    emailsGenerated++;
    alertBox.innerHTML += `
      <div style="border:1px solid #e0e0e0;border-radius:10px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
        <div style="background:${color};color:white;padding:10px 16px;font-size:0.83rem;font-weight:600;display:flex;justify-content:space-between">
          <span>📧 ${subject}</span>
          <span style="opacity:0.85;font-size:0.75rem">${urgency}</span>
        </div>
        <div style="padding:14px 16px;font-size:0.83rem;background:white;line-height:1.8">
          <div style="color:#888;font-size:0.75rem;margin-bottom:8px">AUTO-GENERATED ALERT</div>
          <strong>To:</strong> ${task.assigned} &lt;${task.assigned.toLowerCase().replace(' ','.')}@gtu.ac.in&gt;<br>
          <strong>From:</strong> WorkPriority Assistant &lt;noreply@workassistant.gtu.ac.in&gt;<br>
          <strong>Subject:</strong> ${subject}<br><br>
          <p>Dear ${task.assigned},</p><br>
          <p>${message}</p><br>
          <p><strong>Task Details:</strong></p>
          <p>Task: ${task.title}</p>
          <p>Category: ${task.category || 'General'}</p>
          <p>Days Remaining: ${task.daysLeft <= 0 ? 'OVERDUE' : task.daysLeft}</p>
          <p>Priority Score: ${task.score}</p>
          <p>Quadrant: ${task.quadrant ? task.quadrant.label : '-'}</p>
          <br>
          <p style="color:#888;font-size:0.75rem;border-top:1px solid #f0f0f0;padding-top:8px">
            This is an automated alert from the Intelligent Work Priority Assistant.<br>
            In production, this email is sent via EmailJS API directly from the browser — no backend required.
          </p>
        </div>
      </div>`;
  });

  if (emailsGenerated === 0) {
    alertBox.innerHTML = '<p style="color:#888;font-size:0.85rem">No email alerts needed. All tasks on track.</p>';
  }
}

// ============================================
// EISENHOWER MATRIX VIEW
// Visual 4-quadrant layout
// ============================================
function renderMatrix() {
  let grid = document.getElementById('matrix-grid');
  if (!grid) return;

  let quadrants = [
    { q: 1, label: 'Q1 — Do First',  sub: 'Urgent + Important',     color: '#e74c3c', bg: '#fff5f5' },
    { q: 2, label: 'Q2 — Schedule',  sub: 'Not Urgent + Important',  color: '#3498db', bg: '#f0f7ff' },
    { q: 3, label: 'Q3 — Delegate',  sub: 'Urgent + Not Important',  color: '#f39c12', bg: '#fff8f0' },
    { q: 4, label: 'Q4 — Eliminate', sub: 'Not Urgent + Not Important', color: '#95a5a6', bg: '#f8f9fa' },
  ];

  grid.innerHTML = '';

  quadrants.forEach(qDef => {
    let qTasks = tasks.filter(t =>
      !t.isDone && t.quadrant && t.quadrant.q === qDef.q
    );

    let taskItems = qTasks.length === 0
      ? `<div style="color:#bbb;font-size:0.82rem;padding:8px 0">No tasks in this quadrant</div>`
      : qTasks.map(t => `
          <div style="
            background:white;
            border-left:3px solid ${qDef.color};
            border-radius:6px;
            padding:8px 12px;
            margin-bottom:8px;
            font-size:0.83rem;
            box-shadow:0 1px 3px rgba(0,0,0,0.06)
          ">
            <div style="font-weight:600;color:#1a1a2e">${t.title}</div>
            <div style="color:#888;font-size:0.75rem;margin-top:2px">
              ${t.assigned} · Score: ${t.score} · 
              ${t.daysLeft <= 0 ? '<span style="color:#e74c3c">OVERDUE</span>' : t.daysLeft + ' days left'}
            </div>
          </div>`).join('');

    grid.innerHTML += `
      <div style="
        background:${qDef.bg};
        border:2px solid ${qDef.color}44;
        border-radius:12px;
        padding:16px;
      ">
        <div style="font-weight:700;color:${qDef.color};font-size:0.95rem;margin-bottom:2px">${qDef.label}</div>
        <div style="font-size:0.75rem;color:#888;margin-bottom:12px">${qDef.sub}</div>
        ${taskItems}
      </div>`;
  });
}

// ============================================
// CSV EXPORT
// ============================================
function exportCSV() {
  let csv = 'ID,Title,Assigned To,Category,Days Left,Impact,Effort,Score,Quadrant,Status,Added\n';
  tasks.forEach(t => {
    let q = t.quadrant ? t.quadrant.label : getQuadrant(t.daysLeft, t.impact).label;
    csv += `${t.id},"${t.title}","${t.assigned}","${t.category || ''}",${t.daysLeft},${t.impact},${t.effort},${t.score},"${q}",${t.isDone ? 'Done' : 'Pending'},"${t.createdAt || ''}"\n`;
  });

  let blob = new Blob([csv], { type: 'text/csv' });
  let url  = URL.createObjectURL(blob);
  let a    = document.createElement('a');
  a.href = url;
  a.download = 'task_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// EMAIL PARSER
// Extracts task details from pasted email text
// Keyword detection — no ML needed
// ============================================
function openEmailParser() {
  document.getElementById('email-modal').classList.remove('hidden');
}
function closeEmailModal() {
  document.getElementById('email-modal').classList.add('hidden');
  document.getElementById('email-content').value = '';
}

function parseEmail() {
  let raw     = document.getElementById('email-content').value;
  let content = raw.toLowerCase();

  if (!content.trim()) { alert('Please paste some email content first.'); return; }

  // Auto detect days left from keywords
  let daysLeft = 7;
  if      (content.includes('today') || content.includes('urgent') || content.includes('immediately')) daysLeft = 0;
  else if (content.includes('tomorrow'))                                                                daysLeft = 1;
  else if (content.includes('2 days') || content.includes('48 hours') || content.includes('48 hrs'))  daysLeft = 2;
  else if (content.includes('3 days'))                                                                 daysLeft = 3;
  else if (content.includes('this week') || content.includes('5 days'))                               daysLeft = 5;
  else if (content.includes('next week'))                                                              daysLeft = 7;
  else if (content.includes('this month'))                                                             daysLeft = 20;

  // Auto detect impact from keywords
  let impact = 3;
  if      (content.includes('critical') || content.includes('high priority') || content.includes('mandatory')) impact = 5;
  else if (content.includes('important') || content.includes('priority'))                                      impact = 4;
  else if (content.includes('low priority') || content.includes('optional') || content.includes('if time'))   impact = 1;

  // Extract title from Subject line
  let lines = raw.split('\n');
  let title = 'Task from Email';
  for (let line of lines) {
    if (line.toLowerCase().startsWith('subject:')) {
      title = line.replace(/subject:/i, '').trim();
      break;
    }
  }
  // If no subject line, use first non-empty line
  if (title === 'Task from Email') {
    for (let line of lines) {
      if (line.trim().length > 5) { title = line.trim(); break; }
    }
  }

  // Pre-fill the add task form with extracted values
  document.getElementById('t-title').value  = title;
  document.getElementById('t-days').value   = daysLeft;
  document.getElementById('t-impact').value = impact;
  document.getElementById('impact-val').innerText = impact;

  closeEmailModal();
  openAddModal();
}

// ============================================
// FILTER TASKS
// ============================================
function filterTasks() {
  let filterStatus   = document.getElementById('filter-status')   ? document.getElementById('filter-status').value   : 'all';
  let filterCategory = document.getElementById('filter-category') ? document.getElementById('filter-category').value : '';
  let filterQuadrant = document.getElementById('filter-quadrant') ? document.getElementById('filter-quadrant').value : 'all';

  let sorted = getSortedTasks();

  if (filterStatus === 'pending') sorted = sorted.filter(t => !t.isDone);
  if (filterStatus === 'done')    sorted = sorted.filter(t => t.isDone);
  if (filterStatus === 'overdue') sorted = sorted.filter(t => !t.isDone && t.daysLeft <= 0);

  if (filterCategory) sorted = sorted.filter(t =>
    t.category.toLowerCase().includes(filterCategory.toLowerCase())
  );

  if (filterQuadrant !== 'all') {
    let qNum = parseInt(filterQuadrant);
    sorted = sorted.filter(t => t.quadrant && t.quadrant.q === qNum);
  }

  let tbody = document.getElementById('task-body');
  tbody.innerHTML = '';

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:2rem;color:#aaa">No tasks match the current filter.</td></tr>`;
    return;
  }

  sorted.forEach((task, index) => {
    let scoreClass = task.score >= 6 ? 'score-high' : task.score >= 3 ? 'score-med' : 'score-low';
    let q = task.quadrant || getQuadrant(task.daysLeft, task.impact);

    let daysDisplay = task.daysLeft <= 0
      ? `<span style="color:#e74c3c;font-weight:700">OVERDUE</span>`
      : `${task.daysLeft} days`;

    let statusBadge = task.isDone
      ? '<span class="done-badge">Done</span>'
      : '<span class="pending-badge">Pending</span>';

    let actionBtns = task.isDone
      ? `<button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>`
      : `<button class="btn-done" onclick="markDone(${task.id})">✓ Done</button>
         <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
         ${currentUser.role >= 2 ? `<button class="btn-secondary" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="editDeadline(${task.id})">Edit</button>` : ''}`;

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:700;color:#aaa">${index + 1}</td>
        <td><strong>${task.title}</strong></td>
        <td>${task.assigned}</td>
        <td><span style="background:#f0f0f0;padding:2px 8px;border-radius:10px;font-size:0.78rem">${task.category || '-'}</span></td>
        <td>${daysDisplay}</td>
        <td>${task.impact}/5</td>
        <td>${task.effort}/5</td>
        <td><span class="${scoreClass}">${task.score}</span></td>
        <td><span style="background:${q.color}22;color:${q.color};padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:600">Q${q.q}: ${q.label}</span></td>
        <td>${statusBadge}</td>
        <td>${actionBtns}</td>
      </tr>`;
  });
}

// ============================================
// SAVE / LOAD — localStorage (like fopen/fwrite)
// ============================================
function saveToStorage() {
  try {
    localStorage.setItem('wpa_tasks',  JSON.stringify(tasks));
    localStorage.setItem('wpa_nextId', nextId);
  } catch(e) {
    console.error('Save failed:', e);
  }
}

function loadFromStorage() {
  try {
    let saved = localStorage.getItem('wpa_tasks');
    let sid   = localStorage.getItem('wpa_nextId');
    if (saved) tasks  = JSON.parse(saved);
    if (sid)   nextId = parseInt(sid);
  } catch(e) {
    tasks  = [];
    nextId = 1;
  }
}

// ============================================
// SAMPLE DATA — GTU realistic tasks
// Change if (tasks.length > 0) return;
// to tasks = []; nextId = 1;
// ONLY while testing, then change back
// ============================================
function loadSampleData() {
  if (tasks.length > 0) return;

  tasks = [
    {
      id: 1,
      title: "GTU Project Expo Registration — LDCE",
      assigned: "Rajvi Patel",
      category: "GTU Submission",
      daysLeft: 0,
      impact: 5, effort: 3,
      isDone: false, isOverdue: true,
      score: 0, quadrant: null,
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 2,
      title: "Hackathon Final Submission — GTU",
      assigned: "Priya Panchal",
      category: "GTU Submission",
      daysLeft: 1,
      impact: 5, effort: 4,
      isDone: false, isOverdue: false,
      score: 0, quadrant: null,
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 3,
      title: "College Cultural Event Planning",
      assigned: "Meera Shah",
      category: "Event",
      daysLeft: 3,
      impact: 4, effort: 2,
      isDone: false, isOverdue: false,
      score: 0, quadrant: null,
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 4,
      title: "Lab Manual Submission — Physics",
      assigned: "Rajvi Patel",
      category: "Academic",
      daysLeft: 5,
      impact: 3, effort: 3,
      isDone: false, isOverdue: false,
      score: 0, quadrant: null,
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 5,
      title: "Industry Visit Report",
      assigned: "Priya Panchal",
      category: "Academic",
      daysLeft: 8,
      impact: 3, effort: 2,
      isDone: false, isOverdue: false,
      score: 0, quadrant: null,
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 6,
      title: "Budget Report for Department",
      assigned: "Meera Shah",
      category: "GTU Submission",
      daysLeft: 10,
      impact: 4, effort: 3,
      isDone: false, isOverdue: false,
      score: 0, quadrant: null,
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 7,
      title: "Attendance Sheet Update",
      assigned: "Rajvi Patel",
      category: "Admin",
      daysLeft: 15,
      impact: 2, effort: 1,
      isDone: true, isOverdue: false,
      score: 0, quadrant: null,
      createdAt: new Date().toLocaleDateString(),
      completedAt: new Date().toLocaleDateString()
    },
  ];

  nextId = 8;
  saveToStorage();
}

// ============================================
// NAVIGATION
// ============================================
function showSection(name) {
  ['tasks', 'dashboard', 'alerts', 'reports', 'matrix'].forEach(s => {
    let sec = document.getElementById('section-' + s);
    let btn = document.getElementById('btn-' + s);
    if (sec) sec.classList.add('hidden');
    if (btn) btn.classList.remove('active');
  });

  let target = document.getElementById('section-' + name);
  let btnTarget = document.getElementById('btn-' + name);
  if (target)    target.classList.remove('hidden');
  if (btnTarget) btnTarget.classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'alerts')    renderAlerts();
  if (name === 'matrix')    renderMatrix();
  if (name === 'reports')   renderTrends();
}

// ============================================
// PRODUCTIVITY TRENDS — Reports section
// ============================================
function renderTrends() {
  let box = document.getElementById('trends-box');
  if (!box) return;

  let completed = tasks.filter(t => t.isDone);
  let pending   = tasks.filter(t => !t.isDone);
  let overdue   = tasks.filter(t => !t.isDone && t.daysLeft <= 0);

  let avgScore = pending.length > 0
    ? (pending.reduce((s, t) => s + t.score, 0) / pending.length).toFixed(2)
    : 0;

  let categories = [...new Set(tasks.map(t => t.category).filter(Boolean))];
  let catBreakdown = categories.map(cat => {
    let catTasks = tasks.filter(t => t.category === cat);
    let catDone  = catTasks.filter(t => t.isDone).length;
    return `<tr>
      <td style="padding:6px 12px">${cat}</td>
      <td style="padding:6px 12px;text-align:center">${catTasks.length}</td>
      <td style="padding:6px 12px;text-align:center;color:#27ae60">${catDone}</td>
      <td style="padding:6px 12px;text-align:center;color:#e74c3c">${catTasks.length - catDone}</td>
    </tr>`;
  }).join('');

  box.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem">
      <div class="stat-card">
        <div class="stat-num">${completed.length}</div>
        <div class="stat-label">Total Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#f39c12">${pending.length}</div>
        <div class="stat-label">Still Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#e74c3c">${overdue.length}</div>
        <div class="stat-label">Overdue</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:#4361ee">${avgScore}</div>
        <div class="stat-label">Avg Priority Score</div>
      </div>
    </div>
    <h3 style="margin-bottom:1rem;font-size:1rem">Task Breakdown by Category</h3>
    <table style="width:100%;background:white;border-radius:10px;overflow:hidden;border-collapse:collapse;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      <thead>
        <tr style="background:#f8f9fa">
          <th style="padding:10px 12px;text-align:left;font-size:0.8rem;color:#888">Category</th>
          <th style="padding:10px 12px;text-align:center;font-size:0.8rem;color:#888">Total</th>
          <th style="padding:10px 12px;text-align:center;font-size:0.8rem;color:#888">Done</th>
          <th style="padding:10px 12px;text-align:center;font-size:0.8rem;color:#888">Pending</th>
        </tr>
      </thead>
      <tbody>${catBreakdown || '<tr><td colspan="4" style="padding:1rem;color:#aaa;text-align:center">No data yet</td></tr>'}</tbody>
    </table>`;
}

// ============================================
// RENDER ALL
// Order: recalculate → render tasks → render alerts
// recalculateAllScores is called before renderAll in login()
// ============================================
function renderAll() {
  renderTasks();   // renderSuggestion is called inside renderTasks
  renderAlerts();
}
