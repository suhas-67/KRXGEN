"""
HelioSense: FastAPI Server & PIML Diagnostic REST API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from fault_classifier import piml_classifier, PhysicsInformedFaultClassifier
from weather_client import get_solar_weather
from physics_engine import calculate_physics_baseline
from soiling_kalman import SoilingKalmanFilter

app = FastAPI(
    title="HelioSense PIML Diagnostic API",
    description="Physics-Informed Machine Learning Virtual Sensor & Fault Diagnostic Service for Solar PV Arrays",
    version="2.0.0",
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PIMLDiagnosticRequest(BaseModel):
    v_actual: float = Field(..., description="Actual measured MPPT string voltage (V)")
    v_modeled: float = Field(..., description="Modeled theoretical clean voltage (V)")
    i_actual: float = Field(..., description="Actual measured string current (A)")
    i_modeled: float = Field(..., description="Modeled theoretical clean current (A)")
    p_actual: float = Field(..., description="Actual measured DC power (kW)")
    p_modeled: float = Field(..., description="Modeled theoretical clean power (kW)")
    poa: Optional[float] = Field(750.0, description="Plane of Array / Global Horizontal Irradiance (W/m²)")
    temp_cell: Optional[float] = Field(40.0, description="Estimated PV cell temperature (°C)")


class PIMLDiagnosticResponse(BaseModel):
    predicted_class: str
    confidence: float
    class_probabilities: Dict[str, float]
    feature_attributions: str
    feature_vector: Dict[str, float]
    description: str





@app.get("/api/health")
def health():
    return {"status": "healthy", "piml_model_ready": piml_classifier.is_trained}


@app.post("/api/diagnose/piml", response_model=PIMLDiagnosticResponse)
def diagnose_piml(request: PIMLDiagnosticRequest):
    """
    Evaluates 6D dimensionless physics feature vector against the 100-Tree
    Physics-Informed Random Forest Classifier.
    """
    try:
        result = piml_classifier.predict(
            v_actual=request.v_actual,
            v_modeled=request.v_modeled,
            i_actual=request.i_actual,
            i_modeled=request.i_modeled,
            p_actual=request.p_actual,
            p_modeled=request.p_modeled,
            poa=request.poa,
            temp_cell=request.temp_cell,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PIML classification failed: {str(e)}")


@app.get("/api/telemetry")
def get_live_telemetry(lat: float = 10.7905, lon: float = 78.7047):
    """
    Returns 24-hour weather and physics baseline generation curves.
    """
    try:
        weather_df = get_solar_weather(lat, lon)
        sim_df = calculate_physics_baseline(weather_df, array_capacity_kw=5.0)
        return sim_df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Telemetry generation failed: {str(e)}")


# Serve React Frontend from dist/ folder
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(path):
            return FileResponse(path)
        return FileResponse(
            os.path.join(frontend_dist, "index.html"),
            headers={"Cache-Control": "no-cache, no-store, must-revalidate, max-age=0"}
        )



if __name__ == "__main__":
    import uvicorn
    print("Starting HelioSense FastAPI Server on http://localhost:8000 ...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

