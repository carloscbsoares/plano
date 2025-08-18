const form = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const forceBtn = document.getElementById('forceAlerts');

function getTasks() {
  return JSON.parse(localStorage.getItem('tasks')) || [];
}

function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';
  getTasks().forEach((t, i) => {
    const li = document.createElement('li');
    li.textContent = `${t.name} - ${t.date} - Resp: ${t.responsavel} (${t.email}, ${t.telefone})`;
    taskList.appendChild(li);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const task = {
    name: document.getElementById('taskName').value,
    date: document.getElementById('taskDate').value,
    responsavel: document.getElementById('responsavel').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value
  };
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
  renderTasks();
  form.reset();
});

forceBtn.addEventListener('click', () => {
  fetch('/.netlify/functions/notify', { method: 'POST' });
});

renderTasks();