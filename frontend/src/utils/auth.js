export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user"));
}

export function getUserRole() {
  const user = getCurrentUser();
  return user?.role;
}
