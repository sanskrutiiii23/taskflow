const tasksDOM = document.querySelector('#tasks');
const loadingDOM = document.querySelector('.loading-text');
const formDOM = document.querySelector('#task-form');
const taskInputDOM = document.querySelector('#task-name');
const priorityDOM = document.querySelector('#task-priority');
const dueDOM = document.querySelector('#task-due');
const descriptionDOM = document.querySelector('#task-description');
const formAlertDOM = document.querySelector('.form-alert');
const searchDOM = document.querySelector('#search-input');
const sortDOM = document.querySelector('#sort-select');
const clearCompletedBtn = document.querySelector('#clear-completed-btn');
const filterChips = document.querySelectorAll('.chip[data-filter]');

const modal = document.querySelector('#edit-modal');
const editForm = document.querySelector('#edit-form');
const editId = document.querySelector('#edit-id');
const editName = document.querySelector('#edit-name');
const editDescription = document.querySelector('#edit-description');
const editPriority = document.querySelector('#edit-priority');
const editDue = document.querySelector('#edit-due');
const editCompleted = document.querySelector('#edit-completed');
const editSubmit = document.querySelector('#edit-submit');
const editAlert = document.querySelector('.edit-alert');

let currentFilter = 'all';
let searchTimer = null;

const escapeHTML = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const isOverdue = (task) => {
  if (!task.dueDate || task.completed) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const showAlert = (el, message, isSuccess = false) => {
  el.textContent = message;
  el.classList.toggle('is-success', isSuccess);
  setTimeout(() => {
    el.textContent = '';
    el.classList.remove('is-success');
  }, 2800);
};

const updateStats = (stats = {}) => {
  document.querySelectorAll('[data-stat]').forEach((el) => {
    const key = el.dataset.stat;
    el.textContent = stats[key] ?? 0;
  });
};

const buildQuery = () => {
  const params = new URLSearchParams();

  if (currentFilter === 'pending') params.set('completed', 'false');
  if (currentFilter === 'completed') params.set('completed', 'true');

  const search = searchDOM.value.trim();
  if (search) params.set('search', search);

  const sort = sortDOM.value;
  if (sort && sort !== 'newest') params.set('sort', sort);

  const query = params.toString();
  return query ? `?${query}` : '';
};

const renderTasks = (tasks) => {
  if (!tasks.length) {
    tasksDOM.innerHTML =
      '<p class="empty-list">No tasks here yet. Add one to get started.</p>';
    return;
  }

  tasksDOM.innerHTML = tasks
    .map((task, index) => {
      const { _id, name, description, completed, priority, dueDate } = task;
      const overdue = isOverdue(task);
      const dueLabel = formatDate(dueDate);

      return `
        <article
          class="task-card ${completed ? 'is-completed' : ''}"
          style="animation-delay: ${Math.min(index * 0.04, 0.28)}s"
          data-id="${_id}"
        >
          <button
            type="button"
            class="toggle-btn ${completed ? 'is-done' : ''}"
            data-action="toggle"
            data-id="${_id}"
            data-completed="${completed}"
            aria-label="${completed ? 'Mark as pending' : 'Mark as completed'}"
          >
            <i class="fas fa-check"></i>
          </button>

          <div class="task-body">
            <h3 class="task-title">${escapeHTML(name)}</h3>
            ${
              description
                ? `<p class="task-desc">${escapeHTML(description)}</p>`
                : ''
            }
            <div class="task-meta">
              <span class="badge badge-${priority}">${priority}</span>
              ${
                dueLabel
                  ? `<span class="badge badge-due ${
                      overdue ? 'is-overdue' : ''
                    }"><i class="far fa-calendar"></i> ${dueLabel}${
                      overdue ? ' · overdue' : ''
                    }</span>`
                  : ''
              }
            </div>
          </div>

          <div class="task-actions">
            <button
              type="button"
              class="icon-btn"
              data-action="edit"
              data-id="${_id}"
              aria-label="Edit task"
            >
              <i class="fas fa-pen"></i>
            </button>
            <button
              type="button"
              class="icon-btn delete"
              data-action="delete"
              data-id="${_id}"
              aria-label="Delete task"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </article>
      `;
    })
    .join('');
};

