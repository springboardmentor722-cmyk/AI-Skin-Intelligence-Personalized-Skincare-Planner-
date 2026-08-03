import api from "./axios";

export const calculateSafetyScore = (ingredientsList, timeOfDay = "PM") => {
  return api.post("/ingredients/safety-score", {
    ingredients_list: ingredientsList,
    time_of_day: timeOfDay,
  }).then(res => res.data);
};
