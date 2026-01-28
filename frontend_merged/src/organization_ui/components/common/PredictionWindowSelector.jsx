import React from "react";
import { usePredictionWindow } from "../../context/PredictionWindowContext";
import styles from "./PredictionWindowSelector.module.css";

const PredictionWindowSelector = () => {
  const { predictionWindow, setPredictionWindow } = usePredictionWindow();

  return (
    <div className={styles.container}>
      <div className={styles.title}>Select Prediction Window</div>

      <div className={styles.buttons}>
        {[30, 60, 90].map((day) => (
          <button
            key={day}
            className={`${styles.button} ${
              predictionWindow === day ? styles.active : ""
            }`}
            onClick={() => setPredictionWindow(day)}
          >
            {day}-Day Window
          </button>
        ))}
      </div>
    </div>
  );
};

export default PredictionWindowSelector;
