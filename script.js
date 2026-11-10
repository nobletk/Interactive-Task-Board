// Application State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM Element References
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const taskDescription = document.getElementById('task-description');
const taskSummary = document.getElementById('task-summary');
const themeToggle = document.getElementById('theme-toggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    themeToggle.addEventListener('click', toggleTheme);
    renderTasks();

    taskForm.addEventListener('submit', handleAddTask);
    searchInput.addEventListener('input', renderTasks);
    categoryFilter.addEventListener('change', renderTasks);
    setupDragAndDrop();
});

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Add a new task
function handleAddTask(e) {
    e.preventDefault();

    const newTask = {
        id: Date.now().toString(),
        title: taskTitle.value.trim(),
        description: taskDescription.value.trim(),
        category: taskCategory.value,
        priority: taskPriority.value,
        status: 'todo'
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // Reset form fields
    taskForm.reset();
}

// Update status of a task
function updateTaskStatus(id, newStatus) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
    );
    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// Drag and drop a task
function setupDragAndDrop() {
    const board = document.querySelector('.board-container');
    board.addEventListener('dragstart', handleDragStart);
    board.addEventListener('dragend', handleDragEnd);

    document.querySelectorAll('.column').forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    const card = e.target.closest('.task-card');
    if (!card) return;

    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
}

function handleDragEnd(e) {
    const card = e.target.closest('.task-card');
    if (card) card.classList.remove('dragging');

    document.querySelectorAll('.drag-over').forEach(column => column.classList.remove('drag-over'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const column = e.currentTarget;
    column.classList.remove('drag-over');

    const id = e.dataTransfer.getData('text/plain');
    if (id) updateTaskStatus(id, column.dataset.status);
}

// Render tasks onto the board based on status and filters
function renderTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    // Clear lists
    const lists = {
        'todo': document.getElementById('list-todo'),
        'in-progress': document.getElementById('list-in-progress'),
        'completed': document.getElementById('list-completed')
    };

    Object.values(lists).forEach(list => list.innerHTML = '');

    // Track counts
    const counts = { 'todo': 0, 'in-progress': 0, 'completed': 0 };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Append elements
    filteredTasks.forEach(task => {
        counts[task.status]++;
        const cardHtml = createTaskCard(task);
        if (lists[task.status]) {
            lists[task.status].appendChild(cardHtml);
        }
    });

    // Update counts in DOM
    document.getElementById('count-todo').textContent = counts['todo'];
    document.getElementById('count-in-progress').textContent = counts['in-progress'];
    document.getElementById('count-completed').textContent = counts['completed'];

    // Task Counter
    const activeCount = tasks.filter(task => task.status !== 'completed').length;
    const completedCount = tasks.filter(task => task.status === 'completed').length;
    taskSummary.textContent = `${activeCount} active · ${completedCount} completed`;
}

// Helper: Create Task DOM element
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;
    card.setAttribute('data-priority', task.priority);

    card.innerHTML = `
    <div class="task-card-title">${escapeHtml(task.title)}</div>
    ${task.description ? `<p class="task-card-description">${escapeHtml(task.description)}</p>` : ''}
    <div class="task-meta">
      <span>${escapeHtml(task.category)}</span>
      <span>${escapeHtml(task.priority)} Priority</span>
    </div>
    <div class="task-actions">
      <select onchange="updateTaskStatus('${task.id}', this.value)">
        <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
      <button class="btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
    </div>
  `;

    return card;
}

// Security: Helper function to escape basic HTML injection
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButton(isDark);
}

function applySavedTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark', isDark);
    updateThemeButton(isDark);
}

function updateThemeButton(isDark) {
    themeToggle.textContent = isDark ? '☀️ Light mode' : '🌙 Dark mode';
    themeToggle.setAttribute('aria-pressed', isDark);
}
