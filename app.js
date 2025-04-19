// API endpoints
const API_BASE_URL = 'http://localhost:3000/api';

// Data structure
let data = {
    clients: [],
    followups: [],
    whatsappSettings: {
        enabled: false,
        apiKey: null
    }
};

// Fetch data from API
async function fetchData() {
    try {
        const [clients, followups, whatsappSettings] = await Promise.all([
            fetch(`${API_BASE_URL}/clients`).then(res => res.json()),
            fetch(`${API_BASE_URL}/followups`).then(res => res.json()),
            fetch(`${API_BASE_URL}/whatsapp-settings`).then(res => res.json())
        ]);
        
        data.clients = clients;
        data.followups = followups;
        data.whatsappSettings = whatsappSettings;
        
        refreshClientTable();
        refreshFollowupTable();
        updateAnalytics();
    } catch (error) {
        console.error('Error fetching data:', error);
        notificationManager.error('Failed to load data from server');
    }
}

// WhatsApp Settings Panel
function showWhatsAppSettings() {
    const settingsForm = document.createElement('div');
    settingsForm.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 1000;">
            <h2>WhatsApp Settings</h2>
            <form id="whatsappSettingsForm">
                <div style="margin-bottom: 15px;">
                    <label>API Key: </label>
                    <input type="password" id="whatsappApiKey" value="${data.whatsappSettings.apiKey || ''}" required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>
                        <input type="checkbox" id="whatsappEnabled" ${data.whatsappSettings.enabled ? 'checked' : ''}>
                        Enable WhatsApp Integration
                    </label>
                </div>
                <button type="submit" class="btn">Save Settings</button>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn" style="background-color: #dc3545;">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(settingsForm);

    document.getElementById('whatsappSettingsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const apiKey = document.getElementById('whatsappApiKey').value.trim();
        const enabled = document.getElementById('whatsappEnabled').checked;

        if (!apiKey && enabled) {
            notificationManager.error("Please enter a valid API key to enable WhatsApp integration", 3000);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            if (enabled) {
                await whatsappReminder.initialize(apiKey);
                data.whatsappSettings.apiKey = apiKey;
                data.whatsappSettings.enabled = true;
                notificationManager.success("WhatsApp integration enabled and configured successfully!", 3000);
            } else {
                data.whatsappSettings.apiKey = null;
                data.whatsappSettings.enabled = false;
                notificationManager.warning("WhatsApp integration has been disabled", 3000);
            }
            saveData();
            settingsForm.remove();
            refreshFollowupTable();
        } catch (error) {
            console.error('WhatsApp initialization error:', error);
            notificationManager.error(`Failed to initialize WhatsApp: ${error.message}`, 5000);
            data.whatsappSettings.enabled = false;
            data.whatsappSettings.apiKey = null;
            saveData();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Settings';
        }
    });
}

// Load data from API and initialize analytics
async function loadData() {
    await fetchData();
}

function updateAnalytics() {
    // Update basic metrics
    const activeClients = data.clients.filter(c => c.status === 'Active').length;
    const totalClients = data.clients.length;
    const activePercentage = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
    
    // Calculate pending follow-ups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pendingFollowups = data.followups.filter(f => {
        const dueDate = new Date(f.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return f.status === 'Pending' && dueDate <= today;
    });

    // Update dashboard cards
    document.querySelector('.card:nth-child(1) p').textContent = `${pendingFollowups.length} follow-ups due today`;
    document.querySelector('.card:nth-child(2) p').textContent = `${activeClients} active clients (${activePercentage}%)`;
    
    // Calculate recent activities
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentFollowups = data.followups.filter(f => new Date(f.dueDate) >= oneWeekAgo).length;
    document.querySelector('.card:nth-child(3) p').textContent = `${recentFollowups} activities this week`;
    
    // Update category chart
    const categories = {};
    data.clients.forEach(client => {
        categories[client.category] = (categories[client.category] || 0) + 1;
    });
    
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Save data to API
async function saveData() {
    try {
        // Update UI components after data changes
        refreshClientTable();
        refreshFollowupTable();
        updateAnalytics();
    } catch (error) {
        console.error('Error saving data:', error);
        notificationManager.error('Failed to save data to server');
    }
}

