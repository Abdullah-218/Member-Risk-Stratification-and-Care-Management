/**
 * =====================================
 * DASHBOARD API SERVICE
 * =====================================
 * Real API calls to backend for dashboard data
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Fetch dashboard summary (overview metrics)
 */
export const getDashboardSummary = async (predictionWindow = '30_day') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/summary?window=${predictionWindow}`,
      {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch dashboard summary');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: `${API_BASE_URL}/dashboard/summary?window=${predictionWindow}`
    });
    throw error;
  }
};

/**
 * Fetch all members with risk scores and financial data
 */
export const getDashboardMembers = async (predictionWindow = '30_day', limit = 100, offset = 0) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/members?window=${predictionWindow}&limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch members');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching dashboard members:', error);
    throw error;
  }
};

/**
 * Fetch tier-based statistics
 */
export const getTierStatistics = async (predictionWindow = '30_day') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/tiers?window=${predictionWindow}`,
      {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch tier statistics');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching tier statistics:', error);
    throw error;
  }
};

/**
 * Fetch department-wise summary
 */
export const getDepartmentSummary = async (predictionWindow = '30_day') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/departments?window=${predictionWindow}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch department summary');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching department summary:', error);
    throw error;
  }
};

/**
 * Fetch priority patients (highest ROI opportunities)
 */
export const getPriorityPatients = async (predictionWindow = '30_day', limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/priority?window=${predictionWindow}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch priority patients');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching priority patients:', error);
    throw error;
  }
};

/**
 * Fetch trend data across all windows
 */
export const getTrendData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/trends`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch trend data');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching trend data:', error);
    throw error;
  }
};

/**
 * Fetch tier-level financial breakdown (matches ML model output)
 */
export const getTierFinancials = async (predictionWindow = '30_day') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/tier-financials?window=${predictionWindow}`,
      {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch tier financials');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching tier financials:', error);
    throw error;
  }
};

/**
 * Get complete dashboard data for a specific window
 * Returns: summary, members, tiers, departments, priority patients
 */
export const getCompleteDashboardData = async (predictionWindow = '30_day') => {
  try {
    const [summary, members, tiers, departments, priority] = await Promise.all([
      getDashboardSummary(predictionWindow),
      getDashboardMembers(predictionWindow),
      getTierStatistics(predictionWindow),
      getDepartmentSummary(predictionWindow),
      getPriorityPatients(predictionWindow)
    ]);
    
    return {
      summary,
      members,
      tiers,
      departments,
      priority
    };
  } catch (error) {
    console.error('Error fetching complete dashboard data:', error);
    throw error;
  }
};
