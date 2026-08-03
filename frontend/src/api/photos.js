import api from "./axios";

export const uploadPhoto = (formData) => {
  return api.post("/photos/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }).then(res => res.data);
};

export const getPhotos = (userId = null) => {
  const url = userId ? `/photos/?user_id=${userId}` : "/photos/";
  return api.get(url).then(res => res.data);
};
