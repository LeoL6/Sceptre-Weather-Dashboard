from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import xarray as xr
import numpy as np
import datetime
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request body model ---
class WeatherRequest(BaseModel):
    lat: float
    lon: float
    date: str  # format: YYYY-MM-DD
    types: List[str]  # e.g., ["Temperature", "Rainfall", "Wind"]

# --- Helper function to get MERRA2 prefix ---
def prefix_for_year(y):
    if y <= 1991: return "MERRA2_100"
    if y <= 2000: return "MERRA2_200"
    if y <= 2010: return "MERRA2_300"
    return "MERRA2_400"

def dataset_info_for_var(var_name: str):
    if var_name in ["T2M", "U50M", "V50M"]:
        return "M2T1NXSLV.5.12.4", "slv"
    elif var_name in ["PRECTOT", "PRECSNO"]:
        return "M2T1NXFLX.5.12.4", "flx"
    elif var_name in ["DUSMASS"]:
        return "M2T1NXAER.5.12.4", "aer"
    else:
        raise ValueError(f"Unknown variable: {var_name}")

def seasonal_average(var_name, lat, lon, month, day):
    """
    Compute the long-term hourly average for a given variable on a given day.
    """
    collection, mid = dataset_info_for_var(var_name)
    base_url = f"https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/{collection}"

    all_years = range(1995, 2025)
    hourly_sum = np.zeros(24)
    count = 0

    for year in all_years:
        prefix = prefix_for_year(year)
        fname = f"{prefix}.tavg1_2d_{mid}_Nx.{year}{month:02d}{day:02d}.nc4"
        url = f"{base_url}/{year}/{month:02d}/{fname}"
        try:
            ds = xr.open_dataset(url)
            values = ds[var_name].sel(lat=lat, lon=lon, method="nearest").values[:24]
            hourly_sum += values
            count += 1
        except Exception:
            continue

    return hourly_sum / count if count > 0 else np.zeros(24)

def recent_anomaly(var_name, lat, lon, month, day, seasonal_avg, recent_years=5):
    """
    Compute average deviation from seasonal average over the last `recent_years`.
    """
    collection, mid = dataset_info_for_var(var_name)
    base_url = f"https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap/MERRA2/{collection}"

    anomaly_sum = np.zeros(24)
    count = 0
    current_year = datetime.datetime.now().year

    for y in range(current_year - recent_years, current_year):
        prefix = prefix_for_year(y)
        fname = f"{prefix}.tavg1_2d_{mid}_Nx.{y}{month:02d}{day:02d}.nc4"
        url = f"{base_url}/{y}/{month:02d}/{fname}"
        try:
            ds = xr.open_dataset(url)
            values = ds[var_name].sel(lat=lat, lon=lon, method="nearest").values[:24]
            anomaly_sum += (values - seasonal_avg)
            count += 1
        except Exception:
            continue

    return anomaly_sum / count if count > 0 else np.zeros(24)

def combined_prediction(var_name, lat, lon, target_date):
    month, day = target_date.month, target_date.day

    seasonal_avg = seasonal_average(var_name, lat, lon, month, day)
    anomaly = recent_anomaly(var_name, lat, lon, month, day, seasonal_avg)

    predicted = seasonal_avg + anomaly

    # Unit conversion for specific variables
    if var_name == "T2M":
        predicted -= 273.15  # K -> °C
    elif var_name in ["PRECTOT", "PRECSNO"]:
        predicted *= 3600  # m/s to mm/hour

    return predicted.tolist()

@app.post("/get_weather")
async def get_weather(req: WeatherRequest):
    lat, lon = req.lat, req.lon
    target_date = datetime.datetime.strptime(req.date, "%Y-%m-%d").date()

    results = {}
    for wtype in req.types:
        if wtype == "Temperature":
            results["temperature"] = combined_prediction("T2M", lat, lon, target_date)
        elif wtype == "Rainfall":
            results["rainfall"] = combined_prediction("PRECTOT", lat, lon, target_date)
        elif wtype == "Snowfall":
            results["snowfall"] = combined_prediction("PRECSNO", lat, lon, target_date)
        elif wtype == "Dust":
            results["dust"] = combined_prediction("DUSMASS", lat, lon, target_date)
        elif wtype == "Wind":
            results["wind"] = combined_prediction("V50M", lat, lon, target_date)

    return results
