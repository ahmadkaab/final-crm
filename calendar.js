// Calendar View and Follow-up Management Module

class CalendarManager {
    constructor() {
        this.calendar = null;
        this.followups = [];
        this.initialized = false;
    }

    // Initialize calendar with FullCalendar
    async initialize(containerId) {
        if (!this.initialized) {
            this.calendar = new FullCalendar.Calendar(document.getElementById(containerId), {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                editable: true,
                selectable: true,
                selectMirror: true,
                dayMaxEvents: true,
                eventClick: this.handleEventClick.bind(this),
                select: this.handleDateSelect.bind(this),
                eventDrop: this.handleEventDrop.bind(this),
                events: this.getFollowupEvents.bind(this)
            });
            this.initialized = true;
            this.calendar.render();
        }
    }

    // Convert follow-ups to calendar events
    getFollowupEvents() {
        return data.followups.map(followup => ({
            id: followup.id,
            title: `${followup.clientName} - ${followup.notes}`,
            start: followup.dueDate,
            backgroundColor: this.getEventColor(followup.status),
            extendedProps: { followup }
        }));
    }

    // Get event color based on follow-up status
    getEventColor(status) {
        const colors = {
            'Pending': '#ffc107',
            'Completed': '#28a745',
            'Overdue': '#dc3545',
            'Scheduled': '#17a2b8'
        };
        return colors[status] || '#6c757d';
    }

    // Handle event click
    handleEventClick(info) {
        const followup = info.event.extendedProps.followup;
        showFollowupDetails(followup);
    }

    // Handle date selection
    handleDateSelect(info) {
        showAddFollowupForm(info.startStr);
    }

    // Handle event drag and drop
    handleEventDrop(info) {
        const followup = info.event.extendedProps.followup;
        followup.dueDate = info.event.startStr;
        updateFollowup(followup);
    }

    // Refresh calendar events
    refreshEvents() {
        if (this.calendar) {
            this.calendar.refetchEvents();
        }
    }

    // Get overdue follow-ups
    getOverdueFollowups() {
        const today = new Date();
        return data.followups.filter(followup => {
            const dueDate = new Date(followup.dueDate);
            return followup.status === 'Pending' && dueDate < today;
        });
    }

    // Get today's follow-ups
    getTodaysFollowups() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return data.followups.filter(followup => {
            const dueDate = new Date(followup.dueDate);
            return dueDate >= today && dueDate < tomorrow;
        });
    }

    // Generate smart follow-up suggestions
    generateSuggestions() {
        const suggestions = [];
        const today = new Date();

        // Group clients by category
        const clientsByCategory = {};
        data.clients.forEach(client => {
            if (!clientsByCategory[client.category]) {
                clientsByCategory[client.category] = [];
            }
            clientsByCategory[client.category].push(client);
        });

        // Generate suggestions based on client category and last contact
        Object.entries(clientsByCategory).forEach(([category, clients]) => {
            clients.forEach(client => {
                const lastFollowup = data.followups
                    .filter(f => f.clientName === client.name)
                    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];

                if (!lastFollowup || this.shouldSuggestFollowup(category, lastFollowup)) {
                    suggestions.push({
                        clientName: client.name,
                        suggestedDate: this.calculateNextFollowupDate(category, lastFollowup),
                        reason: this.getSuggestionReason(category, lastFollowup)
                    });
                }
            });
        });

        return suggestions;
    }

    // Determine if follow-up should be suggested based on category
    shouldSuggestFollowup(category, lastFollowup) {
        if (!lastFollowup) return true;

        const daysSinceLastFollowup = Math.floor(
            (new Date() - new Date(lastFollowup.dueDate)) / (1000 * 60 * 60 * 24)
        );

        const thresholds = {
            'VIP': 7,
            'Active': 14,
            'Prospect': 30,
            'Inactive': 90
        };

        return daysSinceLastFollowup >= (thresholds[category] || 30);
    }

    // Calculate suggested next follow-up date
    calculateNextFollowupDate(category, lastFollowup) {
        const date = new Date();
        const intervals = {
            'VIP': 7,
            'Active': 14,
            'Prospect': 30,
            'Inactive': 90
        };

        date.setDate(date.getDate() + (intervals[category] || 30));
        return date.toISOString().split('T')[0];
    }

    // Get reason for follow-up suggestion
    getSuggestionReason(category, lastFollowup) {
        if (!lastFollowup) {
            return 'No previous follow-up recorded';
        }

        const daysSinceLastFollowup = Math.floor(
            (new Date() - new Date(lastFollowup.dueDate)) / (1000 * 60 * 60 * 24)
        );

        return `Last follow-up was ${daysSinceLastFollowup} days ago`;
    }
}

// Create global instance
const calendarManager = new CalendarManager();