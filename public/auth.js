const initAuthPage = (mode) => {
  const form = document.getElementById(mode === 'login' ? 'login-form' : 'signup-form');
  const alertEl = document.getElementById(mode === 'login' ? 'login-alert' : 'signup-alert');
  const submitBtn = document.getElementById(mode === 'login' ? 'login-submit' : 'signup-submit');

  checkAuth().then((user) => {
    if (user) redirectToDashboard();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.textContent = '';
    alertEl.classList.remove('is-success');

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'login' ? 'Signing in...' : 'Creating account...';

    try {
      const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      await axios.post(endpoint, payload);
      redirectToDashboard();
    } catch (error) {
      const msg =
        error.response?.data?.msg ||
        (mode === 'login'
          ? 'Could not sign in. Please try again.'
          : 'Could not create account. Please try again.');
      showAlert(alertEl, msg, false, false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
};

const initDashboardAuth = async () => {
  const user = await checkAuth();
  if (!user) {
    redirectToLogin();
    return null;
  }

  const greeting = document.querySelector('#user-greeting');
  if (greeting) {
    greeting.innerHTML = `Signed in as <strong>${escapeHTML(user.name)}</strong>`;
  }

  const logoutBtn = document.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      logoutBtn.disabled = true;
      try {
        await axios.post('/api/v1/auth/logout');
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        redirectToLogin();
      }
    });
  }

  return user;
};
