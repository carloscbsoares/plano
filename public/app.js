
let supabaseClient;
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("SEU-PROJECT")) {
    console.warn("➡️ Configure public/config.js com SUPABASE_URL e SUPABASE_ANON_KEY.");
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, detectSessionInUrl: true },
    realtime: { params: { eventsPerSecond: 5 } }
  });

  // Auth UI
  const elSignedOut = document.getElementById("signed-out");
  const elSignedIn  = document.getElementById("signed-in");
  const elUserEmail = document.getElementById("user-email");
  const elBtnMagic  = document.getElementById("btn-magic");
  const elBtnLogout = document.getElementById("btn-logout");

  elBtnMagic.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) return alert("Digite seu e-mail");
    const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    if (error) return alert("Erro no Magic Link: " + error.message);
    alert("Enviamos um link de acesso para seu e-mail.");
  });

  elBtnLogout.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
  });

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    const signed = !!currentUser;
    elSignedOut.classList.toggle("hidden", signed);
    elSignedIn.classList.toggle("hidden", !signed);
    document.getElementById("task-form").classList.toggle("hidden", !signed);
    document.getElementById("task-list").classList.toggle("hidden", !signed);
    document.getElementById("my-info").classList.toggle("hidden", !signed);

    if (signed) {
      elUserEmail.textContent = currentUser.email;
      await loadTasks();
      subscribeRealtime();
    } else {
      document.getElementById("tasks").innerHTML = "";
    }
  });

  // New Task form
  document.getElementById("form-new").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const due_date = document.getElementById("due_date").value || null;
    const assigneesRaw = document.getElementById("assignees").value.trim();
    const emails = assigneesRaw ? assigneesRaw.split(",").map(x => x.trim().toLowerCase()).filter(Boolean) : [];

    if (!title) return alert("Título obrigatório");

    const { data: task, error } = await supabaseClient
      .from("tasks")
      .insert({ title, description, due_date })
      .select("*")
      .single();
    if (error) return alert("Erro ao criar tarefa: " + error.message);

    if (emails.length) {
      const rows = emails.map(e => ({ task_id: task.id, assignee_email: e }));
      const { error: e2 } = await supabaseClient.from("task_assignees").insert(rows);
      if (e2) alert("Aviso: não foi possível salvar responsáveis: " + e2.message);
    }
    e.target.reset();
  });
});

async function loadTasks() {
  const { data, error } = await supabaseClient
    .rpc("tasks_for_user"); // usa a função segura do schema.sql
  if (error) {
    console.error(error);
    return alert("Erro ao carregar tarefas");
  }
  renderTasks(data);
}

function renderTasks(tasks) {
  const ul = document.getElementById("tasks");
  ul.innerHTML = "";
  for (const t of tasks) {
    const li = document.createElement("li");
    li.className = "task";
    const isDone = t.status === "done";
    const assignees = (t.assignees || []).map(a => `<span class="badge">${a}</span>`).join(" ");
    li.innerHTML = `
      <div>
        <div class="${isDone ? "done" : ""}"><strong>${escapeHTML(t.title)}</strong></div>
        <div class="meta">
          <span class="badge">${t.status}</span>
          ${t.due_date ? `<span class="badge">Prazo: ${new Date(t.due_date).toLocaleDateString()}</span>` : ""}
          ${assignees}
        </div>
        ${t.description ? `<div>${escapeHTML(t.description)}</div>` : ""}
      </div>
      <div class="row">
        <button class="sm-btn" data-action="toggle" data-id="${t.id}">${isDone ? "Reabrir" : "Concluir"}</button>
        <button class="sm-btn" data-action="delete" data-id="${t.id}">Apagar</button>
      </div>
    `;
    ul.appendChild(li);
  }

  ul.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === "delete") {
        if (!confirm("Apagar tarefa?")) return;
        const { error } = await supabaseClient.from("tasks").delete().eq("id", id);
        if (error) alert("Erro: " + error.message);
      } else if (action === "toggle") {
        const { error } = await supabaseClient.rpc("toggle_task_status", { task_id_input: id });
        if (error) alert("Erro: " + error.message);
      }
    });
  });
}

function subscribeRealtime() {
  const channel = supabaseClient.channel("tasks-ch")
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, payload => {
      loadTasks();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "task_assignees" }, payload => {
      loadTasks();
    })
    .subscribe();
}

// utils
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",""":"&quot;"
  })[c]);
}
