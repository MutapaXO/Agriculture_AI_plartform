from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from groq import Groq
import os
import time

# =========================
# FLASK APP
# =========================
app = Flask(__name__)
CORS(app)

# =========================
# GROQ CLIENT
# =========================
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
) 

# =========================
# CENTRAL SENSOR STORAGE
# =========================
sensor_data = {
    "temperature": 27,
    "humidity": 45,
    "tds": 520,
    "water_level": 78,
    "light_level": 650,
    "ph": 6.2,
    "plant": "Lettuce",
    "week": 2
}

relay_states = {
    "pump1": False,
    "pump2": False,
    "pump3": False,
    "pump4": False,
    "light": False,
    "auto_mode": False
}

# =========================
# AI & VISION CACHE (Step 1 & 2 Applied)
# =========================
latest_ai_analysis = "AI is generating analysis..."

# Pending Task: Add Vision Data Object
latest_vision_data = {
    "plant": "Not Detected",
    "growth_stage": "Unknown",
    "condition": "Waiting for Image"
}

# =========================
# SENSOR DATA ROUTES
# =========================
@app.route('/api/sensor-data')
def get_sensor_data():
    return jsonify(sensor_data)

@app.route("/update-sensors", methods=["POST"])
def update_sensors():
    global sensor_data
    sensor_data = request.json
    return jsonify({"success": True, "message": "Sensor data updated"})

# =========================
# AI ANALYSIS ROUTE (Cache Removed for Freshness)
# =========================
@app.route("/api/ai-analysis")
def ai_analysis():
    global latest_ai_analysis
    global latest_vision_data

    try:
        print("Generating fresh AI analysis from Groq...") # Verification log
        
        prompt = f"""
        Analyze this hydroponic farming system.
        Temperature: {sensor_data['temperature']}°C
        Humidity: {sensor_data['humidity']}%
        TDS: {sensor_data['tds']}
        Water Level: {sensor_data['water_level']}%
        Light Level: {sensor_data['light_level']}
        pH: {sensor_data['ph']}
        Plant: {sensor_data.get('plant', 'Lettuce')}
        Week: {sensor_data.get('week', 2)}

        Provide: growth stage, deficiencies, warnings, and recommendations.
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        latest_ai_analysis = response.choices[0].message.content

    except Exception as e:
        print("AI ERROR:", e)

    # Return both Analysis and Vision (Step 2 Applied)
    return jsonify({
        "analysis": latest_ai_analysis,
        "vision": latest_vision_data
    })

# =========================
# IMAGE & CONTROL ROUTES (Preserved)
# =========================
@app.route("/upload-image", methods=["POST"])
def upload_image():
    image_data = request.data
    os.makedirs("static/uploads", exist_ok=True)
    with open("static/uploads/latest.jpg", "wb") as f:
        f.write(image_data)
    return jsonify({"success": True})

@app.route("/latest-image")
def latest_image():
    return send_from_directory("static/uploads", "latest.jpg")

@app.route('/api/control', methods=['POST'])
def control_device():
    global relay_states
    data = request.json
    device, state = data.get("device"), data.get("state")
    if device in relay_states:
        relay_states[device] = state
    return jsonify({"success": True, "relay_states": relay_states})

@app.route('/api/commands')
def get_commands():
    return jsonify(relay_states)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)