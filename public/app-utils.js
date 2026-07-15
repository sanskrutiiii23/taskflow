axios.defaults.withCredentials = true;

const escapeHTML = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const showAlert = (el, message, isSuccess = false, autoClear = true) => {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-success', isSuccess);
  if (autoClear) {
    setTimeout(() => {
      el.textContent = '';
      el.classList.remove('is-success');
    }, 2800);
  }
};

const redirectToDashboard = () => {
  window.location.href = '/index.html';
};

const redirectToLogin = () => {
  window.location.href = '/login.html';
};

const checkAuth = async () => {
  try {
    const { data } = await axios.get('/api/v1/auth/me');
    return data.user;
  } catch {
    return null;
  }
};

const handleAuthError = (error) => {
  if (error.response?.status === 401) {
    redirectToLogin();
    return true;
  }
  return false;
};
