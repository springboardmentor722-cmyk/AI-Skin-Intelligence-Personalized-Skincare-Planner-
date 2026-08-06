import api from "./api";

export const uploadSkinImage = async (imageFile) => {
  const formData = new FormData();

  formData.append("file", imageFile);

  const response = await api.post(
    "/ai-assessment/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};