// ===== DOM 元素 =====
const todoInput = document.getElementById('todo-input');
const btnImportFile = document.getElementById('btn-import-file');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const emptyState = document.getElementById('empty-state');
const emptyIcon = document.getElementById('empty-icon');
const emptyText = document.getElementById('empty-text');
const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');
const settingsToggle = document.getElementById('settings-toggle');
const settingsContent = document.getElementById('settings-content');
const settingsArrow = document.getElementById('settings-arrow');
const autoLaunchToggle = document.getElementById('auto-launch-toggle');
const alwaysOnTopToggle = document.getElementById('always-on-top-toggle');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValue = document.getElementById('font-size-value');
const tabBar = document.getElementById('tab-bar');
const tabIndicator = document.getElementById('tab-indicator');
const completedBadge = document.getElementById('completed-badge');
const pendingBadge = document.getElementById('pending-badge');
const btnExport = document.getElementById('btn-export');
const autoDeleteSelect = document.getElementById('auto-delete-select');
const sortBySelect = document.getElementById('sort-by-select');
const languageSelect = document.getElementById('language-select');
const importModalOverlay = document.getElementById('import-modal-overlay');
const importTextarea = document.getElementById('import-textarea');
const btnImportFromFile = document.getElementById('btn-import-from-file');
const btnConfirmImport = document.getElementById('btn-confirm-import');
const modalCloseBtn = document.getElementById('modal-close-btn');
const pinBtn = document.getElementById('btn-pin');

// ===== 数据 =====
let todos = [];
let settings = { autoLaunch: false, alwaysOnTop: true, opacity: 0.75, theme: 'system', fontSize: 14, autoDeleteDays: 0, sortBy: 'createdAt', language: 'system' };

// ===== i18n =====
const locales = { 'zh-CN': zhCN, 'en': en };
let currentLocale = zhCN; // 当前语言包引用

/**
 * 获取当前语言的翻译文本
 * @param {string} key - 语言键
 * @param {object} params - 替换参数，如 { days: 7 }
 */
function t(key, params) {
  let text = currentLocale[key] || zhCN[key] || key;
  if (params) {
    Object.keys(params).forEach(k => {
      text = text.replace(`{${k}}`, params[k]);
    });
  }
  return text;
}

/**
 * 解析实际语言代码：'system' 时根据浏览器语言判断
 */
function resolveLanguage(lang) {
  if (lang === 'system') {
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) return 'zh-CN';
    return 'en';
  }
  return lang;
}

/**
 * 应用语言到界面
 */
function applyLocale() {
  const lang = resolveLanguage(settings.language || 'system');
  currentLocale = locales[lang] || zhCN;

  // 更新 html lang 属性
  document.documentElement.lang = lang;

  // 标题栏
  document.querySelector('.title-text').textContent = t('title');
  pinBtn.title = t('pinTooltip');
  btnMinimize.title = t('minimizeTooltip');
  btnClose.title = t('closeTooltip');

  // 输入栏
  todoInput.placeholder = t('inputPlaceholder');
  btnImportFile.title = t('importFileTooltip');

  // Tab 标签
  document.querySelector('[data-tab="pending"] .tab-label').textContent = t('tabPending');
  document.querySelector('[data-tab="completed"] .tab-label').textContent = t('tabCompleted');

  // 空状态（如果当前正在显示）
  updateEmptyState();

  // 设置面板
  document.querySelector('#settings-toggle span:first-child').textContent = t('settingsToggle');

  // 设置项标签 - 使用 data-i18n 属性
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });

  // 主题按钮
  document.querySelector('[data-theme="system"]').textContent = t('themeSystem');
  document.querySelector('[data-theme="light"]').textContent = t('themeLight');
  document.querySelector('[data-theme="dark"]').textContent = t('themeDark');

  // 排序下拉框
  sortBySelect.options[0].textContent = t('sortByCreatedAt');
  sortBySelect.options[1].textContent = t('sortByDueDate');

  // 自动清理下拉框
  autoDeleteSelect.options[0].textContent = t('autoDeleteNever');
  autoDeleteSelect.options[1].textContent = t('autoDeleteDays', { days: 7 });
  autoDeleteSelect.options[2].textContent = t('autoDeleteDays', { days: 30 });
  autoDeleteSelect.options[3].textContent = t('autoDeleteDays', { days: 90 });
  autoDeleteSelect.options[4].textContent = t('autoDeleteDays', { days: 180 });

  // 语言下拉框
  languageSelect.options[0].textContent = t('languageSystem');
  languageSelect.options[1].textContent = t('languageZhCN');
  languageSelect.options[2].textContent = t('languageEn');

  // 导出按钮
  btnExport.textContent = t('exportData');

  // 模态框
  document.querySelector('.modal-title').textContent = t('modalTitle');
  importTextarea.placeholder = t('modalPlaceholder');
  btnImportFromFile.textContent = t('importFromFile');
  btnConfirmImport.textContent = t('confirmAdd');

  // 通知主进程更新托盘菜单和对话框语言
  window.electronAPI.updateLocale({
    trayTooltip: t('trayTooltip'),
    trayShow: t('trayShow'),
    trayQuit: t('trayQuit'),
    importDialogTitle: t('importDialogTitle'),
    textFile: t('textFile'),
    exportDialogTitle: t('exportDialogTitle'),
    exportDefaultName: t('exportDefaultName')
  });

  // 重新渲染列表（待办条目中的文本也需要更新）
  renderList();
}
let currentTab = 'pending'; // 当前激活的 Tab

