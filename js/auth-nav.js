// js/auth-nav.js
(function () {
  const authNavContainer = document.getElementById('authNav');
  if (!authNavContainer || typeof supabaseClient === 'undefined') return;

  function injectProfileModalStyles() {
    if (document.getElementById('cm-profile-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-profile-modal-styles';
    style.textContent =
      '.cm-modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65); display: none; align-items: center; justify-content: center; padding: 1rem; z-index: 999; }' +
      '.cm-modal-backdrop.open { display: flex; }' +
      '.cm-modal-card { width: 100%; max-width: 420px; background: var(--card, #1C1F27); border: 1px solid var(--border, #262A34); border-radius: 10px; padding: 1.5rem; color: var(--text, #ECECEC); }' +
      '.cm-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }' +
      '.cm-modal-title { font-family: "Manrope", sans-serif; font-size: 1.2rem; font-weight: 800; }' +
      '.cm-modal-close { background: none; border: 1px solid var(--border, #262A34); color: var(--muted, #8B92A1); border-radius: 8px; padding: 0.25rem 0.55rem; cursor: pointer; font-family: "JetBrains Mono", monospace; font-size: 0.75rem; }' +
      '.cm-modal-field { margin-bottom: 0.9rem; }' +
      '.cm-modal-field label { display: block; font-family: "JetBrains Mono", monospace; font-size: 0.72rem; font-weight: 500; color: var(--text, #ECECEC); margin-bottom: 0.35rem; text-transform: uppercase; }' +
      '.cm-modal-field input, .cm-modal-field select { width: 100%; background: var(--bg, #14161C); color: var(--text, #ECECEC); border: 1px solid var(--border, #262A34); border-radius: 8px; padding: 0.6rem 0.75rem; font-family: "Inter", sans-serif; font-size: 0.875rem; outline: none; }' +
      '.cm-modal-field input:focus, .cm-modal-field select:focus { border-color: var(--accent, #FF6B4A); }' +
      '.cm-modal-status { font-size: 0.8rem; margin-bottom: 0.75rem; display: none; }' +
      '.cm-modal-save { width: 100%; background: var(--accent, #FF6B4A); color: #FFFFFF; border: none; border-radius: 8px; padding: 0.65rem 1rem; font-family: "Inter", sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; }';
    document.head.appendChild(style);
  }

  function ensureProfileModal() {
    injectProfileModalStyles();
    let modal = document.getElementById('cmProfileModal');
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
      '<div class="cm-modal-field"><label for="cmFullName">Full Name</label><input type="text" id="cmFullName" required /></div>' +
      '<div class="cm-modal-field"><label for="cmCourse">Course</label>' +
      '<select id="cmCourse" required>' +
      '<option value="BCA">BCA</option>' +
      '<option value="BCS">BCS</option>' +
      '<option value="BCSIT">BCSIT</option>' +
      '<option value="BTech">BTech</option>' +
      '<option value="BBA">BBA</option>' +
      '<option value="Other">Other</option>' +
      '</select></div>' +
      '<div class="cm-modal-field"><label for="cmCollege">College</label><input type="text" id="cmCollege" required /></div>' +
      '<div class="cm-modal-field"><label for="cmGithub">GitHub URL</label><input type="url" id="cmGithub" placeholder="https://github.com/username" /></div>' +
      '<button type="submit" class="cm-modal-save" id="cmSaveProfileBtn">Save Changes</button>' +
      '</form>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('cmCloseModal').addEventListener('click', function () {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('open');
    });
    return modal;
  }

  async function openProfileModal(user) {
    const modal = ensureProfileModal();
    const statusEl = document.getElementById('cmProfileStatus');
    const saveBtn = document.getElementById('cmSaveProfileBtn');
    const form = document.getElementById('cmProfileForm');
    statusEl.style.display = 'none';
    modal.classList.add('open');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, course, college, github_url')
      .eq('id', user.id)
      .single();

    document.getElementById('cmFullName').value = (profile && profile.full_name) || (user.user_metadata && user.user_metadata.full_name) || '';
    document.getElementById('cmCourse').value = (profile && profile.course) || (user.user_metadata && user.user_metadata.course) || 'BCA';
    document.getElementById('cmCollege').value = (profile && profile.college) || (user.user_metadata && user.user_metadata.college) || '';
    document.getElementById('cmGithub').value = (profile && profile.github_url) || '';

    form.onsubmit = async function (e) {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      statusEl.style.display = 'none';

      const updates = {
        full_name: document.getElementById('cmFullName').value.trim(),
        course: document.getElementById('cmCourse').value,
        college: document.getElementById('cmCollege').value.trim(),
        github_url: document.getElementById('cmGithub').value.trim() || null
      };

      const { error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
      statusEl.style.display = 'block';

      if (error) {
        statusEl.style.color = '#F87171';
        statusEl.textContent = error.message || 'Failed to update profile.';
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

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdmin = profile && profile.role === 'admin';

    authNavContainer.innerHTML =
      (isAdmin ? '<a href="admin.html" class="nav-link" style="color: var(--accent);">Admin</a>' : '') +
      '<button type="button" class="nav-link" id="navProfileBtn">My Profile</button>' +
      '<button type="button" class="nav-link" id="navSignOutBtn">Sign Out</button>';

    const profileBtn = document.getElementById('navProfileBtn');
    const signOutBtn = document.getElementById('navSignOutBtn');

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
    renderAuthNav(result.data.session);
  });

  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    renderAuthNav(session);
  });
})();
