// Utility functions for CRM data management

// Export CRM data as JSON file
function exportData() {
    const exportData = {
        clients: data.clients,
        followups: data.followups,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Import CRM data from JSON file
function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (importedData.clients && importedData.followups) {
                    data.clients = importedData.clients;
                    data.followups = importedData.followups;
                    saveData();
                    refreshClientTable();
                    refreshFollowupTable();
                    resolve('Data imported successfully');
                } else {
                    reject('Invalid data format');
                }
            } catch (error) {
                reject('Error parsing import file');
            }
        };
        reader.onerror = () => reject('Error reading file');
        reader.readAsText(file);
    });
}

// Search clients by various criteria
function searchClients(query) {
    query = query.toLowerCase();
    return data.clients.filter(client => 
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        client.category.toLowerCase().includes(query) ||
        client.status.toLowerCase().includes(query)
    );
}

// Filter clients by status or category
function filterClients(criteria, value) {
    return data.clients.filter(client => 
        client[criteria].toLowerCase() === value.toLowerCase()
    );
}