import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", date: "" });

  useEffect(() => {
    const saved = localStorage.getItem("tasks");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!form.title || !form.date) return;
    setTasks([...tasks, { ...form, id: Date.now() }]);
    setForm({ title: "", date: "" });
  };

  const triggerAlerts = async () => {
    await fetch("/.netlify/functions/notify", { method: "POST" });
    alert("Alertas disparados manualmente!");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📅 EasyPlano</h1>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Atividade"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border p-2 w-full"
        />
        <button onClick={addTask} className="bg-blue-500 text-white px-4 py-2 rounded">
          Adicionar
        </button>
        <button onClick={triggerAlerts} className="bg-green-500 text-white px-4 py-2 rounded ml-2">
          Disparar Alertas
        </button>
      </div>
      <ul className="mt-6 space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="border p-2 rounded">
            <strong>{task.title}</strong> - {task.date}
          </li>
        ))}
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