const showTasks = async () => {
  loadingDOM.style.visibility = 'visible';
  try {
    const { data } = await axios.get(`/api/v1/tasks${buildQuery()}`);
    updateStats(data.stats);
    renderTasks(data.tasks || []);
  } catch (error) {
    tasksDOM.innerHTML =
      '<p class="empty-list">Couldn’t load tasks. Please try again.</p>';
  } finally {
    loadingDOM.style.visibility = 'hidden';
  }
};

const openModal = async (id) => {
  try {
    const {
      data: { task },
    } = await axios.get(`/api/v1/tasks/${id}`);

    editId.value = task._id;
    editName.value = task.name || '';
    editDescription.value = task.description || '';
    editPriority.value = task.priority || 'medium';
    editDue.value = toDateInput(task.dueDate);
    editCompleted.checked = Boolean(task.completed);
    editAlert.textContent = '';
    modal.hidden = false;
    editName.focus();
  } catch (error) {
    showAlert(formAlertDOM, 'Couldn’t open task for editing');
  }
};

const closeModal = () => {
  modal.hidden = true;
};

formDOM.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    name: taskInputDOM.value.trim(),
    priority: priorityDOM.value,
    description: descriptionDOM.value.trim(),
  };

  if (dueDOM.value) {
    payload.dueDate = dueDOM.value;
  }

  try {
    await axios.post('/api/v1/tasks', payload);
    formDOM.reset();
    priorityDOM.value = 'medium';
    showAlert(formAlertDOM, 'Task added', true);
    showTasks();
  } catch (error) {
    const msg =
      error.response?.data?.msg || 'Couldn’t add task. Please try again.';
    showAlert(formAlertDOM, msg);
  }
});

tasksDOM.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === 'delete') {
    try {
      await axios.delete(`/api/v1/tasks/${id}`);
      showTasks();
    } catch (error) {
      showAlert(formAlertDOM, 'Couldn’t delete task');
    }
  }

  if (action === 'edit') {
    openModal(id);
  }

  if (action === 'toggle') {
    const completed = btn.dataset.completed === 'true';
    try {
      await axios.patch(`/api/v1/tasks/${id}`, { completed: !completed });
      showTasks();
    } catch (error) {
      showAlert(formAlertDOM, 'Couldn’t update task');
    }
  }
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  editSubmit.textContent = 'Saving...';

  const payload = {
    name: editName.value.trim(),
    description: editDescription.value.trim(),
    priority: editPriority.value,
    completed: editCompleted.checked,
    dueDate: editDue.value || null,
  };

  try {
    await axios.patch(`/api/v1/tasks/${editId.value}`, payload);
    showAlert(editAlert, 'Changes saved', true);
    showTasks();
    setTimeout(closeModal, 700);
  } catch (error) {
    const msg =
      error.response?.data?.msg || 'Couldn’t save changes. Please try again.';
    showAlert(editAlert, msg);
  } finally {
    editSubmit.textContent = 'Save changes';
  }
});

modal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-modal]')) {
    closeModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});

filterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    filterChips.forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    currentFilter = chip.dataset.filter;
    showTasks();
  });
});

searchDOM.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(showTasks, 250);
});

sortDOM.addEventListener('change', showTasks);

clearCompletedBtn.addEventListener('click', async () => {
  try {
    const { data } = await axios.delete('/api/v1/tasks/clear-completed');
    showAlert(
      formAlertDOM,
      data.deletedCount
        ? `Cleared ${data.deletedCount} completed task${
            data.deletedCount === 1 ? '' : 's'
          }`
        : 'No completed tasks to clear',
      true
    );
    showTasks();
  } catch (error) {
    showAlert(formAlertDOM, 'Couldn’t clear completed tasks');
  }
});

showTasks();
