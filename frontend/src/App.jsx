import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardConcept() {
  const [relayStates, setRelayStates] = useState({ pump1: false, pump2: false, pump3: false, light: false, pump4: false });
  const [sensorData, setSensorData] = useState({ temperature: 33, humidity: 45, tds: 1050, water_level: 78, light_level: 650, ph: "6.2" });
  const [aiAnalysis, setAiAnalysis] = useState("AI is analyzing the stressed environment...");
  const [visionData, setVisionData] = useState({ plant: "Lettuce Romaine", growth_stage: "3 weeks", condition: "Moderate to Severe Stress" });
  const [historyMetric, setHistoryMetric] = useState("Temperature");
  const [bioMetric, setBioMetric] = useState("Growth Tracking");

  const getConditionColor = () => {
    switch (visionData.condition) {
      case "Healthy": return "text-green-400";
      case "Moderate to Severe Stress": return "text-orange-400";
      default: return "text-slate-400";
    }
  };

  const fetchSensorData = async () => {
    try {
      const res = await fetch("https://agriculture-ai-backend.onrender.com/api/sensor-data");
      const data = await res.json();
      setSensorData(prev => ({ ...prev, ...data }));
    } catch (e) { console.error(e); }
  };

  const fetchAIAnalysis = async () => {
    try {
      const res = await fetch("https://agriculture-ai-backend.onrender.com/api/ai-analysis");
      const data = await res.json();
      setAiAnalysis(data.analysis);
      if (data.vision) setVisionData(data.vision);
    } catch (e) { console.error(e); }
  };

  const sendControlCommand = async (device, state) => {
    try {
      await fetch("https://agriculture-ai-backend.onrender.com/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device, state }),
      });
      setRelayStates(prev => ({ ...prev, [device]: state }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchSensorData();
    fetchAIAnalysis();
    const interval = setInterval(() => { fetchSensorData(); fetchAIAnalysis(); }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Biological Charts: Declining Health and Rising Stress
  const biologicalGraphs = {
    "Growth Tracking": {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      datasets: [
        { label: "Ideal Curve", data: [10, 25, 45, 70, 100], borderColor: "#4ade80", tension: 0.4 },
        { label: "Current Growth", data: [6, 18, 25, 30, 32], borderColor: "#ef4444", tension: 0.4 }, 
      ],
    },
    "Plant Health": {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ label: "Health Score", data: [88, 80, 72, 65, 58, 50, 44], borderColor: "#f87171", tension: 0.4 }],
    },
    "Stress Index": {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ label: "Stress Level", data: [20, 35, 50, 65, 75, 82, 88], borderColor: "#fb923c", tension: 0.4 }],
    },
  };

  const sensors = [
    { label: "Temperature", value: `${sensorData.temperature}°C`, status: "Critical", color: "border-red-400", glow: "shadow-red-500/30" },
    { label: "Humidity", value: `${sensorData.humidity}%`, status: "Moderate", color: "border-orange-400", glow: "shadow-orange-500/30" },
    { label: "TDS", value: `${sensorData.tds} ppm`, status: "Ideal", color: "border-green-400", glow: "shadow-green-500/30" },
    { label: "Water Level", value: `${sensorData.water_level}%`, status: "Good", color: "border-green-400", glow: "shadow-green-500/30" },
    { label: "Light", value: `${sensorData.light_level} lux`, status: "Healthy", color: "border-green-400", glow: "shadow-green-500/30" },
    { label: "pH Level", value: sensorData.ph, status: "Ideal", color: "border-green-400", glow: "shadow-green-500/30" },
  ];

  return (
    <div className="min-h-screen bg-[#060816] text-white p-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Agriculture Intelligence Platform</h1>
          <p className="text-slate-400 mt-2 text-lg">Unified AI monitoring for smart farming systems.</p>
        </div>
        <select className="bg-[#10182b] border border-slate-700 text-white px-5 py-3 rounded-2xl outline-none">
          <option>Hydroponic System NFT1A</option>
          <option>Poultry House 1A</option>
          <option>Aquaculture Pond 1A</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* SENSOR CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sensors.map((s, i) => (
              <div key={i} className={`bg-[#10182b] rounded-3xl p-6 border ${s.color} shadow-2xl ${s.glow}`}>
                <div className="flex justify-between mb-4">
                  <h3 className="text-slate-300">{s.label}</h3>
                  <div className={`w-4 h-4 rounded-full border-2 ${s.color}`} />
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className={`w-32 h-32 rounded-full border-8 ${s.color} flex flex-col items-center justify-center`}>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI PANEL (Requested Stress Values) */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <h2 className="text-2xl font-semibold mb-4">AI Crop Intelligence</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-[#0b1220] p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm">Growth Stage</p>
                <h3 className="text-lg font-semibold mt-2">Vegetative</h3>
              </div>
              <div className="bg-[#0b1220] p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm">Health Score</p>
                <h3 className="text-lg font-semibold mt-2 text-red-500">44</h3>
              </div>
              <div className="bg-[#0b1220] p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm">Risk Level</p>
                <h3 className="text-lg font-semibold mt-2 text-orange-400">HIGH</h3>
              </div>
              <div className="bg-[#0b1220] p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm">Recommendation</p>
                <h3 className="text-sm font-semibold mt-2">Reduce temperature</h3>
              </div>
            </div>
          </div>

          {/* GROWTH INTELLIGENCE */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-semibold">Growth Intelligence</h2>
              <select value={bioMetric} onChange={(e) => setBioMetric(e.target.value)} className="bg-[#0b1220] border border-slate-700 text-white px-4 py-2 rounded-xl outline-none">
                <option>Growth Tracking</option><option>Plant Health</option><option>Stress Index</option>
              </select>
            </div>
            <div className="relative h-72 bg-[#0b1220] rounded-2xl border border-slate-800 p-4">
              <Line data={biologicalGraphs[bioMetric]} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* VISION CARD */}
          <div className="bg-[#10182b] rounded-3xl overflow-hidden shadow-xl border border-slate-800">
            <div className="p-5 border-b border-slate-800"><h2 className="text-xl font-semibold">Live Plant Intelligence</h2></div>
            <div className="aspect-video bg-black overflow-hidden relative">
              <img src={`https://agriculture-ai-backend.onrender.com/latest-image?t=${Date.now()}`} alt="Feed" className="w-full h-full object-cover" />
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Plant</span><span>{visionData.plant}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Growth Stage</span><span>{visionData.growth_stage}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Condition</span><span className={getConditionColor()}>{visionData.condition}</span></div>
            </div>
          </div>

          {/* CONTROLS (Restored Toggle/Hold Logic) */}
          <div className="bg-[#10182b] rounded-3xl p-6 shadow-xl border border-slate-800">
            <h2 className="text-2xl font-semibold mb-5">Smart Control Center</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => sendControlCommand("pump1", !relayStates.pump1)} className={`rounded-2xl p-4 font-semibold border ${relayStates.pump1 ? "bg-green-500/20 border-green-400" : "bg-red-500/10 border-red-500/40"}`}>
                Water Pump <div className="text-xs mt-2">{relayStates.pump1 ? "ON" : "OFF"}</div>
              </button>
              <button onMouseDown={() => sendControlCommand("pump2", true)} onMouseUp={() => sendControlCommand("pump2", false)} onMouseLeave={() => sendControlCommand("pump2", false)} className="rounded-2xl p-4 font-semibold border bg-red-500/10 border-red-500/40">
                Nutrient Pump A <div className="text-xs mt-2">Hold to Dose</div>
              </button>
              <button onClick={() => sendControlCommand("light", !relayStates.light)} className={`rounded-2xl p-4 font-semibold border ${relayStates.light ? "bg-green-500/20 border-green-400" : "bg-red-500/10 border-red-500/40"}`}>
                LED Lights <div className="text-xs mt-2">{relayStates.light ? "ON" : "OFF"}</div>
              </button>
              <button onClick={() => sendControlCommand("pump4", !relayStates.pump4)} className={`rounded-2xl p-4 font-semibold border ${relayStates.pump4 ? "bg-green-500/20 border-green-400 shadow-green-500/40" : "bg-red-500/10 border-red-500/40"}`}>
                Secondary Pump <div className="text-xs mt-2">{relayStates.pump4 ? "ON" : "OFF"}</div>
              </button>
            </div>
          </div>

          {/* STATUS INDICATORS (Restored) */}
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