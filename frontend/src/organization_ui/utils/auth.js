export const isAuthenticated = () => {
  return localStorage.getItem('org_authenticated') === 'true';
};

export const logout = () => {
  localStorage.removeItem('org_authenticated');
  localStorage.removeItem('org_user');
  window.location.href = '/org/login';
};

export const getCurrentUser = () => {
  return localStorage.getItem('org_user');
};
