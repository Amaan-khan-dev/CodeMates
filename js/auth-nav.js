// js/auth-nav.js
(function () {
  // 1. Theme Toggle Logic (Dark Default)
  var rootEl = document.documentElement;
  var themeToggleBtn = document.getElementById('themeToggle');
  var themeLabel = document.getElementById('themeLabel');
  function applyTheme(theme) {
    rootEl.setAttribute('data-theme', theme);
    localStorage.setItem('codemates-theme', theme);
    if (themeLabel) {
      themeLabel.textContent = theme === 'dark' ? 'LIGHT' : 'DARK';
    }
  }
  var savedTheme = localStorage.getItem('codemates-theme') || 'dark';
  applyTheme(savedTheme);
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      var currentTheme = rootEl.getAttribute('data-theme') || 'dark';
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

  // 2. Mobile Menu Toggle Logic
  var menuToggleBtn = document.getElementById('menuToggle');
  var navMenu = document.getElementById('navMenu');
  if (menuToggleBtn && navMenu) {
    menuToggleBtn.addEventListener('click', function () {
      var isOpen = navMenu.classList.toggle('open');
      menuToggleBtn.textContent = isOpen ? 'CLOSE' : 'MENU';
    });
  }

  // 3. Highlight Active Page Link
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  var navLinks = document.querySelectorAll('.nav-item-link');
  for (var i = 0; i < navLinks.length; i++) {
    var linkHref = navLinks[i].getAttribute('href');
    if (linkHref === currentPath) {
      navLinks[i].classList.add('active');
    }
  }

  // 4. Auth State & Profile Modal Logic
  var authNavContainer = document.getElementById('authNav');
  if (!authNavContainer || typeof supabaseClient === 'undefined') return;

  function ensureProfileModal() {
    var modal = document.getElementById('cmProfileModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'cmProfileModal';
    modal.className = 'cm-modal-backdrop';
    modal.innerHTML =
      '<div class="cm-modal-card" role="dialog" aria-modal="true" aria-labelledby="cmModalTitle">' +
      '<div class="cm-modal-header">' +
      '<h2 class="cm-modal-title" id="cmModalTitle">My Profile</h2>' +
      '<button type="button" class="cm-modal-close" id="cmCloseModal">ESC</button>' +
      '</div>' +
      '<div id="cmProfileStatus" class="cm-modal-status"></div>' +
      '<form id="cmProfileForm">' +
      '<div class="cm-modal-field">' +
      '<label for="cmFullName">Full Name</label>' +
      '<input type="text" id="cmFullName" required />' +
      '</div>' +
      '<div class="cm-modal-field">' +
      '<label for="cmCourse">Course</label>' +
      '<select id="cmCourse" required>' +
      '<option value="BCA">BCA</option>' +
      '<option value="BCS">BCS</option>' +
      '<option value="BCSIT">BCSIT</option>' +
      '<option value="BTech">BTech</option>' +
      '<option value="BBA">BBA</option>' +
      '<option value="Other">Other</option>' +
      '</select>' +
      '</div>' +
      '<div class="cm-modal-field">' +
      '<label for="cmCollege">College</label>' +
      '<input type="text" id="cmCollege" required />' +
      '</div>' +
      '<div class="cm-modal-field">' +
      '<label for="cmGithub">GitHub URL</label>' +
      '<input type="url" id="cmGithub" placeholder="https://github.com/username" />' +
      '</div>' +
      '<button type="submit" class="cm-modal-save" id="cmSaveProfileBtn">Save Changes</button>' +
      '</form>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('cmCloseModal').addEventListener('click', function () {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
    return modal;
  }

  async function openProfileModal(user) {
    var modal = ensureProfileModal();
    var statusEl = document.getElementById('cmProfileStatus');
    var saveBtn = document.getElementById('cmSaveProfileBtn');
    var form = document.getElementById('cmProfileForm');
    statusEl.style.display = 'none';
    modal.classList.add('open');

    var res = await supabaseClient
      .from('profiles')
      .select('full_name, course, college, github_url')
      .eq('id', user.id)
      .single();
    var profile = res.data;
    var meta = user.user_metadata || {};
    document.getElementById('cmFullName').value = (profile && profile.full_name) ? profile.full_name : (meta.full_name || '');
    document.getElementById('cmCourse').value = (profile && profile.course) ? profile.course : (meta.course || 'BCA');
    document.getElementById('cmCollege').value = (profile && profile.college) ? profile.college : (meta.college || '');
    document.getElementById('cmGithub').value = (profile && profile.github_url) ? profile.github_url : '';

    form.onsubmit = async function (e) {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      statusEl.style.display = 'none';
      var updates = {
        full_name: document.getElementById('cmFullName').value.trim(),
        course: document.getElementById('cmCourse').value,
        college: document.getElementById('cmCollege').value.trim(),
        github_url: document.getElementById('cmGithub').value.trim() || null
      };
      var updateRes = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
      statusEl.style.display = 'block';
      if (updateRes.error) {
        statusEl.style.color = '#F87171';
        statusEl.textContent = updateRes.error.message || 'Failed to update profile.';
      } else {
        statusEl.style.color = '#34D399';
        statusEl.textContent = 'Profile updated!';
      }
    };
  }

  async function renderAuthNav(session) {
    if (!session || !session.user) {
      authNavContainer.innerHTML =
        '<a href="signin.html" class="nav-link">Sign In</a>' +
        '<a href="signup.html" class="nav-btn-primary">Sign Up</a>';
      return;
    }
    var res = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    var isAdmin = res.data && res.data.role === 'admin';
    var adminLink = isAdmin ? '<a href="admin.html" class="nav-link" style="color: var(--accent);">Admin</a>' : '';
    authNavContainer.innerHTML =
      adminLink +
      '<button type="button" class="nav-link" id="navProfileBtn">My Profile</button>' +
      '<button type="button" class="nav-link" id="navSignOutBtn">Sign Out</button>';
    var profileBtn = document.getElementById('navProfileBtn');
    var signOutBtn = document.getElementById('navSignOutBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', function () {
        openProfileModal(session.user);
      });
    }
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async function () {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
      });
    }
  }

  supabaseClient.auth.getSession().then(function (result) {
    var session = result.data ? result.data.session : null;
    renderAuthNav(session);
  });
  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    renderAuthNav(session);
  });
})();
