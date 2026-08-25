# ☀️ HELIOSENSE: Physics-Informed Virtual Sensor & 3D Digital Twin for Zero-Hardware Solar PV Diagnostics

> **Team Name:** LOCALHOST  
> **Domain / Track:** Renewable Energy Systems | Physics-Informed AI (PIML) | Digital Twins | Smart Energy Management  
> **Live Cloud Deployment:** [krxgen.onrender.com](https://krxgen.onrender.com)  
> **Core Innovation:** Utility-grade solar PV asset performance monitoring, decoupled soiling estimation, thermal hotspot protection, and automated Telegram work-order dispatch — delivered with **$0 Hardware CAPEX**.

---

## 📌 Executive Summary & Problem Statement

Distributed photovoltaic (PV) installations routinely suffer **15% to 25% annual yield degradation** caused by unmonitored surface soiling (dust, industrial soot, agricultural grime) and localized hardware failures (such as blown bypass diodes and cell micro-cracks).

### The "Sensor Paradox"
Conventional diagnostic solutions rely on capital-intensive hardware retrofits — optical soiling stations ($2,000–$5,000/site), reference pyranometers, and thermographic drone flights. Because these sensors often cost more than the inverters themselves, **over 90% of commercial and residential rooftop solar arrays remain unmonitored**. Plant operators either wash panels on blind calendar schedules (wasting thousands of liters of water in arid regions) or react months after compounding revenue losses.

### The HelioSense Solution
**HelioSense** is a full-stack, cloud-native virtual sensor platform that eliminates hardware sensors entirely. By mathematically coupling standard inverter telemetry ($V_{mp}, I_{mp}, P_{ac}$) with live satellite weather feeds (Open-Meteo / NASA), HelioSense isolates true physical degradation from transient atmospheric fluctuations using:
1. **1-Diode 5-Parameter Semiconductor Physics** (Sandia & pvlib kinematics)
2. **Discrete-Time Kalman Filtering** (Decoupling high-frequency cloud noise from low-frequency soiling)
3. **Physics-Informed Machine Learning (PIML)** (100-tree ensemble classifier predicting electrical anomalies and feature attributions)
4. **Interactive 3D Digital Twin & Thermal Hotspot Estimator** (Three.js / React Three Fiber)
5. **Opportunity-Aware Economic Dispatch & Telegram Field Bot Integration** (Real-time SMS/Telegram field tickets with autonomous wash loop)

---

## ⚡ Key System Features

```
                                  ┌──────────────────────────────────────────────┐
                                  │           HELIOSENSE SYSTEM STACK            │
                                  └──────────────────────┬───────────────────────┘
                                                         │
         ┌───────────────────────────────────────────────┼───────────────────────────────────────────────┐
         ▼                                               ▼                                               ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│     Physics-Informed Core       │             │       3D Solar Twin & HUD       │             │   Field Dispatch & Governance   │
├─────────────────────────────────┤             ├─────────────────────────────────┤             ├─────────────────────────────────┤
│ • 1-Diode Equivalent Circuit    │             │ • 15-Panel 3D Twin (3 Strings)  │             │ • Breakeven Net ROI Solver      │
│ • Sandia Cell Thermal Dynamics  │             │ • Dynamic Sun Alt/Azimuth Light │             │ • 72h Rain Lockout Suppression  │
│ • 2-State Kalman Soiling Filter │             │ • 80°C - 200°C Hotspot Modeling │             │ • Telegram Bot Dispatch Loop    │
│ • PIML Ensemble Classifier (AI) │             │ • Time-of-Day Daylight Scrubber │             │ • Scope-2 Carbon Debt Ledger    │
│ • Feature Vectors (V/I Ratios)  │             │ • Multi-Week Accretion Engine   │             │ • Verifiable ESG Audit Download │
└─────────────────────────────────┘             └─────────────────────────────────┘             └─────────────────────────────────┘
```

### 1. Zero-Hardware Virtual Sensor Engine
* **Clean Baseline Modeling ($P_{\text{modeled}}$):** Uses solar kinematics (Perez diffuse radiation, astronomical positioning) and empirical module specs ($I_{sc}, V_{oc}, P_{mp}, \alpha_{Isc}, \beta_{Voc}$) to compute the theoretical clean power output under live weather conditions.
* **PIML AI Correction ($P_{\text{piml}}$):** A machine-learning ensemble corrects naive physics predictions for unmodeled incidence angle modifier (IAM) and localized wind-cooling effects.

### 2. Decoupled Soiling Index ($SI$) via Kalman State Estimation
* **Cloud Noise Rejection:** Passing clouds cause sharp, temporary current drops (seconds/minutes), whereas particulate deposition is slow and monotonic (days/weeks).
* **State Filter:** A discrete-time Kalman filter tracks the transmission factor ($0.00 \le SI \le 1.00$), ensuring transient weather events do not trigger false wash alarms.

### 3. Multi-String Electrical Fault Fingerprinting
Distinguishes between front-glass dust and physical semiconductor faults through $I$-$V$ deviation signatures:
* **Uniform Surface Soiling:** Symmetric current drop ($I_{mp} \downarrow$) with stable voltage ($V_{mp} \approx \text{const}$).
* **Bypass Diode Short / Hard Shading:** Voltage drops in discrete 33.3% steps per bypassed sub-string ($\Delta V_{mp} \approx -33.3\%$ or $-66.7\%$) while current remains stable ($I_{mp} \approx \text{const}$).
* **PID / Micro-cracking:** Fill Factor ($FF$) degradation and series resistance ($R_s$) escalation visible during morning/evening irradiance ramps.

### 4. Interactive 3D Digital Twin & Thermal Hotspot Modeling
* **15 Solar Panels across 3 Strings:** 3D visualization built with Three.js / React Three Fiber with customizable camera controls (Rotate, Pan, Zoom).
* **Dynamic Sun Position:** Directional sunlight coordinates, atmospheric warmth, and shadow lengths dynamically track the solar elevation ($0^\circ \to 75^\circ$) and azimuth angle from Dawn (6:00 AM) to Dusk (6:00 PM).
* **Reverse-Bias Hotspot Simulation:** Models localized power dissipation when a shaded/bypassed cell is forced into reverse bias ($P_{\text{dissipated}} = I_{\text{string}} \cdot V_{\text{rev}}$), clamping hotspot temperatures strictly within the physical **$80^\circ\text{C}$ to $200^\circ\text{C}$** window with visual 3D badges.

### 5. Time-of-Day Scrubber & Multi-Week Accretion Engine
* **24-Hour Timeline Scrubber:** Allows operators to drag through daylight hours (6:00 AM – 6:00 PM) to observe instantaneous power, voltage ratios, current ratios, and sun angles.
* **Autonomous Multi-Week Dust Accretion:** Models natural continuous particulate accumulation ($\approx 1.35\%/\text{day}$):
  * **Day 1:** Pristine Clean ($SI = 1.00$)
  * **Day 7 (Week 1):** $\approx 8\%$ Soiling Loss
  * **Day 14 (Week 2):** $\approx 18\%$ Soiling Loss
  * **Day 21 (Week 3):** $\approx 27\%$ Soiling Loss *(Exceeds cleaning cost $\rightarrow$ Wash Order Triggered)*
  * **Day 28 (Week 4):** $\approx 37\%$ Soiling Loss *(Severe encrustation)*
* **Playback Speed Controller:** Interactive speed selector (**`1x`**, **`2x`**, **`3x`**, **`4x`**, **`8x Turbo`**) to simulate multi-week lifecycles smoothly without skipping days.

### 6. Opportunity-Aware Economic Dispatcher & Telegram Bot
* **ROI Solver:** Evaluates accumulated energy loss against cleaning service costs:
  $$\text{Accumulated Financial Loss } (₹) = \sum (P_{\text{modeled}} - P_{\text{actual}}) \times \text{Tariff } (₹/\text{kWh})$$
* **72-Hour Rain Check Override:** If the weather forecast predicts precipitation ($>5\text{ mm}$ rain with $>70\%$ probability) within 72 hours, cleaning orders are paused to conserve water.
* **Telegram Two-Way Autonomous Loop:**
  1. Operator dispatches work order to the field technician via Telegram bot (`@HelioSenseBot`).
  2. The technician cleans the array and replies `"yes"` on Telegram.
  3. The system captures the webhook, initiates a visual cleaning sequence, and resets the array to Day 1 Clean state ($SI = 1.00$).

### 7. Scope-2 Real-Time Carbon Ledger & Verifiable ESG Audit Trail
* **Real-Time Carbon Tracking:** Calculates daily and weekly avoidable carbon debt ($\text{kg CO}_2\text{e/day}$) using the CEA India v19 grid emission factor ($0.72\text{ kg CO}_2\text{e/kWh}$).
* **Instant ESG Audit Download:** Dedicated **`📥 ESG Audit`** button in the header downloads a signed JSON audit document for carbon credit verification and sustainability audits.

---

## 📊 Diagnostic Matrix: Fault vs. Soiling Fingerprints

| Defect / Condition | Current ($I_{mp}$) | Voltage ($V_{mp}$) | Power Residual ($\Delta P$) | Root Cause & Remediation |
| :--- | :---: | :---: | :---: | :--- |
| **Clean Baseline** | Nominal ($1.00$) | Nominal ($1.00$) | $< 0.05\text{ kW}$ | Array operating at peak physical efficiency. No action needed. |
| **Uniform Soiling** | **Drops ($\downarrow$)** | Normal ($\approx 1.00$) | Proportional to dust | Particulate deposition reduces transmittance. Schedule wash if ROI $> \text{Cost}$. |
| **Bypass Diode Fault** | Normal ($\approx 1.00$) | **Drops by $\approx 33.3\%$ ($\downarrow\downarrow$)** | Step loss on String 2 | Diode shorted/conducting; replace junction box diode to prevent hotspot fires. |
| **Rain Override** | Moderate drop | Normal | Variable | Rainfall detected in 72h forecast. Wash paused to let rain clean panels for free. |

---

## 🔬 Mathematical Formulations

### 1. Sandia Module Temperature Model
$$T_{\text{cell}} = T_{\text{amb}} + E_{\text{poa}} \cdot \exp(-a - b \cdot WS) + \frac{E_{\text{poa}}}{E_0} \cdot \Delta T$$
*(Open-rack polymer parameters: $a = -3.56, b = -0.075, E_0 = 1000\text{ W/m}^2, \Delta T = 3^\circ\text{C}$)*

### 2. 1-Diode 5-Parameter Electrical Circuit Equation
$$I = I_L - I_0 \left[ \exp\left(\frac{V + I R_s}{n N_s V_{th}}\right) - 1 \right] - \frac{V + I R_s}{R_{sh}}$$

### 3. Reverse-Bias Thermal Dissipation & Hotspot Temperature
$$P_{\text{dissipated}} = I_{\text{string}} \times V_{\text{reverse}}$$
$$T_{\text{hotspot}} = \text{clamp}\left(T_{\text{cell}} + (\theta_{\text{th}} \times P_{\text{dissipated}}), \, 80.0^\circ\text{C}, \, 200.0^\circ\text{C}\right)$$
*($\theta_{\text{th}} = 0.65^\circ\text{C/W}$ localized thermal dissipation resistance)*

### 4. Discrete Kalman Filter Soiling State
$$\mathbf{x}_k = \begin{bmatrix} SI_k \\ \dot{SI}_k \end{bmatrix}, \quad \mathbf{x}_{k|k-1} = \begin{bmatrix} 1 & \Delta t \\ 0 & 1 \end{bmatrix} \mathbf{x}_{k-1|k-1}$$
$$\tilde{y}_k = z_k - \mathbf{H} \hat{\mathbf{x}}_{k|k-1} \quad \text{where } z_k = \frac{P_{\text{actual}, k}}{P_{\text{modeled}, k}}$$

### 5. Economic Dispatch Objective Function
$$\text{Trigger Wash if: } \sum_{k=t}^{t+7\text{d}} (P_{\text{modeled}}(k) - P_{\text{actual}}(k)) \times \text{Tariff} > C_{\text{clean}} + C_{\text{water}}$$
$$\text{Subject to: } P(\text{Precipitation}_{t \to t+72\text{h}} \ge 5.0\text{ mm}) < 0.20$$

---

## 🌍 UN Sustainable Development Goals (SDGs)

* **SDG 7: Affordable & Clean Energy (Targets 7.2, 7.3):** Reclaims **10% to 18% of lost solar yield** purely through software optimization, increasing renewable generation without additional solar panel manufacturing footprints.
* **SDG 6: Clean Water & Sanitation (Target 6.4):** Prevents wasteful calendar cleaning in water-stressed arid regions (e.g., Rajasthan, Tamil Nadu), saving thousands of liters of clean water.
* **SDG 9: Industry, Innovation & Infrastructure (Target 9.4):** Delivers utility-grade predictive intelligence and digital twin capabilities to distributed commercial and residential rooftop solar arrays at **$0 Hardware CAPEX**.
* **SDG 13: Climate Action (Target 13.2):** Maximizes clean electricity generation, directly displacing fossil fuel grid energy and reducing Scope-2 greenhouse gas emissions.

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 | Ultra-fast client-side rendering with Hot Module Replacement |
| **3D Digital Twin** | Three.js / React Three Fiber / Drei | 15-panel solar twin, dynamic sun altitude, localized thermal hotspot shaders |
| **Styling & HUD** | Modern Glassmorphism CSS | Responsive dashboard, telemetry overlays, and theme design system |
| **Backend & Microservices** | FastAPI + Uvicorn (Python 3.11) | RESTful PIML diagnostic endpoints (`/api/diagnose/piml`) and static hosting |
| **Machine Learning** | Scikit-Learn (Random Forest & GBDT) | 100-tree physics-informed classifier with feature vector attributions |
| **Solar Kinematics** | pvlib-python, NumPy, SciPy | 1-diode model, Perez sky diffuse model, and Sandia thermal algorithms |
| **Weather Telemetry** | Open-Meteo Solar & Satellite API | Real-time global irradiance (GHI, DNI, DHI), ambient temperature, 72h rain |
| **Field Automation** | Telegram Bot API | Automated technician ticket dispatch and `"yes"` confirmation loop |

---

## 🚀 Running Locally

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)

### 2. Clone the Repository
```bash
git clone https://github.com/suhas-67/KRXGEN.git
cd KRXGEN
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Frontend Setup (in a separate terminal)
```bash
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 👥 Team LOCALHOST
Developed for **KRXGEN'26 Hackathon**
* **Repository:** [github.com/suhas-67/KRXGEN](https://github.com/suhas-67/KRXGEN)
* **Live Deployment:** [krxgen.onrender.com](https://krxgen.onrender.com)