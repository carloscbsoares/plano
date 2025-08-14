import React, { useState } from 'react';

export default function App(){
  const [sending, setSending] = useState(false);
  const NOTIFY_ENDPOINT = '/.netlify/functions/notify';

  async function forceNotify(){
    setSending(true);
    try {
      await fetch(NOTIFY_ENDPOINT, { method: "POST" });
      alert("Alertas enviados.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1>Plano de Ação</h1>
      <button onClick={forceNotify} disabled={sending}>
        {sending ? "Enviando..." : "Disparar alertas agora"}
      </button>
    </div>
  );
}
