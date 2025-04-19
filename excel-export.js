// Excel Export Module

class ExcelExporter {
    constructor() {
        this.workbook = null;
    }

    // Initialize new workbook
    initWorkbook() {
        return {
            SheetNames: [],
            Sheets: {}
        };
    }

    // Convert array to worksheet
    arrayToSheet(data) {
        const ws = {};
        const range = { s: { c: 0, r: 0 }, e: { c: 0, r: data.length } };

        // Get all unique keys from data objects
        const headers = Array.from(new Set(
            data.reduce((keys, obj) => keys.concat(Object.keys(obj)), [])
        ));

        // Update range to include all columns
        range.e.c = headers.length - 1;

        // Add headers
        headers.forEach((header, col) => {
            const cell = { v: header, t: 's' };
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
            ws[cellRef] = cell;
        });

        // Add data
        data.forEach((row, rowIndex) => {
            headers.forEach((header, col) => {
                const cell = { v: row[header] || '', t: 's' };
                const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: col });
                ws[cellRef] = cell;
            });
        });

        ws['!ref'] = XLSX.utils.encode_range(range);
        return ws;
    }

    // Export CRM data to Excel
    async exportToExcel() {
        try {
            const loadingToast = NotificationManager.showLoading('Preparing Excel export...');
            const wb = this.initWorkbook();

            // Create clients worksheet
            const clientsWS = this.arrayToSheet(data.clients);
            XLSX.utils.book_append_sheet(wb, clientsWS, 'Clients');

            // Create follow-ups worksheet
            const followupsWS = this.arrayToSheet(data.followups);
            XLSX.utils.book_append_sheet(wb, followupsWS, 'Follow-ups');

            // Create analytics worksheet
            const analytics = this.generateAnalytics();
            const analyticsWS = this.arrayToSheet(analytics);
            XLSX.utils.book_append_sheet(wb, analyticsWS, 'Analytics');

            // Generate Excel file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            await this.downloadExcel(excelBuffer);
            
            NotificationManager.dismissLoading(loadingToast);
            NotificationManager.showSuccess('Excel file exported successfully!');
        } catch (error) {
            NotificationManager.showError('Failed to export Excel file. Please try again.');
            console.error('Excel export error:', error);
        }
    }

    // Generate analytics data
    generateAnalytics() {
        const analytics = [];

        // Client statistics
        const totalClients = data.clients.length;
        const activeClients = data.clients.filter(c => c.status === 'Active').length;
        const categories = {};
        data.clients.forEach(client => {
            categories[client.category] = (categories[client.category] || 0) + 1;
        });

        // Follow-up statistics
        const totalFollowups = data.followups.length;
        const pendingFollowups = data.followups.filter(f => f.status === 'Pending').length;
        const completedFollowups = data.followups.filter(f => f.status === 'Completed').length;

        // Add summary data
        analytics.push(
            { metric: 'Total Clients', value: totalClients },
            { metric: 'Active Clients', value: activeClients },
            { metric: 'Active Client Percentage', value: `${((activeClients / totalClients) * 100).toFixed(1)}%` },
            { metric: 'Total Follow-ups', value: totalFollowups },
            { metric: 'Pending Follow-ups', value: pendingFollowups },
            { metric: 'Completed Follow-ups', value: completedFollowups }
        );

        // Add category breakdown
        Object.entries(categories).forEach(([category, count]) => {
            analytics.push({
                metric: `${category} Clients`,
                value: count,
                percentage: `${((count / totalClients) * 100).toFixed(1)}%`
            });
        });

        return analytics;
    }

    // Download Excel file
    async downloadExcel(buffer) {
        return new Promise((resolve, reject) => {
            try {
                const blob = new Blob([buffer], { type: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `crm_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Create global instance
const excelExporter = new ExcelExporter();