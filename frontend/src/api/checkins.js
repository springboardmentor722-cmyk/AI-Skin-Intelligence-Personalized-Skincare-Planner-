import api from "./axios";

export const logRoutineStep = (routineStepId, timeOfDay, completed) => {
  return api.post("/checkins", {
    routine_step_id: routineStepId,
    time_of_day: timeOfDay,
    completed,
  }).then(res => res.data);
};

export const getTodayCheckins = () => {
  return api.get("/checkins/today").then(res => res.data);
};
