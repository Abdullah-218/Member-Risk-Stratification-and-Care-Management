# healthcare_risk_dashboard_advanced.py
#streamlit run healthcare_risk_dashboard_advanced.py

"""
HEALTHCARE RISK PREDICTION DASHBOARD - ADVANCED VERSION
=======================================================

Using the superior ROI logic from evaluation/02_roi_calculation.py
- Proper time-scaled intervention costs for each window
- Window-specific success rate ranges
- Accurate ROI calculations with 100% cap
- Multi-window analysis (30/60/90 days)
"""

import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import random
import json
from datetime import datetime
import warnings

# Filter sklearn warnings about feature names (they're just informational)
warnings.filterwarnings("ignore", category=UserWarning, message="X does not have valid feature names")

# Page configuration
st.set_page_config(
    page_title="Healthcare Risk Prediction Dashboard - Advanced",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
    }
    .tier-1 { background-color: #4caf50; }
    .tier-2 { background-color: #8bc34a; }
    .tier-3 { background-color: #ff9800; }
    .tier-4 { background-color: #f44336; }
    .tier-5 { background-color: #9c27b0; }
    .positive-roi { color: #4caf50; font-weight: bold; }
    .negative-roi { color: #f44336; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

class AdvancedHealthcareRiskDashboard:
    """Advanced dashboard using evaluation/02_roi_calculation.py logic"""
    
    def __init__(self):
        # Fixed random seed for consistency
        random.seed(42)
        np.random.seed(42)
        
        # Multi-window intervention costs (from evaluation/02_roi_calculation.py)
        self.multi_window_costs = {
            30: {
                1: 0,       # Tier 1: Monitor only
                2: 150,     # Tier 2: $100-200 range, using midpoint
                3: 400,     # Tier 3: $300-500 range, using midpoint
                4: 700,     # Tier 4: $600-800 range, using midpoint
                5: 900      # Tier 5: $800-1000 range, using midpoint
            },
            60: {
                1: 0,       # Tier 1: Monitor only
                2: 250,     # Tier 2: $200-300 range, using midpoint
                3: 700,     # Tier 3: $600-800 range, using midpoint
                4: 1100,    # Tier 4: $1000-1200 range, using midpoint
                5: 1650     # Tier 5: $1500-1800 range, using midpoint
            },
            90: {
                1: 0,       # Tier 1: Monitor only
                2: 350,     # Tier 2: $300-400 range, using midpoint
                3: 1050,    # Tier 3: $900-1200 range, using midpoint
                4: 1550,    # Tier 4: $1400-1700 range, using midpoint
                5: 1900     # Tier 5: $1800-2000 range, using midpoint
            }
        }
        
        # Multi-window success rate ranges (from evaluation/02_roi_calculation.py)
        self.multi_window_success_rates = {
            30: {
                1: (0.03, 0.08),    # Tier 1: 3% - 8% (minimal monitoring)
                2: (0.10, 0.20),    # Tier 2: 10% - 20% (low intervention)
                3: (0.25, 0.40),    # Tier 3: 25% - 40% (moderate intervention)
                4: (0.30, 0.50),    # Tier 4: 30% - 50% (intensive intervention)
                5: (0.40, 0.60)     # Tier 5: 40% - 60% (critical intervention)
            },
            60: {
                1: (0.10, 0.25),    # Tier 1: 10% - 25% (extended monitoring)
                2: (0.25, 0.40),    # Tier 2: 25% - 40% (early intervention)
                3: (0.35, 0.55),    # Tier 3: 35% - 55% (moderate intervention)
                4: (0.45, 0.65),    # Tier 4: 45% - 65% (intensive intervention)
                5: (0.55, 0.75)     # Tier 5: 55% - 75% (critical intervention)
            },
            90: {
                1: (0.20, 0.35),    # Tier 1: 20% - 35% (long-term monitoring)
                2: (0.35, 0.50),    # Tier 2: 35% - 50% (early intervention)
                3: (0.45, 0.60),    # Tier 3: 45% - 60% (moderate intervention)
                4: (0.60, 0.80),    # Tier 4: 60% - 80% (intensive intervention)
                5: (0.70, 0.90)     # Tier 5: 70% - 90% (critical intervention)
            }
        }
        
        self.tier_labels = {1: 'Normal', 2: 'Low Risk', 3: 'Moderate Risk', 4: 'High Risk', 5: 'Critical Risk'}
        self.tier_colors = {1: '#4caf50', 2: '#8bc34a', 3: '#ff9800', 4: '#f44336', 5: '#9c27b0'}
        
        self.load_models_and_data()
    
    def load_models_and_data(self):
        """Load trained models and test data"""
        try:
            # Load models
            self.models = {}
            for window in [30, 60, 90]:
                model_data = joblib.load(f'models/best_{window}_day_model.pkl')
                self.models[window] = {
                    'model': model_data['model'],
                    'name': model_data['name'],
                    'threshold': model_data['threshold']
                }
            
            # Load test data
            self.X_test = pd.read_csv('data/processed/X_test.csv')
            self.y_30_test = pd.read_csv('data/processed/y_30_test.csv').values.ravel()
            self.y_60_test = pd.read_csv('data/processed/y_60_test.csv').values.ravel()
            self.y_90_test = pd.read_csv('data/processed/y_90_test.csv').values.ravel()
            
            # Load feature names for new patient prediction
            X_train = pd.read_csv('data/processed/X_train.csv')
            self.feature_names = X_train.columns.tolist()
            
            st.success(f"✅ Loaded {len(self.X_test)} patients and 3 trained models")
            st.info("📊 Using advanced ROI logic with time-scaled costs and window-specific success rates")
            
        except Exception as e:
            st.error(f"Error loading models/data: {e}")
            st.stop()
    
    def stratify_to_tier(self, risk_score):
        """Convert risk score to tier (same as evaluation/02_roi_calculation.py)"""
        if risk_score < 0.10:
            return 1
        elif risk_score < 0.25:
            return 2
        elif risk_score < 0.50:
            return 3
        elif risk_score < 0.75:
            return 4
        else:
            return 5
    
    def get_success_rate(self, patient_id, tier, window):
        """Get success rate with controlled randomness (same as evaluation/02_roi_calculation.py)"""
        min_rate, max_rate = self.multi_window_success_rates[window][tier]
        # Use exact same random seed logic as evaluation file
        patient_seed = 42 + int(patient_id) if isinstance(patient_id, (int, np.integer)) else 42 + hash(str(patient_id)) % 1000
        random.seed(patient_seed)
        return random.uniform(min_rate, max_rate)
    
    def calculate_advanced_roi(self, risk_score, tier, annual_cost, window, patient_id):
        """Calculate ROI using evaluation/02_roi_calculation.py logic"""
        
        # Get intervention costs for this window
        intervention_costs = self.multi_window_costs[window]
        intervention_cost = intervention_costs[tier]
        
        # Calculate projected cost for the time window (proportional to annual cost)
        projected_cost = annual_cost * (window / 365)
        
        # Get success rate for this tier and window
        success_rate = self.get_success_rate(patient_id, tier, window)
        
        # Apply exact ROI formula as specified in evaluation file
        expected_savings = projected_cost * success_rate
        net_benefit = expected_savings - intervention_cost
        
        # Calculate ROI with 100% cap (realistic constraint)
        if intervention_cost > 0:
            roi_percent = (net_benefit / intervention_cost) * 100
            roi_percent = min(roi_percent, 100.0)  # Cap at 100% max
        else:
            roi_percent = 0
        
        return {
            'risk_score': risk_score,
            'tier': tier,
            'tier_label': self.tier_labels[tier],
            'window_days': window,
            'projected_cost': projected_cost,
            'intervention_cost': intervention_cost,
            'success_rate': success_rate,
            'success_rate_range': f"{self.multi_window_success_rates[window][tier][0]*100:.0f}%-{self.multi_window_success_rates[window][tier][1]*100:.0f}%",
            'expected_savings': expected_savings,
            'net_benefit': net_benefit,
            'roi_percent': roi_percent,
            'intervention_cost_type': f"{window}-day time-scaled"
        }
    
    def organization_analysis(self, windows, use_full_dataset=True):
        """Perform organization-level analysis using evaluation logic"""
        results = {}
        
        # Use full dataset or sample
        if use_full_dataset:
            X_analysis = self.X_test.reset_index(drop=True)
            patient_indices = range(len(self.X_test))
        else:
            num_patients = min(1000, len(self.X_test))
            sample_indices = np.random.choice(len(self.X_test), num_patients, replace=False)
            X_analysis = self.X_test.iloc[sample_indices].reset_index(drop=True)
            patient_indices = self.X_test.index[sample_indices]
        
        for window in windows:
            # Get predictions
            model_info = self.models[window]
            model = model_info['model']
            risk_scores = model.predict_proba(X_analysis)[:, 1]
            
            # Calculate ROI for each patient using advanced logic
            window_results = []
            for i, risk_score in enumerate(risk_scores):
                patient_id = patient_indices[i]
                tier = self.stratify_to_tier(risk_score)
                annual_cost = X_analysis.iloc[i]['total_annual_cost']
                
                roi_data = self.calculate_advanced_roi(risk_score, tier, annual_cost, window, patient_id)
                roi_data['patient_id'] = patient_id
                window_results.append(roi_data)
            
            results[window] = pd.DataFrame(window_results)
        
        return results
    
    def individual_patient_analysis(self, patient_data):
        """Analyze individual patient using advanced logic"""
        # Prepare features
        features = {feature: 0 for feature in self.feature_names}
        for key, value in patient_data.items():
            if key in features:
                features[key] = value
        
        # Create DataFrame with proper feature names and column order
        feature_df = pd.DataFrame([features])
        feature_df = feature_df[self.feature_names]  # Ensure correct column order
        
        results = {}
        for window in [30, 60, 90]:
            model_info = self.models[window]
            model = model_info['model']
            
            # Use DataFrame with feature names to avoid warnings
            risk_score = model.predict_proba(feature_df)[0, 1]
            tier = self.stratify_to_tier(risk_score)
            
            roi_data = self.calculate_advanced_roi(
                risk_score, tier, patient_data.get('total_annual_cost', 0), 
                window, patient_data.get('patient_id', 'NEW_PATIENT')
            )
            results[f'{window}_day'] = roi_data
        
        return results
    
    def create_tier_distribution_chart(self, results_df):
        """Create tier distribution pie chart"""
        tier_counts = results_df['tier'].value_counts().sort_index()
        tier_labels = [self.tier_labels[tier] for tier in tier_counts.index]
        colors = [self.tier_colors[tier] for tier in tier_counts.index]
        
        fig = px.pie(
            values=tier_counts.values,
            names=tier_labels,
            title="Patient Distribution by Risk Tier",
            color_discrete_sequence=colors
        )
        return fig
    
    def create_roi_by_tier_chart(self, results_df):
        """Create ROI by tier bar chart with positive/negative indicators"""
        tier_roi = results_df.groupby('tier')['roi_percent'].mean().reset_index()
        tier_roi['tier_label'] = tier_roi['tier'].map(self.tier_labels)
        colors = ['#4caf50' if roi > 0 else '#f44336' for roi in tier_roi['roi_percent']]
        
        fig = px.bar(
            tier_roi,
            x='tier_label',
            y='roi_percent',
            title="Average ROI by Risk Tier (Advanced Calculation)",
            color=colors,
            labels={'roi_percent': 'ROI (%)', 'tier_label': 'Risk Tier'}
        )
        fig.update_layout(showlegend=False)
        
        # Add zero line
        fig.add_hline(y=0, line_dash="dash", line_color="black")
        
        return fig
    
    def create_multi_window_comparison(self, results_dict):
        """Create multi-window comparison chart"""
        comparison_data = []
        
        for window, df in results_dict.items():
            window_label = f"{window}-DAY"
            avg_roi = df['roi_percent'].mean()
            total_patients = len(df)
            positive_roi_count = len(df[df['roi_percent'] > 0])
            total_benefit = df['net_benefit'].sum()
            
            comparison_data.append({
                'window': window_label,
                'avg_roi': avg_roi,
                'total_patients': total_patients,
                'positive_roi_pct': (positive_roi_count / total_patients) * 100,
                'total_net_benefit': total_benefit
            })
        
        comparison_df = pd.DataFrame(comparison_data)
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Average ROI by Window', 'Total Patients', 'Positive ROI %', 'Net Benefit'),
            specs=[[{"secondary_y": False}, {"secondary_y": False}],
                   [{"secondary_y": False}, {"secondary_y": False}]]
        )
        
        # ROI chart
        fig.add_trace(
            go.Bar(x=comparison_df['window'], y=comparison_df['avg_roi'], name='Avg ROI', marker_color='#1f77b4'),
            row=1, col=1
        )
        
        # Patient count chart
        fig.add_trace(
            go.Bar(x=comparison_df['window'], y=comparison_df['total_patients'], name='Patients', marker_color='#ff7f0e'),
            row=1, col=2
        )
        
        # Positive ROI percentage
        fig.add_trace(
            go.Bar(x=comparison_df['window'], y=comparison_df['positive_roi_pct'], name='Positive ROI %', marker_color='#2ca02c'),
            row=2, col=1
        )
        
        # Net benefit
        fig.add_trace(
            go.Bar(x=comparison_df['window'], y=comparison_df['total_net_benefit'], name='Net Benefit', marker_color='#d62728'),
            row=2, col=2
        )
        
        fig.update_layout(title_text="Advanced Multi-Window Analysis Comparison", showlegend=False, height=600)
        return fig
    
    def create_individual_patient_chart(self, patient_results):
        """Create individual patient risk chart with advanced metrics"""
        windows = []
        risk_scores = []
        tiers = []
        roi_percentages = []
        success_rates = []
        
        for window, data in patient_results.items():
            windows.append(window.replace('_', '-').upper())
            risk_scores.append(data['risk_score'])
            tiers.append(data['tier'])
            roi_percentages.append(data['roi_percent'])
            success_rates.append(data['success_rate'] * 100)
        
        fig = make_subplots(
            rows=3, cols=1,
            subplot_titles=('Risk Scores by Window', 'Success Rates by Window', 'ROI by Window'),
            vertical_spacing=0.12
        )
        
        # Risk scores
        fig.add_trace(
            go.Scatter(x=windows, y=risk_scores, mode='lines+markers', name='Risk Score', line=dict(color='red')),
            row=1, col=1
        )
        
        # Success rates
        fig.add_trace(
            go.Bar(x=windows, y=success_rates, name='Success Rate %', marker_color='blue'),
            row=2, col=1
        )
        
        # ROI with color coding
        roi_colors = ['green' if roi > 0 else 'red' for roi in roi_percentages]
        fig.add_trace(
            go.Bar(x=windows, y=roi_percentages, name='ROI (%)', marker_color=roi_colors),
            row=3, col=1
        )
        
        fig.update_layout(title_text="Individual Patient Advanced Risk Analysis", showlegend=False, height=800)
        return fig
    
    def create_cost_benefit_table(self, results_df):
        """Create cost-benefit analysis table by tier (matching evaluation/02_roi_calculation.py logic)"""
        # Individual patient analysis (current)
        tier_individual = results_df.groupby('tier').agg({
            'patient_id': 'count',
            'roi_percent': ['mean', 'median', 'std'],
            'intervention_cost': 'sum',
            'expected_savings': 'sum',
            'net_benefit': 'sum',
            'success_rate': 'mean'
        }).round(2)
        
        # Flatten column names
        tier_individual.columns = ['Patient_Count', 'Avg_ROI', 'Median_ROI', 'ROI_Std', 
                                  'Total_Intervention_Cost', 'Total_Expected_Savings', 
                                  'Total_Net_Benefit', 'Avg_Success_Rate']
        
        # Add tier labels and calculate additional metrics
        tier_individual['Tier_Label'] = [self.tier_labels[tier] for tier in tier_individual.index]
        tier_individual['Positive_ROI_Patients'] = 0
        
        # Calculate positive ROI patients for each tier
        for tier in tier_individual.index:
            tier_data = results_df[results_df['tier'] == tier]
            positive_roi_count = len(tier_data[tier_data['roi_percent'] > 0])
            tier_individual.loc[tier, 'Positive_ROI_Patients'] = positive_roi_count
            tier_individual.loc[tier, 'Positive_ROI_Percentage'] = (positive_roi_count / len(tier_data)) * 100
        
        # Aggregate tier-level analysis (matching evaluation/02_roi_calculation.py)
        tier_aggregate = results_df.groupby('tier').agg({
            'intervention_cost': 'sum',
            'expected_savings': 'sum',
            'net_benefit': 'sum',
            'patient_id': 'count'
        }).round(2)
        
        tier_aggregate.columns = ['Intervention_Cost', 'Expected_Savings', 'Net_Benefit', 'Patients']
        
        # Calculate aggregate ROI percentage (same as evaluation file)
        tier_aggregate['ROI_Percentage'] = (
            (tier_aggregate['Expected_Savings'] - tier_aggregate['Intervention_Cost']) / 
            tier_aggregate['Intervention_Cost'] * 100
        ).round(1)
        
        # Handle infinite ROI for Tier 1 (zero intervention cost)
        tier_aggregate['ROI_Percentage'] = tier_aggregate['ROI_Percentage'].replace([np.inf, -np.inf], 100.0)
        
        # Add tier labels
        tier_aggregate['Tier_Label'] = [self.tier_labels[tier] for tier in tier_aggregate.index]
        tier_aggregate['Tier_Number'] = tier_aggregate.index
        
        # Calculate overall metrics
        total_intervention = tier_aggregate['Intervention_Cost'].sum()
        total_savings = tier_aggregate['Expected_Savings'].sum()
        total_net = tier_aggregate['Net_Benefit'].sum()
        overall_roi = (total_net / total_intervention * 100) if total_intervention > 0 else 0
        
        overall_metrics = {
            'Total_Intervention': total_intervention,
            'Total_Savings': total_savings,
            'Net_Benefit': total_net,
            'Overall_ROI': overall_roi
        }
        
        return {
            'individual_analysis': tier_individual,
            'aggregate_analysis': tier_aggregate,
            'overall_metrics': overall_metrics
        }
    
    def create_tier_separation_graphs(self, results_df):
        """Create graphs showing risk tier separations and distributions"""
        
        # Create figure with subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Patient Distribution by Tier', 'Risk Score Distribution by Tier', 
                          'ROI Distribution by Tier', 'Success Rate by Tier'),
            specs=[[{"type": "pie"}, {"type": "box"}],
                   [{"type": "bar"}, {"type": "bar"}]]
        )
        
        # 1. Patient Distribution Pie Chart
        tier_counts = results_df['tier'].value_counts().sort_index()
        tier_labels = [self.tier_labels[tier] for tier in tier_counts.index]
        colors = [self.tier_colors[tier] for tier in tier_counts.index]
        
        fig.add_trace(
            go.Pie(
                values=tier_counts.values,
                labels=tier_labels,
                name="Patient Distribution",
                marker=dict(colors=colors)
            ),
            row=1, col=1
        )
        
        # 2. Risk Score Distribution by Tier (Box Plot)
        for tier in sorted(results_df['tier'].unique()):
            tier_data = results_df[results_df['tier'] == tier]['risk_score']
            fig.add_trace(
                go.Box(
                    y=tier_data,
                    name=f"Tier {tier} ({self.tier_labels[tier]})",
                    marker_color=self.tier_colors[tier]
                ),
                row=1, col=2
            )
        
        # 3. ROI Distribution by Tier (Bar Chart)
        tier_roi = results_df.groupby('tier')['roi_percent'].mean().reset_index()
        tier_roi['tier_label'] = tier_roi['tier'].map(self.tier_labels)
        colors_roi = [self.tier_colors[tier] for tier in tier_roi['tier']]
        
        fig.add_trace(
            go.Bar(
                x=tier_roi['tier_label'],
                y=tier_roi['roi_percent'],
                name="Avg ROI by Tier",
                marker_color=colors_roi
            ),
            row=2, col=1
        )
        
        # 4. Success Rate by Tier (Bar Chart)
        tier_success = results_df.groupby('tier')['success_rate'].mean().reset_index()
        tier_success['tier_label'] = tier_success['tier'].map(self.tier_labels)
        colors_success = [self.tier_colors[tier] for tier in tier_success['tier']]
        
        fig.add_trace(
            go.Bar(
                x=tier_success['tier_label'],
                y=tier_success['success_rate'] * 100,
                name="Success Rate by Tier",
                marker_color=colors_success
            ),
            row=2, col=2
        )
        
        fig.update_layout(
            title_text="Risk Tier Analysis - Comprehensive View",
            height=800,
            showlegend=False
        )
        
        return fig
    
    def create_aggregate_roi_chart(self, aggregate_df):
        """Create aggregate ROI chart matching evaluation/02_roi_calculation.py output"""
        
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('Aggregate ROI by Tier', 'Cost-Benefit Analysis by Tier'),
            specs=[[{"type": "bar"}, {"type": "bar"}]]
        )
        
        # ROI by Tier
        colors = ['green' if roi > 0 else 'red' for roi in aggregate_df['ROI_Percentage']]
        fig.add_trace(
            go.Bar(
                x=aggregate_df['Tier_Label'],
                y=aggregate_df['ROI_Percentage'],
                name="Aggregate ROI (%)",
                marker_color=colors,
                text=aggregate_df['ROI_Percentage'].apply(lambda x: f"{x:.1f}%"),
                textposition='auto'
            ),
            row=1, col=1
        )
        
        # Cost-Benefit Analysis
        fig.add_trace(
            go.Bar(
                x=aggregate_df['Tier_Label'],
                y=aggregate_df['Intervention_Cost'],
                name="Intervention Cost",
                marker_color='red'
            ),
            row=1, col=2
        )
        
        fig.add_trace(
            go.Bar(
                x=aggregate_df['Tier_Label'],
                y=aggregate_df['Expected_Savings'],
                name="Expected Savings",
                marker_color='green'
            ),
            row=1, col=2
        )
        
        fig.update_layout(
            title_text="Aggregate Tier-Level Analysis (Matching evaluation/02_roi_calculation.py)",
            height=500
        )
        
        return fig

def main():
    """Main Streamlit app"""
    dashboard = AdvancedHealthcareRiskDashboard()
    
    # Header
    st.markdown('<h1 class="main-header">🏥 Advanced Healthcare Risk Dashboard</h1>', unsafe_allow_html=True)
    st.markdown("### Using superior ROI logic with time-scaled costs and window-specific success rates")
    st.markdown("---")
    
    # Sidebar for navigation
    st.sidebar.title("Analysis Type")
    analysis_type = st.sidebar.radio(
        "Choose Analysis Type:",
        ["🏢 Organization Analysis", "👤 Individual Patient", "📊 Advanced Comparison"]
    )
    
    if analysis_type == "🏢 Organization Analysis":
        st.header("Organization-Level Risk Analysis - Advanced")
        st.info("📊 Using full 3,000 patient dataset with advanced ROI calculations")
        st.success("✨ Features: Time-scaled costs, window-specific success rates, 100% ROI cap")
        
        # Input parameters
        col1, col2 = st.columns(2)
        with col1:
            use_full = st.checkbox("Use Full Dataset (3,000 patients)", value=True)
        with col2:
            window_options = st.multiselect(
                "Prediction Windows",
                [30, 60, 90],
                default=[30, 60, 90]
            )
        
        if st.button("Run Advanced Organization Analysis"):
            with st.spinner("Analyzing patient data with advanced ROI logic..."):
                results = dashboard.organization_analysis(window_options, use_full)
            
            total_patients = len(next(iter(results.values())))
            st.success(f"Advanced analysis complete for {total_patients} patients")
            
            # Display results
            st.subheader("📊 Advanced Metrics")
            for window, df in results.items():
                window_label = f"{window}-DAY"
                with st.expander(f"{window_label} Window Results"):
                    col1, col2, col3, col4, col5 = st.columns(5)
                    
                    with col1:
                        st.metric("Total Patients", len(df))
                    with col2:
                        avg_risk = df['risk_score'].mean()
                        st.metric("Avg Risk Score", f"{avg_risk:.3f}")
                    with col3:
                        avg_roi = df['roi_percent'].mean()
                        roi_class = "positive-roi" if avg_roi > 0 else "negative-roi"
                        st.markdown(f"**Avg ROI:** <span class='{roi_class}'>{avg_roi:.1f}%</span>", unsafe_allow_html=True)
                    with col4:
                        positive_roi = len(df[df['roi_percent'] > 0])
                        st.metric("Positive ROI Patients", f"{positive_roi} ({positive_roi/len(df)*100:.1f}%)")
                    with col5:
                        total_benefit = df['net_benefit'].sum()
                        benefit_class = "positive-roi" if total_benefit > 0 else "negative-roi"
                        st.markdown(f"**Net Benefit:** <span class='{benefit_class}'>${total_benefit:,.0f}</span>", unsafe_allow_html=True)
            
            # Visualizations
            st.subheader("📈 Advanced Visualizations")
            
            for window, df in results.items():
                window_label = f"{window}-DAY"
                st.markdown(f"### {window_label} Window Analysis")
                
                col1, col2 = st.columns(2)
                with col1:
                    fig1 = dashboard.create_tier_distribution_chart(df)
                    st.plotly_chart(fig1, use_container_width=True)
                
                with col2:
                    fig2 = dashboard.create_roi_by_tier_chart(df)
                    st.plotly_chart(fig2, use_container_width=True)
                
                # Cost-benefit analysis tables
                st.markdown("#### 📊 Cost-Benefit Analysis by Tier")
                cost_benefit_data = dashboard.create_cost_benefit_table(df)
                
                # Individual Patient Analysis
                st.markdown("##### 👥 Individual Patient-Level Analysis")
                individual_table = cost_benefit_data['individual_analysis'].copy()
                individual_table['Avg_ROI'] = individual_table['Avg_ROI'].apply(lambda x: f"{x:.1f}%")
                individual_table['Median_ROI'] = individual_table['Median_ROI'].apply(lambda x: f"{x:.1f}%")
                individual_table['Positive_ROI_Percentage'] = individual_table['Positive_ROI_Percentage'].apply(lambda x: f"{x:.1f}%")
                individual_table['Avg_Success_Rate'] = individual_table['Avg_Success_Rate'].apply(lambda x: f"{x:.1f}%")
                individual_table['Total_Intervention_Cost'] = individual_table['Total_Intervention_Cost'].apply(lambda x: f"${x:,.0f}")
                individual_table['Total_Expected_Savings'] = individual_table['Total_Expected_Savings'].apply(lambda x: f"${x:,.0f}")
                individual_table['Total_Net_Benefit'] = individual_table['Total_Net_Benefit'].apply(lambda x: f"${x:,.0f}")
                
                individual_display = individual_table[['Tier_Label', 'Patient_Count', 'Positive_ROI_Patients', 
                                                   'Positive_ROI_Percentage', 'Avg_ROI', 'Median_ROI', 
                                                   'Avg_Success_Rate', 'Total_Intervention_Cost', 
                                                   'Total_Expected_Savings', 'Total_Net_Benefit']]
                
                st.dataframe(individual_display, use_container_width=True, hide_index=True)
                
                # Aggregate Tier-Level Analysis (matching evaluation/02_roi_calculation.py)
                st.markdown("##### 🏢 Aggregate Tier-Level Analysis (Matching evaluation/02_roi_calculation.py)")
                aggregate_table = cost_benefit_data['aggregate_analysis'].copy()
                aggregate_table['Intervention_Cost'] = aggregate_table['Intervention_Cost'].apply(lambda x: f"${x:,.0f}")
                aggregate_table['Expected_Savings'] = aggregate_table['Expected_Savings'].apply(lambda x: f"${x:,.0f}")
                aggregate_table['Net_Benefit'] = aggregate_table['Net_Benefit'].apply(lambda x: f"${x:,.0f}")
                aggregate_table['ROI_Percentage'] = aggregate_table['ROI_Percentage'].apply(lambda x: f"{x:.1f}%")
                
                aggregate_display = aggregate_table[['Tier_Number', 'Tier_Label', 'Patients', 'Intervention_Cost', 
                                                   'Expected_Savings', 'Net_Benefit', 'ROI_Percentage']]
                
                st.dataframe(aggregate_display, use_container_width=True, hide_index=True)
                
                # Overall Program Metrics
                overall = cost_benefit_data['overall_metrics']
                st.markdown("##### 📈 Overall Program Metrics")
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Total Intervention Cost", f"${overall['Total_Intervention']:,.0f}")
                with col2:
                    st.metric("Total Expected Savings", f"${overall['Total_Savings']:,.0f}")
                with col3:
                    benefit_class = "positive-roi" if overall['Net_Benefit'] > 0 else "negative-roi"
                    st.markdown(f"**Net Benefit:** <span class='{benefit_class}'>${overall['Net_Benefit']:,.0f}</span>", unsafe_allow_html=True)
                with col4:
                    roi_class = "positive-roi" if overall['Overall_ROI'] > 0 else "negative-roi"
                    st.markdown(f"**Overall ROI:** <span class='{roi_class}'>{overall['Overall_ROI']:.1f}%</span>", unsafe_allow_html=True)
                
                # Tier Separation Graphs
                st.markdown("#### 📈 Risk Tier Separation Analysis")
                tier_graphs = dashboard.create_tier_separation_graphs(df)
                st.plotly_chart(tier_graphs, use_container_width=True)
                
                # Aggregate ROI Chart
                st.markdown("#### 🏢 Aggregate ROI Analysis")
                aggregate_chart = dashboard.create_aggregate_roi_chart(cost_benefit_data['aggregate_analysis'])
                st.plotly_chart(aggregate_chart, use_container_width=True)
            
            # Multi-window comparison
            if len(results) > 1:
                st.markdown("### 🔍 Multi-Window Advanced Comparison")
                fig4 = dashboard.create_multi_window_comparison(results)
                st.plotly_chart(fig4, use_container_width=True)
    
    elif analysis_type == "👤 Individual Patient":
        st.header("Individual Patient Risk Assessment - Advanced")
        st.info("🎯 Advanced ROI calculations with time-scaled intervention costs")
        
        # Patient input form
        st.markdown("### Patient Information")
        
        # Basic demographics
        col1, col2 = st.columns(2)
        
        with col1:
            age = st.number_input("Age", min_value=0, max_value=120, value=65)
            gender = st.selectbox("Gender", ["M", "F"])
            is_female = 1 if gender == "F" else 0
            is_elderly = 1 if age >= 65 else 0
            annual_cost = st.number_input("Annual Healthcare Cost ($)", min_value=0, value=10000)
            frailty_score = st.slider("Frailty Score", min_value=0.0, max_value=5.0, value=1.0, step=0.1)
            complexity_index = st.slider("Complexity Index", min_value=0.0, max_value=20.0, value=5.0, step=0.1)
        
        with col2:
            st.markdown("**Chronic Conditions**")
            has_esrd = st.checkbox("ESRD (End-Stage Renal Disease)")
            has_alzheimers = st.checkbox("Alzheimer's Disease")
            has_chf = st.checkbox("CHF (Congestive Heart Failure)")
            has_ckd = st.checkbox("CKD (Chronic Kidney Disease)")
            has_cancer = st.checkbox("Cancer")
            has_copd = st.checkbox("COPD")
            has_depression = st.checkbox("Depression")
            has_diabetes = st.checkbox("Diabetes")
            has_ischemic_heart = st.checkbox("Ischemic Heart Disease")
            has_ra_oa = st.checkbox("Rheumatoid Arthritis/Osteoarthritis")
            has_stroke = st.checkbox("Stroke")
        
        # Healthcare utilization metrics
        st.markdown("### Healthcare Utilization (Past Year)")
        col3, col4 = st.columns(2)
        
        with col3:
            total_admissions = st.number_input("Total Hospital Admissions", min_value=0, value=1)
            total_hospital_days = st.number_input("Total Hospital Days", min_value=0, value=5)
            days_since_last_admission = st.number_input("Days Since Last Admission", min_value=0, value=30)
            recent_admission = 1 if days_since_last_admission <= 30 else 0
        
        with col4:
            total_outpatient_visits = st.number_input("Total Outpatient Visits", min_value=0, value=10)
            high_outpatient_user = 1 if total_outpatient_visits > 12 else 0
            total_inpatient_cost = st.number_input("Total Inpatient Cost ($)", min_value=0, value=5000)
            cost_percentile = st.slider("Cost Percentile", min_value=0.0, max_value=1.0, value=0.5, step=0.01)
            high_cost = 1 if cost_percentile > 0.8 else 0
        
        # Prepare patient data with all 27 features
        patient_data = {
            'age': age,
            'is_female': is_female,
            'is_elderly': is_elderly,
            'race_encoded': 0,  # Excluded as requested
            'has_esrd': 1 if has_esrd else 0,
            'has_alzheimers': 1 if has_alzheimers else 0,
            'has_chf': 1 if has_chf else 0,
            'has_ckd': 1 if has_ckd else 0,
            'has_cancer': 1 if has_cancer else 0,
            'has_copd': 1 if has_copd else 0,
            'has_depression': 1 if has_depression else 0,
            'has_diabetes': 1 if has_diabetes else 0,
            'has_ischemic_heart': 1 if has_ischemic_heart else 0,
            'has_ra_oa': 1 if has_ra_oa else 0,
            'has_stroke': 1 if has_stroke else 0,
            'total_admissions_2008': total_admissions,
            'total_hospital_days_2008': total_hospital_days,
            'days_since_last_admission': days_since_last_admission,
            'recent_admission': recent_admission,
            'total_outpatient_visits_2008': total_outpatient_visits,
            'high_outpatient_user': high_outpatient_user,
            'total_annual_cost': annual_cost,
            'cost_percentile': cost_percentile,
            'high_cost': high_cost,
            'total_inpatient_cost': total_inpatient_cost,
            'frailty_score': frailty_score,
            'complexity_index': complexity_index
        }
        
        if st.button("Analyze Patient Risk - Advanced"):
            with st.spinner("Analyzing patient risk with advanced logic..."):
                patient_results = dashboard.individual_patient_analysis(patient_data)
            
            st.success("Advanced patient risk analysis complete")
            
            # Display results
            st.subheader("🎯 Advanced Risk Assessment Results")
            
            # Summary metrics first
            st.markdown("### 📊 Summary Overview")
            col1, col2, col3, col4 = st.columns(4)
            
            max_tier = max(data['tier'] for data in patient_results.values())
            positive_windows = sum(1 for data in patient_results.values() if data['roi_percent'] > 0)
            avg_roi = np.mean([data['roi_percent'] for data in patient_results.values()])
            total_net_benefit = sum(data['net_benefit'] for data in patient_results.values())
            
            with col1:
                st.metric("Highest Risk Tier", f"{max_tier}/5 - {dashboard.tier_labels[max_tier]}")
            with col2:
                st.metric("Positive ROI Windows", f"{positive_windows}/3")
            with col3:
                roi_class = "positive-roi" if avg_roi > 0 else "negative-roi"
                st.markdown(f"**Average ROI:** <span class='{roi_class}'>{avg_roi:.1f}%</span>", unsafe_allow_html=True)
            with col4:
                benefit_class = "positive-roi" if total_net_benefit > 0 else "negative-roi"
                st.markdown(f"**Total Net Benefit:** <span class='{benefit_class}'>${total_net_benefit:,.0f}</span>", unsafe_allow_html=True)
            
            # Window-wise detailed analysis
            st.markdown("### 📈 Window-Wise Detailed Analysis")
            
            for window_key in ['30_day', '60_day', '90_day']:
                if window_key in patient_results:
                    data = patient_results[window_key]
                    window_num = window_key.split('_')[0]
                    
                    with st.expander(f"🔍 {window_num}-Day Window Analysis - Tier {data['tier']}/5 ({data['tier_label']})"):
                        col1, col2 = st.columns(2)
                        
                        with col1:
                            st.markdown("**Risk Assessment**")
                            st.write(f"• Risk Score: {data['risk_score']:.4f}")
                            st.write(f"• Risk Tier: {data['tier']}/5 - {data['tier_label']}")
                            st.write(f"• Success Rate: {data['success_rate']*100:.1f}%")
                            st.write(f"• Success Range: {data['success_rate_range']}")
                            
                        with col2:
                            st.markdown("**Financial Analysis**")
                            st.write(f"• Projected Cost: ${data['projected_cost']:,.2f}")
                            st.write(f"• Intervention Cost: ${data['intervention_cost']:,.2f}")
                            st.write(f"• Expected Savings: ${data['expected_savings']:,.2f}")
                            st.write(f"• Net Benefit: ${data['net_benefit']:,.2f}")
                        
                        # ROI indicator
                        roi_class = "positive-roi" if data['roi_percent'] > 0 else "negative-roi"
                        st.markdown(f"**ROI:** <span class='{roi_class}'>{data['roi_percent']:.1f}%</span>", unsafe_allow_html=True)
                        
                        # Progress bar for visualization
                        roi_normalized = min(abs(data['roi_percent']) / 100, 1.0)
                        if data['roi_percent'] > 0:
                            st.progress(roi_normalized, f"Positive ROI: {data['roi_percent']:.1f}%")
                        else:
                            st.progress(roi_normalized, f"Negative ROI: {data['roi_percent']:.1f}%")
            
            # Create visualization
            st.markdown("### 📊 Visual Analysis")
            fig = dashboard.create_individual_patient_chart(patient_results)
            st.plotly_chart(fig, use_container_width=True)
            
            # Detailed results table
            st.markdown("### 📋 Complete Results Table")
            
            results_data = []
            for window, data in patient_results.items():
                window_label = window.replace('_', '-').upper()
                roi_value = data['roi_percent']
                
                # Add emoji indicators for positive/negative ROI
                roi_indicator = "📈" if roi_value > 0 else "📉" if roi_value < 0 else "➖"
                
                results_data.append({
                    'Window': window_label,
                    'Risk Score': f"{data['risk_score']:.4f}",
                    'Risk Tier': f"{data['tier']}/5 - {data['tier_label']}",
                    'Success Rate': f"{data['success_rate']*100:.1f}%",
                    'Intervention Cost': f"${data['intervention_cost']:,.2f}",
                    'Expected Savings': f"${data['expected_savings']:,.2f}",
                    'Net Benefit': f"${data['net_benefit']:,.2f}",
                    'ROI (%)': f"{roi_indicator} {roi_value:.1f}%"
                })
            
            results_df = pd.DataFrame(results_data)
            st.dataframe(results_df, use_container_width=True)
            
            # Add color-coded summary below the table
            st.markdown("### 🎯 ROI Summary")
            for window, data in patient_results.items():
                window_label = window.replace('_', '-').upper()
                roi_value = data['roi_percent']
                if roi_value > 0:
                    st.markdown(f"**{window_label}:** 📈 <span class='positive-roi'>{roi_value:.1f}% Positive ROI</span>", unsafe_allow_html=True)
                elif roi_value < 0:
                    st.markdown(f"**{window_label}:** 📉 <span class='negative-roi'>{roi_value:.1f}% Negative ROI</span>", unsafe_allow_html=True)
                else:
                    st.markdown(f"**{window_label}:** ➖ {roi_value:.1f}% Break-even ROI")
            
            # Recommendations
            st.markdown("### 🏥 Clinical Recommendations")
            
            max_tier = max(data['tier'] for data in patient_results.values())
            positive_windows = sum(1 for data in patient_results.values() if data['roi_percent'] > 0)
            
            if max_tier >= 4:
                st.warning("⚠️ **High Risk Detected** - Immediate intervention recommended")
                st.info(f"💡 Investment justified in {positive_windows}/3 windows with positive ROI")
            elif max_tier == 3:
                st.info("ℹ️ **Moderate Risk** - Proactive care coordination recommended")
                st.info(f"💡 Consider intervention in {positive_windows}/3 windows with positive ROI")
            else:
                st.success("✅ **Low Risk** - Routine monitoring recommended")
                st.info(f"💡 Limited intervention value (positive ROI in {positive_windows}/3 windows)")
    
    else:  # Advanced Comparison
        st.header("Advanced Comparison Analysis")
        st.markdown("### 🔬 Side-by-Side Advanced Analysis")
        
        # Run both analyses for comparison
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Organization Analysis**")
            use_full_comparison = st.checkbox("Use Full Dataset", value=True, key="comp_full")
        
        with col2:
            st.markdown("**Individual Patient**")
            st.markdown("*Use Individual Patient tab for detailed analysis*")
        
        if st.button("Run Advanced Comparison"):
            with st.spinner("Running advanced comparison analysis..."):
                # Organization analysis
                org_results = dashboard.organization_analysis([30, 60, 90], use_full_comparison)
                
                # Create comparison charts
                st.markdown("### 🏢 Organization-Level Advanced Results")
                
                for window, df in org_results.items():
                    window_label = f"{window}-DAY"
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        fig1 = dashboard.create_tier_distribution_chart(df)
                        st.plotly_chart(fig1, use_container_width=True)
                    
                    with col2:
                        fig2 = dashboard.create_roi_by_tier_chart(df)
                        st.plotly_chart(fig2, use_container_width=True)
                    
                    # Summary metrics
                    with st.expander(f"{window_label} Advanced Summary"):
                        col1, col2, col3, col4 = st.columns(4)
                        with col1:
                            st.metric("High Risk Patients", len(df[df['tier'] >= 4]))
                        with col2:
                            avg_roi = df['roi_percent'].mean()
                            roi_class = "positive-roi" if avg_roi > 0 else "negative-roi"
                            st.markdown(f"**Avg ROI:** <span class='{roi_class}'>{avg_roi:.1f}%</span>", unsafe_allow_html=True)
                        with col3:
                            positive_roi = len(df[df['roi_percent'] > 0])
                            st.metric("Positive ROI", f"{positive_roi} ({positive_roi/len(df)*100:.1f}%)")
                        with col4:
                            total_benefit = df['net_benefit'].sum()
                            benefit_class = "positive-roi" if total_benefit > 0 else "negative-roi"
                            st.markdown(f"**Net Benefit:** <span class='{benefit_class}'>${total_benefit:,.0f}</span>", unsafe_allow_html=True)
                
                # Multi-window comparison
                st.markdown("### 🔍 Advanced Multi-Window Comparison")
                fig3 = dashboard.create_multi_window_comparison(org_results)
                st.plotly_chart(fig3, use_container_width=True)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #666;'>
        <p><strong>Advanced Healthcare Risk Prediction Dashboard</strong></p>
        <p>🚀 Using superior ROI logic from evaluation/02_roi_calculation.py</p>
        <p>✨ Features: Time-scaled costs | Window-specific success rates | 100% ROI cap | Advanced visualizations</p>
        <p>📊 Organization Analysis: Full 3,000 patient dataset | Individual Patient: Real-time advanced assessment</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
