import React, { createContext, useContext, useState, useCallback } from 'react';

const CarePlanContext = createContext();

export const CarePlanProvider = ({ children }) => {
  const [carePlans, setCarePlans] = useState({});

  const assignCarePlan = useCallback((assignment) => {
    const { memberId, careTeamId, interventions, notes, assignedDate } = assignment;
    
    setCarePlans(prev => ({
      ...prev,
      [memberId]: {
        careTeamId,
        interventions,
        notes,
        assignedDate,
        status: 'active'
      }
    }));

    console.log('Care plan assigned:', assignment);
  }, []);

  const getCarePlan = useCallback((memberId) => {
    return carePlans[memberId] || null;
  }, [carePlans]);

  const updateCarePlan = useCallback((memberId, updates) => {
    setCarePlans(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        ...updates,
        updatedDate: new Date().toISOString()
      }
    }));
  }, []);

  const removeCarePlan = useCallback((memberId) => {
    setCarePlans(prev => {
      const newPlans = { ...prev };
      delete newPlans[memberId];
      return newPlans;
    });
  }, []);

  const getCarePlanStats = useCallback(() => {
    const totalAssigned = Object.keys(carePlans).length;
    const totalInterventions = Object.values(carePlans).reduce(
      (sum, plan) => sum + (plan.interventions?.length || 0),
      0
    );

    return {
      totalAssigned,
      totalInterventions,
      avgInterventionsPerPlan: totalAssigned > 0 ? (totalInterventions / totalAssigned).toFixed(1) : 0
    };
  }, [carePlans]);

  return (
    <CarePlanContext.Provider
      value={{
        carePlans,
        assignCarePlan,
        getCarePlan,
        updateCarePlan,
        removeCarePlan,
        getCarePlanStats
      }}
    >
      {children}
    </CarePlanContext.Provider>
  );
};

export const useCarePlan = () => {
  const context = useContext(CarePlanContext);
  if (!context) {
    throw new Error('useCarePlan must be used within CarePlanProvider');
  }
  return context;
};
