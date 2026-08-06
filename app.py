from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from groq import Groq
import os
import time
import random # Added for simulation

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# =========================
# CENTRAL STORAGE (Preserved)
# =========================
sensor_data = {
    "temperature": 33, # Matches your high temp requirement
    "humidity": 45,
    "tds": 1050,
    "water_level": 78,
    "light_level": 450,
    "ph": 6.2,
    "plant": "Lettuce Romaine",
    "week": 3
}

relay_states = {
    "pump1": False,
    "pump2": False,
    "pump3": False,
    "pump4": False,
    "light": False,
    "auto_mode": False
}

latest_ai_analysis = "AI is currently analyzing the stressed environment..."

# Preserved: Lettuce Romaine Stress Scenario
latest_vision_data = {
    "plant": "Lettuce Romaine",
    "growth_stage": "3 weeks",
    "condition": "Moderate to Severe Stress"
}

# =========================
# ROUTES
# =========================

@app.route('/api/sensor-data')
def get_sensor_data():
    global sensor_data
    # ADDED: Simulated Light Intensity Drifter
    # This makes the light level move slightly on every refresh
    drift = random.randint(-20, 20)
    new_light = sensor_data.get("light_level", 450) + drift
    sensor_data["light_level"] = max(150, min(900, new_light)) 
    
    return jsonify(sensor_data)

@app.route("/update-sensors", methods=["POST"])
def update_sensors():
    global sensor_data
    sensor_data = request.json
    return jsonify({"success": True})

@app.route("/api/ai-analysis")
def ai_analysis():
    global latest_ai_analysis
    global latest_vision_data

    try:
        print("Generating fresh AI analysis for stressed crop...")
        prompt = f"""
        Analyze this hydroponic system (STRESS SCENARIO).
        Temp: {sensor_data['temperature']}C, TDS: {sensor_data['tds']}, Light: {sensor_data['light_level']}
        Plant: {latest_vision_data['plant']}, Condition: {latest_vision_data['condition']}
        Health Score is currently 44/100.
        Provide specific recommendations to reduce heat and mitigate stress.
        """
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        latest_ai_analysis = response.choices[0].message.content
    except Exception as e:
        print("AI ERROR:", e)

    return jsonify({"analysis": latest_ai_analysis, "vision": latest_vision_data})

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