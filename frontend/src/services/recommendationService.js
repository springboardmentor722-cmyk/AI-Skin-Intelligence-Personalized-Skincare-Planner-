import axios from "axios";

const API = "http://localhost:8000";

export const getRecommendations = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API}/recommendations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getRoutine = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${API}/recommendations/routine`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateRoutineStep = async (
  routineType,
  stepName,
  completed
) => {

  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API}/recommendations/routine/check`,
    {
      routine_time: routineType,
      step: stepName,
      completed: completed,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

