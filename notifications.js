// Custom Notification System

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.initializeContainer();
    }

    initializeContainer() {
        // Create container for notifications if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(this.container);
        }
    }

    createNotificationElement(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            padding: 12px 24px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            min-width: 280px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-in-out;
            cursor: pointer;
        `;

        // Set background color based on type
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3',
            warning: '#ff9800'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        notification.textContent = message;
        notification.addEventListener('click', () => this.removeNotification(notification));

        return notification;
    }

    show(message, type = 'info', duration = 3000) {
        const notification = this.createNotificationElement(message, type);
        this.container.appendChild(notification);

        // Add to tracking array
        this.notifications.push(notification);

        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    removeNotification(notification) {
        notification.style.animation = 'fadeOut 0.3s ease-in-out';
        setTimeout(() => {
            if (notification.parentElement === this.container) {
                this.container.removeChild(notification);
                this.notifications = this.notifications.filter(n => n !== notification);
            }
        }, 300);
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    // Clear all notifications
    clearAll() {
        this.notifications.forEach(notification => this.removeNotification(notification));
    }
}

// Create global instance
const notificationManager = new NotificationManager();