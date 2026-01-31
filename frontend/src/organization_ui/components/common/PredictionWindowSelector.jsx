import React from "react";
import { Activity, Calendar } from "lucide-react";
import { usePredictionWindow } from "../../context/PredictionWindowContext";
import styles from "./PredictionWindowSelector.module.css";

const PredictionWindowSelector = () => {
  const { predictionWindow, setPredictionWindow } = usePredictionWindow();

  return (
    <div className={styles.container}>
      <div className={styles.selectorCard}>
        <div className={styles.label}>
          <Calendar size={20} className={styles.icon} />
          <span className={styles.labelText}>Prediction Window</span>
        </div>
        <div className={styles.buttons}>
          {[30, 60, 90].map((day) => (
            <button
              key={day}
              className={`${styles.button} ${
                predictionWindow === day ? styles.active : ""
              }`}
              onClick={() => setPredictionWindow(day)}
            >
              <span className={styles.buttonDays}>{day}</span>
              <span className={styles.buttonText}>Days</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictionWindowSelector;