// WhatsApp Integration Functions
function toggleWhatsAppIntegration(enabled) {
    const configDiv = document.getElementById('whatsappConfig');
    configDiv.style.display = enabled ? 'block' : 'none';
}

// WhatsApp configuration is now handled in showWhatsAppSettings()

// Client management
function showAddClientForm() {
    const form = document.createElement('div');
    form.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 1000;">
            <h2>Add New Client</h2>
            <form id="addClientForm">
                <div style="margin-bottom: 10px;">
                    <label>Name: </label>
                    <input type="text" id="newClientName" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Email: </label>
                    <input type="email" id="newClientEmail" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Phone: </label>
                    <input type="tel" id="newClientPhone" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Category: </label>
                    <select id="newClientCategory" required>
                        <option value="">Select Category</option>
                        <option value="Prospect">Prospect</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="VIP">VIP</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Status: </label>
                    <select id="newClientStatus" required>
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
                <button type="submit" class="btn">Add Client</button>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn" style="background-color: #dc3545;">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(form);

    document.getElementById('addClientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newClient = {
            name: document.getElementById('newClientName').value,
            email: document.getElementById('newClientEmail').value,
            phone: document.getElementById('newClientPhone').value,
            category: document.getElementById('newClientCategory').value,
            status: document.getElementById('newClientStatus').value
        };
        if (addClient(newClient)) {
            form.remove();
        }
    });
}

function addClient(client) {
    // Validate required fields
    if (!client.name || !client.email || !client.phone || !client.category || !client.status) {
        notificationManager.error('Please fill in all required fields', 3000);
        return false;
    }

    // Validate name format (at least 2 characters, letters only)
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    if (!nameRegex.test(client.name)) {
        notificationManager.error('Name must contain at least 2 letters and no special characters', 3000);
        return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client.email)) {
        notificationManager.error('Please enter a valid email address', 3000);
        return false;
    }

    // Validate phone format (numbers, spaces, and basic symbols)
    const phoneRegex = /^[\d\s\-()+]{10,}$/;
    if (!phoneRegex.test(client.phone)) {
        notificationManager.error('Please enter a valid phone number (minimum 10 digits)', 3000);
        return false;
    }

    // Add client
    client.id = Date.now();
    client.lastContact = new Date().toISOString().split('T')[0];
    data.clients.push(client);
    saveData();
    refreshClientTable();
    updateAnalytics();
    return true;
}

