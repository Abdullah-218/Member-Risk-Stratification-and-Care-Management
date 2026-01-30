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
 * Fetch members filtered by risk tier(s) and prediction window
 * @param {string} predictionWindow - '30_day'|'60_day'|'90_day'
 * @param {Array<number>} tiers - Array of tier numbers [1,2,3,4,5] or empty for all
 * @param {number} limit - Number of results to return
 * @param {number} offset - Pagination offset
 * @returns {Promise<Object>} { success, data: [...members], total, window, tiers }
 */
export const getMembersByTier = async (predictionWindow = '30_day', tiers = [], limit = 100, offset = 0) => {
  try {
    // Convert tiers array to comma-separated string for query param
    const tiersParam = Array.isArray(tiers) && tiers.length > 0 
      ? tiers.join(',') 
      : '';
    
    const queryParams = new URLSearchParams({
      window: predictionWindow,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (tiersParam) {
      queryParams.append('tiers', tiersParam);
    }
    
    const response = await fetch(
      `${API_BASE_URL}/dashboard/members-by-tier?${queryParams}`,
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
      throw new Error(result.message || 'Failed to fetch members by tier');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching members by tier:', error);
    console.error('Error details:', {
      message: error.message,
      predictionWindow,
      tiers,
      limit,
      offset
    });
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

/**
 * Fetch detailed department analytics with risk tier breakdown
 * @param {string} predictionWindow - '30_day'|'60_day'|'90_day'
 * @returns {Promise<Object>} { success, data: [...departments], total, window }
 */
export const getDepartmentAnalytics = async (predictionWindow = '30_day') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/department-analytics?window=${predictionWindow}`,
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
      throw new Error(result.message || 'Failed to fetch department analytics');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching department analytics:', error);
    console.error('Error details:', {
      message: error.message,
      predictionWindow
    });
    throw error;
  }
};

/**
 * Get members from a specific department filtered by risk tiers
 * @param {string} departmentName - Department name
 * @param {number} predictionWindow - 30, 60, or 90 days
 * @param {number[]} tiers - Array of tier numbers (e.g., [4, 5] for critical and high)
 * @returns {Promise<Object>} Members data
 */
export const getDepartmentMembers = async (departmentName, predictionWindow = 90, tiers = []) => {
  try {
    const windowStr = `${predictionWindow}_day`;
    const tiersParam = tiers.length > 0 ? `&tiers=${tiers.join(',')}` : '';
    
    const response = await fetch(
      `${API_BASE_URL}/dashboard/department-members?departmentName=${encodeURIComponent(departmentName)}&window=${windowStr}${tiersParam}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch department members');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching department members:', error);
    console.error('Error details:', {
      message: error.message,
      departmentName,
      predictionWindow,
      tiers
    });
    throw error;
  }
};

/**
 * Get patient counts by tier for intervention planning
 * @param {number} predictionWindow - 30, 60, or 90 days
 * @returns {Promise<Object>} Tier counts data
 */
export const getTierCounts = async (predictionWindow = 90) => {
  try {
    const windowStr = `${predictionWindow}_day`;
    console.log(`📊 Fetching tier counts for window: ${windowStr}`);
    
    const response = await fetch(
      `${API_BASE_URL}/dashboard/tier-counts?window=${windowStr}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Tier counts data:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch tier counts');
    }
    
    return data.data;
  } catch (error) {
    console.error('❌ Error fetching tier counts:', error);
    throw error;
  }
};

/**
 * Get ROI financial impact metrics
 * @param {number} predictionWindow - 30, 60, or 90 days
 * @returns {Promise<Object>} Financial impact data
 */
export const getROIFinancialImpact = async (predictionWindow = 90) => {
  try {
    const windowStr = `${predictionWindow}_day`;
    
    const response = await fetch(
      `${API_BASE_URL}/dashboard/roi-financial-impact?window=${windowStr}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch ROI financial impact');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching ROI financial impact:', error);
    console.error('Error details:', {
      message: error.message,
      predictionWindow
    });
    throw error;
  }
};

// Export all functions as dashboardApi object AND as named exports for backward compatibility
export const dashboardApi = {
  getDashboardSummary,
  getDashboardMembers,
  getTierStatistics,
  getDepartmentSummary,
  getPriorityPatients,
  getTrendData,
  getTierFinancials,
  getMembersByTier,
  getCompleteDashboardData,
  getDepartmentAnalytics,
  getDepartmentMembers,
  getTierCounts,
  getROIFinancialImpact
};
