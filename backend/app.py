import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go

from weather_client import get_solar_weather
from physics_engine import calculate_physics_baseline
from soiling_kalman import SoilingKalmanFilter
from fault_classifier import classify_fault

st.set_page_config(page_title="HelioSense | AI Virtual Sensor", layout="wide", page_icon="☀️")

# Header
st.title("☀️ HelioSense: Physics-Informed Solar PV Virtual Sensor")
st.caption("Team LOCALHOST | Zero-Hardware Soiling & Fault Diagnostics via Inverter Telemetry")

# Sidebar Controls
st.sidebar.header("🎛️ Live Scenario Simulator")
soiling_loss_pct = st.sidebar.slider("Simulate Surface Soiling / Dust (%)", 0, 50, 20)
diode_fault = st.sidebar.checkbox("Inject Bypass Diode Failure (String 2)", value=False)
wash_panels = st.sidebar.button("🧼 Wash Panels (Simulate Cleaning)", type="primary")

if wash_panels:
    soiling_loss_pct = 0
    st.sidebar.success("Panels Washed! Soiling Index restored to 1.00")

st.sidebar.markdown("---")
st.sidebar.header("💰 Economic Parameters")
tariff_rate = st.sidebar.number_input("Grid Electricity Tariff ($/kWh)", value=0.14, step=0.01)
cleaning_cost = st.sidebar.number_input("Cleaning Service Cost ($)", value=45.0, step=5.0)

# 1. Fetch & Compute Data
weather_df = get_solar_weather()
sim_df = calculate_physics_baseline(weather_df, array_capacity_kw=5.0)

# Apply Simulated Anomalies
soiling_factor = 1.0 - (soiling_loss_pct / 100.0)
voltage_factor = 0.67 if diode_fault else 1.0

sim_df['i_actual'] = sim_df['i_modeled'] * soiling_factor
sim_df['v_actual'] = sim_df['v_modeled'] * voltage_factor
sim_df['p_actual_kw'] = (sim_df['v_actual'] * sim_df['i_actual']) / 1000.0

# 2. Kalman Filter Decoupling
kf = SoilingKalmanFilter(initial_si=1.0)
si_history = []
for _, row in sim_df.iterrows():
    si_history.append(kf.update(row['p_actual_kw'], row['p_modeled_kw']))
sim_df['soiling_index'] = si_history
current_si = sim_df['soiling_index'].iloc[12] if len(sim_df) > 12 else sim_df['soiling_index'].iloc[-1]

# 3. Financial Metrics
energy_lost_kwh = float(np.sum(np.clip(sim_df['p_modeled_kw'] - sim_df['p_actual_kw'], 0, None)))
daily_revenue_lost = energy_lost_kwh * tariff_rate
rain_prob_max = float(sim_df['rain_prob'].max())

# Top KPI Metric Cards
c1, c2, c3, c4 = st.columns(4)
c1.metric("Soiling Health Index (SI)", f"{current_si:.2f}", f"{-soiling_loss_pct}% Transmission", delta_color="inverse")
c2.metric("Yield Loss (Today)", f"{energy_lost_kwh:.1f} kWh", f"${daily_revenue_lost:.2f} Lost / Day", delta_color="inverse")

if diode_fault:
    c3.error("🚨 CRITICAL FAULT: Bypass Diode (33% V_mp Drop)")
elif current_si < 0.85:
    c3.warning("⚠️ SOILING DETECTED: Efficiency Dropping")
else:
    c3.success("✅ SYSTEM HEALTHY: Operating Optimally")

# Economic Dispatch Decision
if (daily_revenue_lost * 7 > cleaning_cost) and (rain_prob_max < 30.0):
    c4.warning(f"DISPATCH CLEANING: ROI Positive (${daily_revenue_lost*7:.1f} lost/wk)")
elif rain_prob_max >= 30.0:
    c4.info(f"HOLD WASH: Rain Prob {rain_prob_max:.0f}% within 72h")
else:
    c4.success("NO ACTION NEEDED: Below Cost Threshold")

st.markdown("---")

# Main Visualization Chart
st.subheader("📊 Real-Time Telemetry vs. Physics Theoretical Baseline")
fig = go.Figure()
fig.add_trace(go.Scatter(
    x=sim_df['timestamp'], y=sim_df['p_modeled_kw'],
    name="Theoretical Clean Baseline (Physics Model)",
    line=dict(color="#00CC96", width=2, dash="dash")
))
fig.add_trace(go.Scatter(
    x=sim_df['timestamp'], y=sim_df['p_actual_kw'],
    name="Actual Inverter Generation (kW)",
    line=dict(color="#636EFA", width=3),
    fill='tozeroy', fillcolor='rgba(99, 110, 250, 0.15)'
))
fig.update_layout(
    xaxis_title="Time of Day (UTC)",
    yaxis_title="Power Output (kW)",
    hovermode="x unified",
    margin=dict(l=20, r=20, t=30, b=20),
    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
)
st.plotly_chart(fig, use_container_width=True)
