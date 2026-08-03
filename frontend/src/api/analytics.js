import api from "./axios";

export const getUserAnalytics = (userId = null) => {
  const url = userId ? `/analytics?user_id=${userId}` : "/analytics";
  return api.get(url).then(res => res.data);
};
