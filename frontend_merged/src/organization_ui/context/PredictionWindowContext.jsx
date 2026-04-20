import React, { createContext, useContext, useState } from "react";

const PredictionWindowContext = createContext();

export const PredictionWindowProvider = ({ children }) => {
  const [predictionWindow, setPredictionWindow] = useState(90);

  return (
    <PredictionWindowContext.Provider
      value={{ predictionWindow, setPredictionWindow }}
    >
      {children}
    </PredictionWindowContext.Provider>
  );
};

export const usePredictionWindow = () => {
  return useContext(PredictionWindowContext);
};