// ===== 工具函数 =====
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[1]}-${parts[2]}`;
}

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr + 'T23:59:59');
  return due < new Date();
}

/**
 * 根据截止时间与当前时间的差值返回对应的 CSS class
 * - 剩余时间 > 7天: due-safe (绿色)
 * - 剩余时间 1~7天: due-warning (橙黄色)
 * - 剩余时间 < 1天(含已过期): due-urgent (红色)
 */
function getDueDateClass(dueDateStr) {
  if (!dueDateStr) return '';
  const now = new Date();
  const due = new Date(dueDateStr + 'T23:59:59');
  const diffMs = due - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return 'due-urgent';
  if (diffDays <= 7) return 'due-warning';
  return 'due-safe';
}

// ===== 初始化 =====
async function init() {
  todos = await window.electronAPI.getTodos() || [];
  settings = await window.electronAPI.getSettings() || { autoLaunch: false, alwaysOnTop: true, language: 'system' };

  autoLaunchToggle.checked = settings.autoLaunch;
  alwaysOnTopToggle.checked = settings.alwaysOnTop;
  pinBtn.classList.toggle('active', settings.alwaysOnTop);

  // 初始化透明度
  const opacity = settings.opacity !== undefined ? settings.opacity : 0.75;
  opacitySlider.value = opacity;
  opacityValue.textContent = Math.round(opacity * 100) + '%';
  document.documentElement.style.setProperty('--body-bg-opacity', opacity);
  await window.electronAPI.setOpacity(opacity);

  // 初始化字体大小
  const fontSize = settings.fontSize !== undefined ? settings.fontSize : 14;
  fontSizeSlider.value = fontSize;
  fontSizeValue.textContent = fontSize + 'px';
  document.documentElement.style.setProperty('--font-size', fontSize + 'px');

  // 初始化主题
  applyTheme(settings.theme || 'system');
  initSystemThemeListener();

  // 初始化排序方式
  const sortBy = settings.sortBy || 'createdAt';
  sortBySelect.value = sortBy;

  // 初始化语言
  const language = settings.language || 'system';
  languageSelect.value = language;
  applyLocale();

  // 初始化自动清理天数
  const autoDeleteDays = settings.autoDeleteDays !== undefined ? settings.autoDeleteDays : 0;
  autoDeleteSelect.value = autoDeleteDays;

  // 启动时执行一次自动清理
  await cleanupCompletedTodos();

  renderList();
  updateBadge();
  updateTabIndicator();
  bindEvents();
}

// ===== 绑定事件 =====
function bindEvents() {
  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodoFromInput();
    }
  });

  btnMinimize.addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
  });

  btnClose.addEventListener('click', () => {
    window.electronAPI.closeWindow();
  });

  settingsToggle.addEventListener('click', () => {
    const isOpen = settingsContent.classList.toggle('open');
    settingsArrow.classList.toggle('open', isOpen);
  });

  autoLaunchToggle.addEventListener('change', async () => {
    const enable = autoLaunchToggle.checked;
    const result = await window.electronAPI.toggleAutoLaunch(enable);
    settings.autoLaunch = result;
  });

  pinBtn.addEventListener('click', async () => {
    settings.alwaysOnTop = !settings.alwaysOnTop;
    pinBtn.classList.toggle('active', settings.alwaysOnTop);
    alwaysOnTopToggle.checked = settings.alwaysOnTop;
    await window.electronAPI.saveSettings(settings);
  });

  alwaysOnTopToggle.addEventListener('change', async () => {
    settings.alwaysOnTop = alwaysOnTopToggle.checked;
    pinBtn.classList.toggle('active', settings.alwaysOnTop);
    await window.electronAPI.saveSettings(settings);
  });

  opacitySlider.addEventListener('input', async () => {
    const opacity = parseFloat(opacitySlider.value);
    opacityValue.textContent = Math.round(opacity * 100) + '%';
    document.documentElement.style.setProperty('--body-bg-opacity', opacity);
    settings.opacity = opacity;
    await window.electronAPI.setOpacity(opacity);
    await window.electronAPI.saveSettings(settings);
  });

  fontSizeSlider.addEventListener('input', async () => {
    const fontSize = parseInt(fontSizeSlider.value);
    fontSizeValue.textContent = fontSize + 'px';
    document.documentElement.style.setProperty('--font-size', fontSize + 'px');
    settings.fontSize = fontSize;
    await window.electronAPI.saveSettings(settings);
  });

  // Tab 切换事件
  tabBar.addEventListener('click', (e) => {
    const tabItem = e.target.closest('.tab-item');
    if (!tabItem) return;
    const tab = tabItem.dataset.tab;
    if (tab === currentTab) return;
    switchTab(tab);
  });

  // 排序方式下拉框
  sortBySelect.addEventListener('change', async () => {
    settings.sortBy = sortBySelect.value;
    await window.electronAPI.saveSettings(settings);
    renderList();
  });

  // 语言下拉框
  languageSelect.addEventListener('change', async () => {
    settings.language = languageSelect.value;
    await window.electronAPI.saveSettings(settings);
    applyLocale();
  });

  // 自动清理下拉框
  autoDeleteSelect.addEventListener('change', async () => {
    settings.autoDeleteDays = parseInt(autoDeleteSelect.value);
    await window.electronAPI.saveSettings(settings);
  });

  // 导入文件按钮 → 打开模态对话框
  btnImportFile.addEventListener('click', () => {
    importModalOverlay.classList.remove('hidden');
    importTextarea.value = '';
    importTextarea.focus();
  });

  // 关闭模态框
  function closeImportModal() {
    importModalOverlay.classList.add('hidden');
    importTextarea.value = '';
  }

  modalCloseBtn.addEventListener('click', closeImportModal);
  importModalOverlay.addEventListener('click', (e) => {
    if (e.target === importModalOverlay) closeImportModal();
  });

  // 从txt文件导入到textarea
  btnImportFromFile.addEventListener('click', async () => {
    const content = await window.electronAPI.importFile();
    if (content) {
      importTextarea.value = content;
    }
  });

  // 确认添加
  btnConfirmImport.addEventListener('click', () => {
    const content = importTextarea.value;
    if (!content.trim()) return;

    const lines = content.split(/\r?\n/);
    let importCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const cleaned = trimmed.replace(/^\d+[、.．)）]\s*/, '');
      if (!cleaned) continue;

      const todo = {
        id: generateId(),
        content: cleaned,
        createdAt: Date.now(),
        dueDate: null,
        completed: false,
        completedAt: null
      };
      todos.unshift(todo);
      importCount++;
    }

    if (importCount > 0) {
      saveAndRender();
    }
    closeImportModal();
  });

  // 导出按钮
  btnExport.addEventListener('click', exportTodos);
}

// ===== 添加待办 =====
function addTodoFromInput() {
  const content = todoInput.value.trim();
  if (!content) return;

  const todo = {
    id: generateId(),
    content: content,
    createdAt: Date.now(),
    dueDate: null,
    completed: false,
    completedAt: null
  };

  todos.unshift(todo);
  todoInput.value = '';
  saveAndRender();
}

// ===== 切换完成状态（带滑出动效）=====
function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  // 在待办列表中找到对应 DOM 元素
  const itemEl = pendingList.querySelector(`[data-id="${id}"]`);
  if (itemEl) {
    // 播放向右滑出动效
    itemEl.classList.add('sliding-out');
    itemEl.addEventListener('animationend', () => {
      finishToggleTodo(id);
    }, { once: true });
    // 兜底：防止 animationend 未触发
    setTimeout(() => {
      finishToggleTodo(id);
    }, 350);
  } else {
    finishToggleTodo(id);
  }
}

async function finishToggleTodo(id) {
  // 防止重复执行
  const todo = todos.find(t => t.id === id);
  if (!todo || todo.completed) return;

  todo.completed = true;
  todo.completedAt = Date.now();
  await saveAndRender();
}

// ===== 取消完成（移回待办列表）=====
async function restoreTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  todo.completed = false;
  todo.completedAt = null;
  await saveAndRender();
}

// ===== 删除待办 =====
async function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  await saveAndRender();
}

// ===== 保存并渲染 =====
async function saveAndRender() {
  await window.electronAPI.saveTodos(todos);
  renderList();
  updateBadge();
}

// ===== Tab 切换逻辑 =====
function switchTab(tab) {
  currentTab = tab;

  // 更新 Tab 项激活状态
  const tabItems = tabBar.querySelectorAll('.tab-item');
  tabItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  // 切换列表显示
  if (tab === 'pending') {
    pendingList.classList.add('active');
    pendingList.classList.remove('slide-left');
    completedList.classList.remove('active');
    completedList.classList.add('slide-left');
  } else {
    completedList.classList.add('active');
    completedList.classList.remove('slide-left');
    pendingList.classList.remove('active');
    pendingList.classList.add('slide-left');
  }

  updateTabIndicator();
  updateEmptyState();
}

// ===== 更新 Tab 指示条位置 =====
function updateTabIndicator() {
  const activeTab = tabBar.querySelector('.tab-item.active');
  if (!activeTab) return;
  const barRect = tabBar.getBoundingClientRect();
  const tabRect = activeTab.getBoundingClientRect();
  tabIndicator.style.left = (tabRect.left - barRect.left) + 'px';
  tabIndicator.style.width = tabRect.width + 'px';
}

// ===== 更新角标 =====
function updateBadge() {
  const completedCount = todos.filter(t => t.completed).length;
  if (completedCount > 0) {
    completedBadge.textContent = completedCount;
    completedBadge.style.display = 'inline-flex';
  } else {
    completedBadge.style.display = 'none';
  }

  const pendingCount = todos.filter(t => !t.completed).length;
  if (pendingCount > 0) {
    pendingBadge.textContent = pendingCount;
    pendingBadge.style.display = 'inline-flex';
  } else {
    pendingBadge.style.display = 'none';
  }
}

// ===== 更新空状态 =====
function updateEmptyState() {
  const pending = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);

  if (currentTab === 'pending' && pending.length === 0) {
    emptyState.classList.remove('hidden');
    emptyIcon.textContent = '📝';
    emptyText.textContent = t('emptyPending');
  } else if (currentTab === 'completed' && completed.length === 0) {
    emptyState.classList.remove('hidden');
    emptyIcon.textContent = '✅';
    emptyText.textContent = t('emptyCompleted');
  } else {
    emptyState.classList.add('hidden');
  }
}

// ===== 渲染列表 =====
function renderList() {
  renderPendingList();
  renderCompletedList();
  updateEmptyState();
}

// ===== 排序待办列表 =====
function sortPendingList(pending) {
  const sortBy = settings.sortBy || 'createdAt';

  if (sortBy === 'dueDate') {
    // 按截止时间排序：有截止时间的排前面（从近到远），没有的排底部
    const withDue = pending.filter(t => t.dueDate).sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate); // 截止时间近的在前
      }
      return b.createdAt - a.createdAt; // 同一截止时间，新的在前
    });
    const withoutDue = pending.filter(t => !t.dueDate).sort((a, b) => b.createdAt - a.createdAt);
    return [...withDue, ...withoutDue];
  }

  // 默认按创建时间：最新的在上面
  return pending.sort((a, b) => b.createdAt - a.createdAt);
}

// ===== 渲染待办列表 =====
function renderPendingList() {
  pendingList.innerHTML = '';
  const pending = sortPendingList(todos.filter(t => !t.completed));

  pending.forEach(todo => {
    pendingList.appendChild(createPendingElement(todo));
  });
}

// ===== 渲染已完成列表 =====
function renderCompletedList() {
  completedList.innerHTML = '';
  const completed = todos.filter(t => t.completed).sort((a, b) => b.completedAt - a.completedAt);

  completed.forEach(todo => {
    completedList.appendChild(createCompletedElement(todo));
  });
}

// ===== 创建待办条目元素 =====
function createPendingElement(todo) {
  const item = document.createElement('div');
  item.className = 'todo-item';
  item.dataset.id = todo.id;

  // 勾选框
  const checkbox = document.createElement('div');
  checkbox.className = 'todo-checkbox';
  checkbox.addEventListener('click', () => toggleTodo(todo.id));

  // 内容区
  const body = document.createElement('div');
  body.className = 'todo-body';

  const content = document.createElement('div');
  content.className = 'todo-content';
  content.textContent = todo.content;

  // 行内编辑输入框（默认隐藏）
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input hidden';
  editInput.value = todo.content;

  // 点击内容文字 → 进入编辑模式
  content.addEventListener('click', () => {
    editInput.value = todo.content;
    content.classList.add('editing');
    editInput.classList.remove('hidden');
    editInput.focus();
    editInput.select();
  });

  // 编辑内容保存逻辑
  function saveContentEdit() {
    const newContent = editInput.value.trim();
    if (newContent && newContent !== todo.content) {
      todo.content = newContent;
      content.textContent = newContent;
      saveAndRender();
    }
    content.classList.remove('editing');
    editInput.classList.add('hidden');
  }

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editInput.blur();
    } else if (e.key === 'Escape') {
      editInput.value = todo.content; // 取消编辑，恢复原内容
      editInput.blur();
    }
  });

  editInput.addEventListener('blur', () => {
    // 如果内容为空，恢复原内容
    if (!editInput.value.trim()) {
      editInput.value = todo.content;
    }
    saveContentEdit();
  });

  body.appendChild(content);
  body.appendChild(editInput);

  // 元信息
  const meta = document.createElement('div');
  meta.className = 'todo-meta';

  const createdSpan = document.createElement('span');
  createdSpan.textContent = formatDateTime(todo.createdAt);
  meta.appendChild(createdSpan);

  if (todo.dueDate) {
    const dueSpan = document.createElement('span');
    dueSpan.className = 'todo-due ' + getDueDateClass(todo.dueDate);
    dueSpan.textContent = t('duePrefix') + formatDate(todo.dueDate);

    // 点击截止时间 → 进入日期编辑模式
    dueSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.className = 'todo-edit-date';
      dateInput.value = todo.dueDate;

      // 日期变更保存
      function saveDateEdit() {
        const newDate = dateInput.value;
        if (newDate && newDate !== todo.dueDate) {
          todo.dueDate = newDate;
          saveAndRender();
        } else {
          // 恢复显示
          dueSpan.style.display = '';
          if (dateInput.parentNode) dateInput.remove();
        }
      }

      dateInput.addEventListener('change', saveDateEdit);
      dateInput.addEventListener('blur', () => {
        // blur 时如果没变，恢复原显示
        if (!dateInput.value || dateInput.value === todo.dueDate) {
          dueSpan.style.display = '';
          if (dateInput.parentNode) dateInput.remove();
        }
      });

      dateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dueSpan.style.display = '';
          if (dateInput.parentNode) dateInput.remove();
        }
      });

      dueSpan.style.display = 'none';
      meta.insertBefore(dateInput, dueSpan.nextSibling);
      dateInput.focus();
      dateInput.showPicker && dateInput.showPicker();
    });

    meta.appendChild(dueSpan);
  } else {
    // 没有截止时间时显示“添加日期”按钮
    const addDateBtn = document.createElement('button');
    addDateBtn.className = 'todo-add-date';
    addDateBtn.textContent = t('addDate');
    addDateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.className = 'todo-edit-date';

      function saveDateEdit() {
        const newDate = dateInput.value;
        if (newDate) {
          todo.dueDate = newDate;
          saveAndRender();
        } else {
          addDateBtn.style.display = '';
          if (dateInput.parentNode) dateInput.remove();
        }
      }

      dateInput.addEventListener('change', saveDateEdit);
      dateInput.addEventListener('blur', () => {
        if (!dateInput.value) {
          addDateBtn.style.display = '';
          if (dateInput.parentNode) dateInput.remove();
        }
      });

      dateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          addDateBtn.style.display = '';
          if (dateInput.parentNode) dateInput.remove();
        }
      });

      addDateBtn.style.display = 'none';
      meta.insertBefore(dateInput, addDateBtn.nextSibling);
      dateInput.focus();
      dateInput.showPicker && dateInput.showPicker();
    });

    meta.appendChild(addDateBtn);
  }

  body.appendChild(meta);

  // 删除按钮
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'todo-delete';
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  item.appendChild(checkbox);
  item.appendChild(body);
  item.appendChild(deleteBtn);

  return item;
}

// ===== 创建已完成条目元素 =====
function createCompletedElement(todo) {
  const item = document.createElement('div');
  item.className = 'todo-item completed-item';
  item.dataset.id = todo.id;

  // 勾选框（已勾选状态）
  const checkbox = document.createElement('div');
  checkbox.className = 'todo-checkbox';

  // 内容区
  const body = document.createElement('div');
  body.className = 'todo-body';

  const content = document.createElement('div');
  content.className = 'todo-content';
  content.textContent = todo.content;
  body.appendChild(content);

  // 完成时间
  const meta = document.createElement('div');
  meta.className = 'todo-meta';

  if (todo.completedAt) {
    const timeSpan = document.createElement('span');
    timeSpan.className = 'todo-completed-time';
    timeSpan.textContent = t('completedAt') + formatDateTime(todo.completedAt);
    meta.appendChild(timeSpan);
  }

  body.appendChild(meta);

  // 恢复按钮
  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'todo-restore';
  restoreBtn.textContent = '↩';
  restoreBtn.title = t('restoreTooltip');
  restoreBtn.addEventListener('click', () => restoreTodo(todo.id));

  // 删除按钮
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'todo-delete';
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  // 按钮容器
  const actions = document.createElement('div');
  actions.className = 'todo-actions';
  actions.appendChild(restoreBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(checkbox);
  item.appendChild(body);
  item.appendChild(actions);

  return item;
}

// ===== 自动清理已完成待办 =====
async function cleanupCompletedTodos() {
  const days = settings.autoDeleteDays || 0;
  if (days <= 0) return;

  const now = Date.now();
  const thresholdMs = days * 24 * 60 * 60 * 1000;
  const beforeCount = todos.length;

  todos = todos.filter(todo => {
    if (!todo.completed || !todo.completedAt) return true;
    return (now - todo.completedAt) < thresholdMs;
  });

  const deletedCount = beforeCount - todos.length;
  if (deletedCount > 0) {
    await window.electronAPI.saveTodos(todos);
  }
}

// ===== 导出待办 =====
async function exportTodos() {
  const pending = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed).sort((a, b) => b.completedAt - a.completedAt);

  let text = '';

  // 待办部分
  text += `=== ${t('exportPending')} ===\n`;
  if (pending.length === 0) {
    text += t('exportNone') + '\n';
  } else {
    pending.forEach((todo, i) => {
      let line = `${i + 1}. ${todo.content} [${t('exportCreatedAt')}: ${formatDateTime(todo.createdAt)}]`;
      if (todo.dueDate) {
        line += ` [${t('exportDueDate')}: ${formatDate(todo.dueDate)}]`;
      }
      text += line + '\n';
    });
  }

  text += '\n';

  // 已完成部分
  text += `=== ${t('exportCompleted')} ===\n`;
  if (completed.length === 0) {
    text += t('exportNone') + '\n';
  } else {
    completed.forEach((todo, i) => {
      let line = `${i + 1}. ${todo.content}`;
      if (todo.completedAt) {
        line += ` [${t('exportCompletedAt')}: ${formatDateTime(todo.completedAt)}]`;
      }
      text += line + '\n';
    });
  }

  await window.electronAPI.exportFile(text);
}

// ===== 主题切换 =====
let systemThemeMediaQuery = null;

/**
 * 应用主题：根据 theme 值设置 body 的 dark-theme class 和按钮激活状态
 * @param {'system' | 'light' | 'dark'} theme
 */
function applyTheme(theme) {
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.body.classList.toggle('dark-theme', isDark);

  // 更新按钮激活状态
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

/**
 * 初始化系统主题变化监听器
 */
function initSystemThemeListener() {
  if (systemThemeMediaQuery) {
    systemThemeMediaQuery.removeEventListener('change', onSystemThemeChange);
  }
  systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeMediaQuery.addEventListener('change', onSystemThemeChange);
}

/**
 * 系统主题变化时的回调
 */
function onSystemThemeChange() {
  if (settings.theme === 'system') {
    applyTheme('system');
  }
}

/**
 * 绑定主题按钮点击事件
 */
function bindThemeButtons() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const theme = btn.dataset.theme;
      settings.theme = theme;
      applyTheme(theme);
      await window.electronAPI.saveSettings(settings);
    });
  });
}

// ===== 启动 =====
init();
bindThemeButtons();

// 每小时刷新待办列表，更新截止时间颜色
setInterval(() => renderPendingList(), 3600000);

// 窗口从隐藏恢复时也刷新一次
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderPendingList();
});
