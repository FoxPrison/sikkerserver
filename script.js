document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const serverNameInput = document.getElementById("serverName");
    const addServerBtn = document.getElementById("addServerBtn");
    const deleteServerBtn = document.getElementById("deleteServerBtn");
    const serverDropdown = document.getElementById("serverDropdown");
    const todoInput = document.getElementById("todoInput");
    const addTodoBtn = document.getElementById("addTodoBtn");
    const todoList = document.getElementById("todoList");
    const staffNameInput = document.getElementById("staffName");
    const rankNameInput = document.getElementById("rankName");
    const addStaffBtn = document.getElementById("addStaffBtn");
    const staffList = document.getElementById("staffList");
    const statisticsSection = document.getElementById("statistics");
    const activityFeed = document.getElementById("activityFeed");

    const STORAGE_KEY = "serverManagementData";

    // Helper Functions
    const loadData = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const saveData = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const getSelectedServer = () => serverDropdown.value;

    const updateVisibility = () => {
        const hasServers = serverDropdown.options.length > 0;
        document.querySelectorAll(".card").forEach((section) => {
            section.style.display = hasServers ? "block" : "none";
        });
    };

    // Render Server Dropdown
    const renderServerDropdown = () => {
        const data = loadData();
        serverDropdown.innerHTML = "";
        Object.keys(data).forEach((server) => {
            const option = document.createElement("option");
            option.value = server;
            option.textContent = server;
            serverDropdown.appendChild(option);
        });
        updateVisibility();
        renderDashboard();
        renderTodos();
        renderStaff();
    };

    // Render Dashboard
    const renderDashboard = () => {
        const data = loadData();
        const server = getSelectedServer();
        const { todos = [] } = data[server] || {};
        const completed = todos.filter(({ status }) => status === "Færdig").length;
        const total = todos.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        statisticsSection.innerHTML = `
            <h3>${server}</h3>
            <p>Opgaver: ${completed}/${total}</p>
            <p>Status: ${percentage}% Færdig</p>
        `;
    };

    // Render Todos
    const renderTodos = () => {
        const data = loadData();
        const server = getSelectedServer();
        todoList.innerHTML = "";
        (data[server]?.todos || []).forEach(({ name, status, priority, deadline }, index) => {
            const statusColor = status === "Færdig" ? "green" : status === "Igang" ? "yellow" : "red";
            const deadlineText = deadline ? `Deadline: ${deadline}` : "";
            const item = document.createElement("li");
            item.innerHTML = `
                ${name} - <strong style="color: ${statusColor}">${status}</strong> ${deadlineText} - Prioritet: ${priority || "Lav"}
                <div class="actions">
                    <button onclick="changeTodoStatus('${server}', ${index}, 'Igang')">Start</button>
                    <button onclick="changeTodoStatus('${server}', ${index}, 'Færdig')">Færdig</button>
                    <button onclick="deleteTodo('${server}', ${index})">Slet</button>
                </div>
            `;
            todoList.appendChild(item);

            // Check for expired deadlines and show reminder
            if (deadline && new Date(deadline) < new Date() && status !== "Færdig") {
                item.style.backgroundColor = "#ffcccc"; // Highlight overdue tasks
                item.innerHTML += "<div style='color: red; font-weight: bold;'>OVERSKREDEN DEADLINE!</div>";
            }
        });
    };

    // Render Staff
    const renderStaff = () => {
        const data = loadData();
        const server = getSelectedServer();
        staffList.innerHTML = "";
        (data[server]?.staff || []).forEach(({ name, rank, responsibilities }, index) => {
            const item = document.createElement("li");
            item.innerHTML = `
                <div>
                    ${name} (${rank}) 
                    <small>${responsibilities.join(", ") || "Ingen ansvar"}</small>
                </div>
                <div class="actions">
                    <button onclick="addResponsibility('${server}', ${index})">Tilføj Ansvar</button>
                    <button onclick="deleteStaff('${server}', ${index})">Slet</button>
                </div>
            `;
            staffList.appendChild(item);
        });
    };

    // Add Server
    addServerBtn.addEventListener("click", () => {
        const serverName = serverNameInput.value.trim();
        if (!serverName) return;
        const data = loadData();
        if (!data[serverName]) {
            data[serverName] = { todos: [], staff: [], logs: [] };
            saveData(data);
            renderServerDropdown();
            serverNameInput.value = "";
            updateActivityFeed(`Server "${serverName}" oprettet.`);
        } else {
            alert("Serveren eksisterer allerede!");
        }
    });

    // Delete Server
    deleteServerBtn.addEventListener("click", () => {
        const server = getSelectedServer();
        if (server && confirm(`Er du sikker på, at du vil slette serveren "${server}"?`)) {
            const data = loadData();
            delete data[server];
            saveData(data);
            renderServerDropdown();
            updateActivityFeed(`Server "${server}" er blevet slettet.`);
        }
    });

    // Add Todo
    addTodoBtn.addEventListener("click", () => {
        const todoName = todoInput.value.trim();
        const server = getSelectedServer();
        const deadline = prompt("Indtast deadline (YYYY-MM-DD):");
        const priority = prompt("Indtast prioritet (Lav, Medium, Høj):");
        if (!todoName) return;
        const data = loadData();
        data[server].todos.push({ name: todoName, status: "Ikke påbegyndt", deadline, priority });
        saveData(data);
        renderTodos();
        todoInput.value = "";
        renderDashboard();
        updateActivityFeed(`Opgave "${todoName}" tilføjet med deadline ${deadline}.`);
    });

    // Add Responsibility to Staff
    window.addResponsibility = (server, staffIndex) => {
        const responsibility = prompt("Indtast ansvar:");
        if (!responsibility) return;
        const data = loadData();
        data[server].staff[staffIndex].responsibilities.push(responsibility);
        saveData(data);
        renderStaff();
        updateActivityFeed(`Ansvar "${responsibility}" tilføjet til medarbejder.`);
    };

    // Delete Todo
    window.deleteTodo = (server, todoIndex) => {
        const data = loadData();
        data[server].todos.splice(todoIndex, 1);
        saveData(data);
        renderTodos();
        updateActivityFeed(`Opgave slettet.`);
    };

    // Change Todo Status
    window.changeTodoStatus = (server, todoIndex, newStatus) => {
        const data = loadData();
        data[server].todos[todoIndex].status = newStatus;
        saveData(data);
        renderTodos();
        renderDashboard();
        updateActivityFeed(`Opgave status ændret til "${newStatus}".`);
    };

    // Delete Staff
    window.deleteStaff = (server, staffIndex) => {
        const data = loadData();
        data[server].staff.splice(staffIndex, 1);
        saveData(data);
        renderStaff();
        updateActivityFeed(`Medarbejder slettet.`);
    };

    // Add Staff
    addStaffBtn.addEventListener("click", () => {
        const staffName = staffNameInput.value.trim();
        const rankName = rankNameInput.value.trim();
        const server = getSelectedServer();
        if (!staffName || !rankName) return;
        const data = loadData();
        data[server].staff.push({ name: staffName, rank: rankName, responsibilities: [] });
        saveData(data);
        renderStaff();
        staffNameInput.value = "";
        rankNameInput.value = "";
        updateActivityFeed(`Medarbejder "${staffName}" tilføjet.`);
    });

    // Activity Feed
    const updateActivityFeed = (message) => {
        const item = document.createElement("div");
        item.textContent = message;
        activityFeed.appendChild(item);
    };

    // Initialize
    renderServerDropdown();

    // Event Listeners for Dropdown
    serverDropdown.addEventListener("change", () => {
        renderDashboard();
        renderTodos();
        renderStaff();
    });
});