function editClient(clientId) {
    const client = data.clients.find(c => c.id === clientId);
    if (!client) return;

    const form = document.createElement('div');
    form.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <h2>Edit Client</h2>
            <form id="editClientForm">
                <div style="margin-bottom: 10px;">
                    <label>Name: </label>
                    <input type="text" id="editClientName" value="${client.name}" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Email: </label>
                    <input type="email" id="editClientEmail" value="${client.email}" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Phone: </label>
                    <input type="tel" id="editClientPhone" value="${client.phone}" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Category: </label>
                    <select id="editClientCategory" required>
                        <option value="Prospect" ${client.category === 'Prospect' ? 'selected' : ''}>Prospect</option>
                        <option value="Active" ${client.category === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${client.category === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="VIP" ${client.category === 'VIP' ? 'selected' : ''}>VIP</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Status: </label>
                    <select id="editClientStatus" required>
                        <option value="Active" ${client.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${client.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="Pending" ${client.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </div>
                <button type="submit" class="btn">Save Changes</button>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn" style="background-color: #dc3545;">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(form);

    document.getElementById('editClientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const updatedClient = {
            ...client,
            name: document.getElementById('editClientName').value,
            email: document.getElementById('editClientEmail').value,
            phone: document.getElementById('editClientPhone').value,
            category: document.getElementById('editClientCategory').value,
            status: document.getElementById('editClientStatus').value
        };
        const index = data.clients.findIndex(c => c.id === clientId);
        data.clients[index] = updatedClient;
        saveData();
        refreshClientTable();
        updateAnalytics();
        form.remove();
    });
}

function deleteClient(clientId) {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;

    const index = data.clients.findIndex(c => c.id === clientId);
    if (index !== -1) {
        data.clients.splice(index, 1);
        // Also delete associated followups
        data.followups = data.followups.filter(f => f.clientId !== clientId);
        saveData();
        refreshClientTable();
        updateAnalytics();
    }
}

function refreshClientTable(clients = data.clients) {
    const tbody = document.getElementById('clientsTable');
    tbody.innerHTML = '';
    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td>${client.category}</td>
            <td>${client.lastContact}</td>
            <td>
                <span class="status-badge ${client.status.toLowerCase()}">${client.status}</span>
            </td>
            <td>
                <button onclick="editClient(${client.id})" class="btn-small">Edit</button>
                <button onclick="deleteClient(${client.id})" class="btn-small delete">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Show no results message if needed
    if (clients.length === 0) {
        const noResults = document.createElement('tr');
        noResults.innerHTML = '<td colspan="7" style="text-align: center; padding: 20px;">No clients found</td>';
        tbody.appendChild(noResults);
    }
}

function handleSearch(event) {
    const query = event.target.value;
    const filteredClients = query ? searchClients(query) : data.clients;
    refreshClientTable(filteredClients);
    
    // Update search results count
    const resultsCount = document.getElementById('searchResults');
    if (resultsCount) {
        resultsCount.textContent = `Found ${filteredClients.length} clients`;
    } else {
        const count = document.createElement('div');
        count.id = 'searchResults';
        count.style.marginLeft = '10px';
        count.textContent = `Found ${filteredClients.length} clients`;
        document.querySelector('.actions').appendChild(count);
    }
}

function handleFilter() {
    const criteria = document.getElementById('filterCriteria').value;
    const valueSelect = document.getElementById('filterValue');
    
    if (criteria) {
        const uniqueValues = [...new Set(data.clients.map(client => client[criteria]))];
        valueSelect.innerHTML = '<option value="">Select value...</option>' +
            uniqueValues.map(value => `<option value="${value}">${value}</option>`).join('');
        valueSelect.style.display = 'inline';
    } else {
        valueSelect.style.display = 'none';
        refreshClientTable();
    }
    
    const value = valueSelect.value;
    if (criteria && value) {
        const filteredClients = filterClients(criteria, value);
        refreshClientTable(filteredClients);
    }
}

function handleImport(event) {
    const file = event.target.files[0];
    if (file) {
        importData(file)
            .then(message => alert(message))
            .catch(error => alert(error));
    }
    event.target.value = '';
}

// Follow-up management
function addFollowup(followup) {
    followup.id = Date.now();
    followup.clientId = data.clients.find(c => c.name === followup.clientName)?.id;
    followup.whatsappReminder = followup.whatsappReminder || false;
    followup.whatsappStatus = 'pending';
    followup.whatsappMessageId = null;
    followup.whatsappError = null;
    
    data.followups.push(followup);
    saveData();
    
    // Schedule WhatsApp reminder if enabled
    if (followup.whatsappReminder && data.whatsappSettings.enabled) {
        whatsappReminder.scheduleReminder(followup)
            .then(result => {
                const index = data.followups.findIndex(f => f.id === followup.id);
                if (index !== -1) {
                    if (result.success) {
                        data.followups[index].whatsappStatus = 'scheduled';
                        data.followups[index].whatsappMessageId = result.messageId;
                        // Check message status after scheduling
                        whatsappReminder.checkMessageStatus(result.messageId)
                            .then(status => {
                                data.followups[index].whatsappStatus = status.status;
                                saveData();
                                refreshFollowupTable();
                            })
                            .catch(error => {
                                data.followups[index].whatsappStatus = 'error';
                                data.followups[index].whatsappError = error.message;
                                saveData();
                                refreshFollowupTable();
                            });
                    } else {
                        data.followups[index].whatsappStatus = 'failed';
                        data.followups[index].whatsappError = result.error;
                        saveData();
                        refreshFollowupTable();
                    }
                }
            })
            .catch(error => {
                const index = data.followups.findIndex(f => f.id === followup.id);
                if (index !== -1) {
                    data.followups[index].whatsappStatus = 'error';
                    data.followups[index].whatsappError = error.message;
                    saveData();
                    refreshFollowupTable();
                }
            });
    }
    
    refreshFollowupTable();
    updateAnalytics();
}

function editFollowup(followupId) {
    const followup = data.followups.find(f => f.id === followupId);
    if (!followup) return;

    const form = document.createElement('div');
    form.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <h2>Edit Follow-up</h2>
            <form id="editFollowupForm">
                <div>
                    <label>Client: </label>
                    <select id="editFollowupClient" required placeholder="Select client">
                        ${data.clients.map(client => `<option value="${client.name}" ${client.name === followup.clientName ? 'selected' : ''}>${client.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Due Date: </label>
                    <input type="date" id="editFollowupDate" value="${followup.dueDate}" required placeholder="Select due date">
                </div>
                <div>
                    <label>Status: </label>
                    <select id="editFollowupStatus" required>
                        <option value="Pending" ${followup.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Completed" ${followup.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${followup.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <div>
                    <label>Notes: </label>
                    <textarea id="editFollowupNotes" rows="3" placeholder="Enter any additional notes">${followup.notes}</textarea>
                </div>
                <button type="submit" class="btn">Save Changes</button>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn" style="background-color: #dc3545;">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(form);

    document.getElementById('editFollowupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const updatedFollowup = {
                ...followup,
                clientName: document.getElementById('editFollowupClient').value,
                dueDate: document.getElementById('editFollowupDate').value,
                status: document.getElementById('editFollowupStatus').value,
                notes: document.getElementById('editFollowupNotes').value
            };
            const index = data.followups.findIndex(f => f.id === followupId);
            data.followups[index] = updatedFollowup;
            saveData();
            refreshFollowupTable();
            updateAnalytics();
            notificationManager.show({
                text: "Follow-up updated successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745"
            }).showToast();
            form.remove();
        } catch (error) {
            notificationManager.show({
                text: "Error updating follow-up: " + error.message,
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#dc3545"
            }).showToast();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    });
}

function deleteFollowup(followupId) {
    if (!confirm('Are you sure you want to delete this follow-up? This action cannot be undone.')) return;

    const index = data.followups.findIndex(f => f.id === followupId);
    if (index !== -1) {
        data.followups.splice(index, 1);
        saveData();
        refreshFollowupTable();
        updateAnalytics();
    }
}

// Retry failed WhatsApp message
async function retryWhatsAppMessage(followupId) {
    const followup = data.followups.find(f => f.id === followupId);
    if (!followup) return;

    try {
        const result = await whatsappReminder.retryMessage(followup.whatsappMessageId);
        if (result.success) {
            followup.whatsappStatus = result.status;
            followup.whatsappHistory = followup.whatsappHistory || [];
            followup.whatsappHistory.push({
                timestamp: result.timestamp,
                status: result.status,
                action: 'retry'
            });
        } else {
            followup.whatsappStatus = 'failed';
            followup.whatsappError = result.error;
            followup.whatsappHistory = followup.whatsappHistory || [];
            followup.whatsappHistory.push({
                timestamp: result.timestamp,
                status: 'failed',
                error: result.error,
                action: 'retry'
            });
        }
        saveData();
        refreshFollowupTable();
    } catch (error) {
        alert('Failed to retry WhatsApp message: ' + error.message);
    }
}

function refreshFollowupTable() {
    const tbody = document.getElementById('followupsTable');
    tbody.innerHTML = '';
    
    if (data.followups.length === 0) {
        const noResults = document.createElement('tr');
        noResults.innerHTML = '<td colspan="6" style="text-align: center; padding: 20px;">No follow-ups scheduled</td>';
        tbody.appendChild(noResults);
        return;
    }
    
    data.followups.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    data.followups.forEach(followup => {
        const row = document.createElement('tr');
        const dueDate = new Date(followup.dueDate);
        const isOverdue = dueDate < new Date() && followup.status === 'Pending';
        
        let whatsappStatusBadge = 'Not enabled';
        if (followup.whatsappReminder) {
            const statusClass = followup.whatsappStatus === 'error' || followup.whatsappStatus === 'failed' ? 'error' : followup.whatsappStatus.toLowerCase();
            whatsappStatusBadge = `
                <span class="status-badge ${statusClass}">
                    ${followup.whatsappStatus.charAt(0).toUpperCase() + followup.whatsappStatus.slice(1)}
                </span>
                ${followup.whatsappError ? `<div class="error-message">${followup.whatsappError}</div>` : ''}
                ${(followup.whatsappStatus === 'failed' || followup.whatsappStatus === 'error') ? 
                    `<button onclick="retryWhatsAppMessage(${followup.id})" class="btn-small retry">Retry</button>` : ''}
                ${followup.whatsappHistory ? 
                    `<div class="history-log">
                        ${followup.whatsappHistory.map(h => 
                            `<div class="history-entry">
                                ${new Date(h.timestamp).toLocaleString()}: ${h.status}
                                ${h.error ? ` - ${h.error}` : ''}
                            </div>`
                        ).join('')}
                    </div>` : ''}
            `;
        }
        
        row.innerHTML = `
            <td>${followup.clientName}</td>
            <td class="${isOverdue ? 'overdue' : ''}">${followup.dueDate}</td>
            <td><span class="status-badge ${followup.status.toLowerCase()}">${followup.status}</span></td>
            <td>${followup.notes}</td>
            <td>${whatsappStatusBadge}</td>
            <td>
                <button onclick="editFollowup(${followup.id})" class="btn-small">Edit</button>
                <button onclick="deleteFollowup(${followup.id})" class="btn-small delete">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}
// This closing brace appears to be orphaned and should be removed

// Form handling
function showAddClientForm() {
    const form = document.createElement('div');
    form.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <h2>Add New Client</h2>
            <form id="clientForm">
                <div style="margin-bottom: 10px;">
                    <label>Name: </label>
                    <input type="text" id="clientName" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Email: </label>
                    <input type="email" id="clientEmail" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Phone: </label>
                    <input type="tel" id="clientPhone" required>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Category: </label>
                    <select id="clientCategory" required>
                        <option value="Prospect">Prospect</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="VIP">VIP</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Status: </label>
                    <select id="clientStatus" required>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
                <button type="submit" class="btn">Add Client</button>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn" style="background-color: #dc3545;">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(form);

    document.getElementById('clientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const client = {
            name: document.getElementById('clientName').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            category: document.getElementById('clientCategory').value,
            status: document.getElementById('clientStatus').value
        };
        if (addClient(client)) {
            form.remove();
        }
    });
}

function showAddFollowupForm() {
    const form = document.createElement('div');
    form.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <h2>Schedule Follow-up</h2>
            <form id="followupForm">
                <div>
                    <label>Client: </label>
                    <select id="followupClient" required placeholder="Select client">
                        <option value="" disabled selected>Select a client</option>
                        ${data.clients.map(client => `<option value="${client.name}">${client.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Due Date: </label>
                    <input type="date" id="followupDate" required placeholder="Select due date">
                </div>
                <div>
                    <label>Status: </label>
                    <select id="followupStatus" required>
                        <option value="" disabled selected>Select status</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label>Notes: </label>
                    <textarea id="followupNotes" rows="3" placeholder="Enter any additional notes"></textarea>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>
                        <input type="checkbox" id="whatsappReminder" ${data.whatsappSettings.enabled ? '' : 'disabled'}>
                        Enable WhatsApp Reminder
                    </label>
                    ${!data.whatsappSettings.enabled ? '<br><small style="color: #666;">(WhatsApp integration not configured)</small>' : ''}
                </div>
                <button type="submit" class="btn">Schedule Follow-up</button>
                <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn" style="background-color: #dc3545;">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(form);

    document.getElementById('followupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Validate form fields
        const clientName = document.getElementById('followupClient').value;
        const dueDate = document.getElementById('followupDate').value;
        const status = document.getElementById('followupStatus').value;
        const notes = document.getElementById('followupNotes').value;
        const whatsappReminder = document.getElementById('whatsappReminder').checked;

        if (!clientName || !dueDate || !status) {
            notificationManager.error("Please fill in all required fields", 3000);
            return;
        }

        if (whatsappReminder && !data.whatsappSettings.enabled) {
            notificationManager.error("WhatsApp integration must be enabled to set reminders", 3000);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Scheduling...';
    
        try {
            const followup = { clientName, dueDate, status, notes, whatsappReminder };
            await addFollowup(followup);
            notificationManager.success("Follow-up scheduled successfully!", 3000);
            form.remove();
            refreshFollowupTable();
        } catch (error) {
            console.error('Follow-up scheduling error:', error);
            notificationManager.error(`Error scheduling follow-up: ${error.message}`, 5000);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Schedule Follow-up';
        }
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Setup search handler
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Setup filter handlers
    document.getElementById('filterCriteria').addEventListener('change', handleFilter);
    document.getElementById('filterValue').addEventListener('change', handleFilter);
    
    // Initial dashboard update
    updateAnalytics();
});