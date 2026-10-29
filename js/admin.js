// js/admin.js
(function () {
  var adminMainContainer = document.getElementById('adminMainContainer');
  var guardScreen = document.getElementById('guardScreen');
  var guardTitle = document.getElementById('guardTitle');
  var guardDesc = document.getElementById('guardDesc');
  var guardBtn = document.getElementById('guardBtn');

  function showGuardError(title, desc) {
    if (adminMainContainer) adminMainContainer.style.display = 'none';
    if (guardScreen) guardScreen.style.display = 'block';
    if (guardTitle) guardTitle.textContent = title;
    if (guardDesc) guardDesc.textContent = desc;
    if (guardBtn) guardBtn.style.display = 'inline-flex';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatDateTime(isoString) {
    if (!isoString) return 'TBD';
    var d = new Date(isoString);
    if (isNaN(d.getTime())) return escapeHtml(isoString);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    var minStr = minutes < 10 ? '0' + minutes : minutes;
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + hours + ':' + minStr + ' ' + ampm;
  }

  function setStatus(statusElId, message, type) {
    var el = document.getElementById(statusElId);
    if (!el) return;
    el.textContent = message;
    el.className = 'admin-status ' + type;
    setTimeout(function () {
      el.className = 'admin-status';
      el.textContent = '';
    }, 4000);
  }

  // =========================================================================
  // CONTENT (notes / pyqs / jobs / trending)
  // =========================================================================
  var contentForm = document.getElementById('contentForm');
  var contentSubmitBtn = document.getElementById('contentSubmitBtn');
  var contentTableBody = document.getElementById('contentTableBody');

  async function loadContent() {
    if (!contentTableBody) return;
    contentTableBody.innerHTML = '<tr><td colspan="5" class="table-empty">Loading content...</td></tr>';

    var res = await supabaseClient
      .from('content')
      .select('*')
      .order('created_at', { ascending: false });

    if (res.error) {
      contentTableBody.innerHTML = '<tr><td colspan="5" class="table-empty">Error: ' + escapeHtml(res.error.message) + '</td></tr>';
      return;
    }

    var rows = res.data || [];
    if (rows.length === 0) {
      contentTableBody.innerHTML = '<tr><td colspan="5" class="table-empty">No content yet.</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var subjSem = (row.subject || '') + (row.semester ? (' / ' + row.semester) : '');
      html +=
        '<tr>' +
        '<td>' + escapeHtml(row.type) + '</td>' +
        '<td>' + escapeHtml(row.title) + '</td>' +
        '<td>' + escapeHtml(subjSem || '-') + '</td>' +
        '<td>' + escapeHtml(formatDate(row.created_at)) + '</td>' +
        '<td><button type="button" class="btn-delete" data-id="' + escapeHtml(row.id) + '" data-table="content">Delete</button></td>' +
        '</tr>';
    }
    contentTableBody.innerHTML = html;
  }

  if (contentForm) {
    contentForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      contentSubmitBtn.disabled = true;
      contentSubmitBtn.textContent = 'Publishing...';

      var payload = {
        type: document.getElementById('contentType').value,
        title: document.getElementById('contentTitle').value.trim(),
        description: document.getElementById('contentDesc').value.trim() || null,
        subject: document.getElementById('contentSubject').value.trim() || null,
        semester: document.getElementById('contentSemester').value.trim() || null,
        external_link: document.getElementById('contentLink').value.trim() || null
      };

      if (!payload.title) {
        setStatus('contentStatus', 'Title is required.', 'error');
        contentSubmitBtn.disabled = false;
        contentSubmitBtn.textContent = 'Publish Content';
        return;
      }

      var res = await supabaseClient.from('content').insert(payload);

      contentSubmitBtn.disabled = false;
      contentSubmitBtn.textContent = 'Publish Content';

      if (res.error) {
        setStatus('contentStatus', res.error.message || 'Failed to publish.', 'error');
        return;
      }

      setStatus('contentStatus', 'Published successfully!', 'success');
      contentForm.reset();
      loadContent();
    });
  }

  // =========================================================================
  // PROJECTS
  // =========================================================================
  var projectForm = document.getElementById('projectForm');
  var projectSubmitBtn = document.getElementById('projectSubmitBtn');
  var projectTableBody = document.getElementById('projectTableBody');

  async function loadProjects() {
    if (!projectTableBody) return;
    projectTableBody.innerHTML = '<tr><td colspan="4" class="table-empty">Loading projects...</td></tr>';

    var res = await supabaseClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (res.error) {
      projectTableBody.innerHTML = '<tr><td colspan="4" class="table-empty">Error: ' + escapeHtml(res.error.message) + '</td></tr>';
      return;
    }

    var rows = res.data || [];
    if (rows.length === 0) {
      projectTableBody.innerHTML = '<tr><td colspan="4" class="table-empty">No projects yet.</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      html +=
        '<tr>' +
        '<td>' + escapeHtml(row.title) + '</td>' +
        '<td>' + escapeHtml(row.member_name || '-') + '</td>' +
        '<td>' + (row.github_link ? '<a href="' + escapeHtml(row.github_link) + '" target="_blank" rel="noopener noreferrer">Link</a>' : '-') + '</td>' +
        '<td><button type="button" class="btn-delete" data-id="' + escapeHtml(row.id) + '" data-table="projects">Delete</button></td>' +
        '</tr>';
    }
    projectTableBody.innerHTML = html;
  }

  if (projectForm) {
    projectForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      projectSubmitBtn.disabled = true;
      projectSubmitBtn.textContent = 'Adding...';

      var payload = {
        title: document.getElementById('projectTitle').value.trim(),
        member_name: document.getElementById('projectMember').value.trim(),
        description: document.getElementById('projectDesc').value.trim() || null,
        github_link: document.getElementById('projectGithub').value.trim()
      };

      if (!payload.title || !payload.member_name || !payload.github_link) {
        setStatus('projectStatus', 'Title, member name, and link are required.', 'error');
        projectSubmitBtn.disabled = false;
        projectSubmitBtn.textContent = 'Add Project';
        return;
      }

      var res = await supabaseClient.from('projects').insert(payload);

      projectSubmitBtn.disabled = false;
      projectSubmitBtn.textContent = 'Add Project';

      if (res.error) {
        setStatus('projectStatus', res.error.message || 'Failed to add project.', 'error');
        return;
      }

      setStatus('projectStatus', 'Project added!', 'success');
      projectForm.reset();
      loadProjects();
    });
  }

  // =========================================================================
  // EVENTS
  // =========================================================================
  var eventForm = document.getElementById('eventForm');
  var eventSubmitBtn = document.getElementById('eventSubmitBtn');
  var eventTableBody = document.getElementById('eventTableBody');

  async function loadEvents() {
    if (!eventTableBody) return;
    eventTableBody.innerHTML = '<tr><td colspan="4" class="table-empty">Loading events...</td></tr>';

    var res = await supabaseClient
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (res.error) {
      eventTableBody.innerHTML = '<tr><td colspan="4" class="table-empty">Error: ' + escapeHtml(res.error.message) + '</td></tr>';
      return;
    }

    var rows = res.data || [];
    if (rows.length === 0) {
      eventTableBody.innerHTML = '<tr><td colspan="4" class="table-empty">No events yet.</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      html +=
        '<tr>' +
        '<td>' + escapeHtml(row.title) + '</td>' +
        '<td>' + escapeHtml(formatDateTime(row.event_date)) + '</td>' +
        '<td>' + escapeHtml(row.location_or_link || '-') + '</td>' +
        '<td><button type="button" class="btn-delete" data-id="' + escapeHtml(row.id) + '" data-table="events">Delete</button></td>' +
        '</tr>';
    }
    eventTableBody.innerHTML = html;
  }

  if (eventForm) {
    eventForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      eventSubmitBtn.disabled = true;
      eventSubmitBtn.textContent = 'Creating...';

      var dateVal = document.getElementById('eventDate').value;
      var payload = {
        title: document.getElementById('eventTitle').value.trim(),
        event_date: dateVal ? new Date(dateVal).toISOString() : null,
        location_or_link: document.getElementById('eventLocation').value.trim(),
        description: document.getElementById('eventDesc').value.trim() || null
      };

      if (!payload.title || !payload.event_date || !payload.location_or_link) {
        setStatus('eventStatus', 'Title, date, and location/link are required.', 'error');
        eventSubmitBtn.disabled = false;
        eventSubmitBtn.textContent = 'Create Event';
        return;
      }

      var res = await supabaseClient.from('events').insert(payload);

      eventSubmitBtn.disabled = false;
      eventSubmitBtn.textContent = 'Create Event';

      if (res.error) {
        setStatus('eventStatus', res.error.message || 'Failed to create event.', 'error');
        return;
      }

      setStatus('eventStatus', 'Event created!', 'success');
      eventForm.reset();
      loadEvents();
    });
  }

  // =========================================================================
  // MEMBERS (read-only)
  // =========================================================================
  var membersTableBody = document.getElementById('membersTableBody');

  async function loadMembers() {
    if (!membersTableBody) return;
    membersTableBody.innerHTML = '<tr><td colspan="5" class="table-empty">Loading members...</td></tr>';

    var res = await supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (res.error) {
      membersTableBody.innerHTML = '<tr><td colspan="5" class="table-empty">Error: ' + escapeHtml(res.error.message) + '</td></tr>';
      return;
    }

    var rows = res.data || [];
    if (rows.length === 0) {
      membersTableBody.innerHTML = '<tr><td colspan="5" class="table-empty">No members yet.</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      html +=
        '<tr>' +
        '<td>' + escapeHtml(row.full_name || '-') + '</td>' +
        '<td>' + escapeHtml((row.role || 'member').toUpperCase()) + '</td>' +
        '<td>' + escapeHtml(row.course || '-') + '</td>' +
        '<td>' + escapeHtml(row.college || '-') + '</td>' +
        '<td>' + escapeHtml(formatDate(row.created_at)) + '</td>' +
        '</tr>';
    }
    membersTableBody.innerHTML = html;
  }

  // =========================================================================
  // DELETE HANDLER (event delegation, works for all three tables)
  // =========================================================================
  document.addEventListener('click', async function (e) {
    var btn = e.target.closest ? e.target.closest('.btn-delete') : null;
    if (!btn) return;

    var id = btn.getAttribute('data-id');
    var table = btn.getAttribute('data-table');
    if (!id || !table) return;

    var confirmed = window.confirm('Delete this item? This cannot be undone.');
    if (!confirmed) return;

    btn.disabled = true;
    btn.textContent = '...';

    var res = await supabaseClient.from(table).delete().eq('id', id);

    if (res.error) {
      alert('Delete failed: ' + res.error.message);
      btn.disabled = false;
      btn.textContent = 'Delete';
      return;
    }

    if (table === 'content') loadContent();
    if (table === 'projects') loadProjects();
    if (table === 'events') loadEvents();
  });

  // =========================================================================
  // GUARD + INIT
  // =========================================================================
  async function initAdmin() {
    if (typeof supabaseClient === 'undefined') {
      showGuardError('Connection Error', 'Supabase client is not loaded properly.');
      return;
    }

    var sessionRes = await supabaseClient.auth.getSession();
    var session = sessionRes && sessionRes.data ? sessionRes.data.session : null;

    if (!session || !session.user) {
      window.location.href = 'signin.html';
      return;
    }

    var profileRes = await supabaseClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

    var profile = profileRes.data;
    if (!profile || profile.role !== 'admin') {
      showGuardError(
        'Access Denied',
        'Your account does not have admin privileges. Only users with profiles.role = "admin" can access this panel.'
      );
      return;
    }

    if (guardScreen) guardScreen.style.display = 'none';
    if (adminMainContainer) adminMainContainer.style.display = 'block';

    loadContent();
    loadProjects();
    loadEvents();
    loadMembers();
  }

  initAdmin();
})();
