import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardConcept() {
  // =========================
  // STATES (Preserving All Logic)
  // =========================
  const [relayStates, setRelayStates] = useState({
    pump1: false,
    pump2: false,
    pump3: false,
    light: false,
    pump4: false,
  });

  const [sensorData, setSensorData] = useState({
    temperature: "--",
    humidity: "--",
    tds: "--",
    water_level: "--",
    light_level: "--",
    ph: "6.2",
  });

  const [aiAnalysis, setAiAnalysis] = useState("AI is analyzing the farming environment...");
  
  const [visionData, setVisionData] = useState({
    plant: "Not Detected",
    growth_stage: "Unknown",
    condition: "Waiting for Image"
  });

  const [historyMetric, setHistoryMetric] = useState("Temperature");
  const [bioMetric, setBioMetric] = useState("Growth Tracking");

  // =========================
  // HELPERS
  // =========================
  const getConditionColor = () => {
    switch (visionData.condition) {
      case "Healthy": return "text-green-400";
      case "Moderate Stress": return "text-yellow-400";
      case "Moderate to Severe Stress": return "text-orange-400";
      case "Severe Stress": return "text-red-500";
      default: return "text-slate-400";
    }
  };

  // =========================
  // FETCH LOGIC (Live AI, No Cache)
  // =========================
  const fetchSensorData = async () => {
    try {
      const response = await fetch("https://agriculture-ai-backend.onrender.com/api/sensor-data");
      const data = await response.json();
      setSensorData({ ...data, ph: "6.2" });
    } catch (error) { console.error("Sensor Error:", error); }
  };

  const fetchAIAnalysis = async () => {
    try {
      const response = await fetch("https://agriculture-ai-backend.onrender.com/api/ai-analysis");
      const data = await response.json();
      setAiAnalysis(data.analysis);
      if (data.vision) setVisionData(data.vision);
    } catch (error) { console.error("AI Error:", error); }
  };

  const sendControlCommand = async (device, state) => {
    try {
      await fetch("https://agriculture-ai-backend.onrender.com/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device, state }),
      });
      setRelayStates(prev => ({ ...prev, [device]: state }));
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchSensorData();
    fetchAIAnalysis();
    const interval = setInterval(() => {
      fetchSensorData();
      fetchAIAnalysis();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // =========================
  // UI DATA MAPPING
  // =========================
  const sensors = [
    { label: "Temperature", value: `${sensorData.temperature}°C`, status: "Ideal", color: "border-green-400", glow: "shadow-green-500/30" },
    { label: "Humidity", value: `${sensorData.humidity}%`, status: "Moderate", color: "border-orange-400", glow: "shadow-orange-500/30" },
    { label: "TDS", value: `${sensorData.tds} ppm`, status: "Ideal", color: "border-green-400", glow: "shadow-green-500/30" },
    { label: "Water Level", value: `${sensorData.water_level}%`, status: "Good", color: "border-green-400", glow: "shadow-green-500/30" },
    { label: "Light", value: `${sensorData.light_level} lux`, status: "Low", color: "border-purple-400", glow: "shadow-purple-500/30" },
    { label: "pH Level", value: sensorData.ph, status: "Ideal", color: "border-green-400", glow: "shadow-green-500/30" },
  ];

  const biologicalGraphs = {
    "Growth Tracking": {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      datasets: [
        { label: "Ideal Curve", data: [10, 25, 45, 70, 100], borderColor: "#4ade80", tension: 0.4 },
        { label: "Expected Curve", data: [8, 22, 40, 65, 92], borderColor: "#22d3ee", tension: 0.4 },
        { label: "Current Growth", data: [6, 18, 35, 55, 80], borderColor: "#fb923c", tension: 0.4 },
      ],
    },
    "Plant Health": {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ label: "Health Score", data: [82, 84, 88, 90, 91, 92, 92], borderColor: "#4ade80", tension: 0.4 }],
    },
    "Stress Index": {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ label: "Stress Level", data: [40, 35, 30, 25, 22, 20, 18], borderColor: "#fb923c", tension: 0.4 }],
    },
  };

  return (
    <div className="min-h-screen bg-[#060816] text-white p-6">
      {/* HEADER (With Restored Dropdown Logic) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Agriculture Intelligence Platform</h1>
          <p className="text-slate-400 mt-2 text-lg">Unified AI monitoring for smart farming systems.</p>
        </div>
        <select className="bg-[#10182b] border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-lg outline-none cursor-pointer">
          <option>Hydroponic System NFT1A</option>
          <option>Poultry House 1A</option>
          <option>Aquaculture Pond 1A</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-6">
          {/* SENSOR CARDS (Original Fidelity) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sensors.map((sensor, index) => (
              <div key={index} className={`bg-[#10182b] rounded-3xl p-6 border ${sensor.color} shadow-2xl ${sensor.glow}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-300">{sensor.label}</h3>
                  <div className={`w-4 h-4 rounded-full border-2 ${sensor.color}`} />
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className={`w-32 h-32 rounded-full border-8 ${sensor.color} flex flex-col items-center justify-center`}>
                    <div className="text-2xl font-bold">{sensor.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{sensor.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI CROP INTELLIGENCE PANEL (Original Styling) */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-2xl font-semibold">AI Crop Intelligence</h2>
                <p className="text-slate-400 text-sm mt-1">Autonomous AI-powered agricultural reasoning.</p>
              </div>
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium">AI ACTIVE</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Growth Stage", val: visionData.growth_stage, color: "text-white" },
                { label: "Health Score", val: "92%", color: "text-green-400" },
                { label: "Risk Level", val: "LOW", color: "text-cyan-400" },
                { label: "Recommendation", val: "Increase light exposure", color: "text-white" }
              ].map((item, i) => (
                <div key={i} className="bg-[#0b1220] p-4 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm">{item.label}</p>
                  <h3 className={`text-lg font-semibold mt-2 ${item.color}`}>{item.val}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* HISTORICAL ANALYTICS */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-2xl font-semibold">Historical Analytics</h2>
                <p className="text-slate-400 text-sm mt-1">Environmental trend monitoring and system analytics.</p>
              </div>
              <select value={historyMetric} onChange={(e) => setHistoryMetric(e.target.value)} className="bg-[#0b1220] border border-slate-700 text-white px-4 py-2 rounded-xl outline-none">
                <option>Temperature</option><option>Humidity</option><option>TDS</option>
                <option>pH</option><option>Water Level</option><option>Light</option>
              </select>
            </div>
            <div className="relative h-72 bg-[#0b1220] rounded-2xl border border-slate-800 p-4">
              <Line data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [{ label: historyMetric, data: [22, 23, 24, 26, 25, 27, 28], borderColor: "#22d3ee", backgroundColor: "#22d3ee", tension: 0.4 }]
              }} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* GROWTH INTELLIGENCE (Fully Restored) */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-2xl font-semibold">Growth Intelligence</h2>
                <p className="text-slate-400 text-sm mt-1">AI predictive growth and biological analytics.</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl text-sm font-medium">Estimated Yield: 2.4kg</div>
                <select value={bioMetric} onChange={(e) => setBioMetric(e.target.value)} className="bg-[#0b1220] border border-slate-700 text-white px-4 py-2 rounded-xl outline-none">
                  <option>Growth Tracking</option><option>Plant Health</option><option>Stress Index</option>
                </select>
              </div>
            </div>
            <div className="relative h-72 bg-[#0b1220] rounded-2xl border border-slate-800 p-4">
              <Line data={biologicalGraphs[bioMetric]} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* LIVE PLANT INTELLIGENCE */}
          <div className="bg-[#10182b] rounded-3xl overflow-hidden shadow-xl border border-slate-800">
            <div className="p-5 border-b border-slate-800"><h2 className="text-xl font-semibold">Live Plant Intelligence</h2></div>
            <div className="aspect-video bg-black overflow-hidden">
              <img src={`https://agriculture-ai-backend.onrender.com/latest-image?t=${Date.now()}`} alt="Feed" className="w-full h-full object-cover" />
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Plant</span><span>{visionData.plant}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Growth Stage</span><span>{visionData.growth_stage}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Condition</span><span className={getConditionColor()}>{visionData.condition}</span></div>
            </div>
          </div>

          {/* SMART CONTROL CENTER (Task 1-4 Logic Preserved) */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-2xl font-semibold">Smart Control Center</h2>
                <p className="text-slate-400 text-sm mt-1">Remote monitoring and intelligent system control.</p>
              </div>
              <div className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl text-sm font-medium">MANUAL</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => sendControlCommand("pump1", !relayStates.pump1)} className={`rounded-2xl p-4 font-semibold border transition ${relayStates.pump1 ? "bg-green-500/20 border-green-400 shadow-green-500/40" : "bg-red-500/10 border-red-500/40"}`}>
                Water Pump <div className="text-xs mt-2">{relayStates.pump1 ? "ON" : "OFF"}</div>
              </button>
              <button onMouseDown={() => sendControlCommand("pump2", true)} onMouseUp={() => sendControlCommand("pump2", false)} onMouseLeave={() => sendControlCommand("pump2", false)} className={`rounded-2xl p-4 font-semibold border ${relayStates.pump2 ? "bg-green-500/20 border-green-400 shadow-green-500/40" : "bg-red-500/10 border-red-500/40"}`}>
                Nutrient Pump A <div className="text-xs mt-2">Hold To Dose</div>
              </button>
              <button onMouseDown={() => sendControlCommand("pump3", true)} onMouseUp={() => sendControlCommand("pump3", false)} onMouseLeave={() => sendControlCommand("pump3", false)} className={`rounded-2xl p-4 font-semibold border ${relayStates.pump3 ? "bg-green-500/20 border-green-400 shadow-green-500/40" : "bg-red-500/10 border-red-500/40"}`}>
                Nutrient Pump B <div className="text-xs mt-2">Hold To Dose</div>
              </button>
              <button onClick={() => sendControlCommand("light", !relayStates.light)} className={`rounded-2xl p-4 font-semibold border ${relayStates.light ? "bg-green-500/20 border-green-400 shadow-green-500/40" : "bg-red-500/10 border-red-500/40"}`}>
                LED Grow Lights <div className="text-xs mt-2">{relayStates.light ? "ON" : "OFF"}</div>
              </button>
              <button onClick={() => sendControlCommand("pump4", !relayStates.pump4)} className={`rounded-2xl p-4 font-semibold border col-span-2 ${relayStates.pump4 ? "bg-green-500/20 border-green-400 shadow-green-500/40" : "bg-red-500/10 border-red-500/40"}`}>
                Secondary Water Pump <div className="text-xs mt-2">{relayStates.pump4 ? "ON" : "OFF"}</div>
              </button>
            </div>
          </div>

          {/* DETAILED AI RECOMMENDATIONS (Restored Heading/Text) */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <h2 className="text-2xl font-semibold mb-2">Detailed AI Recommendations</h2>
            <p className="text-slate-400 text-sm mb-5">Advanced autonomous agricultural reasoning and optimization guidance.</p>
            <div className="bg-[#0b1220] rounded-2xl p-5 border border-slate-800 max-h-80 overflow-y-auto">
              <p className="whitespace-pre-line text-slate-300 leading-8 text-sm">{aiAnalysis}</p>
            </div>
          </div>

          {/* PLATFORM STATUS (Full Restoration) */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <h2 className="text-xl font-semibold mb-5">Platform Status</h2>
            <div className="space-y-4">
              {["AI Engine Online", "ESP32 Connected", "Cloud Sync Active", "Sensor Network Stable"].map((status, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-slate-300">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}