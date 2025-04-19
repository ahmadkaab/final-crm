// Subscription management and feature restrictions
const subscriptionManager = {
    plans: {
        free: {
            maxClients: 10,
            features: ['basic_crm', 'calendar', 'email_notifications', 'basic_reporting']
        },
        pro: {
            maxClients: Infinity,
            features: ['basic_crm', 'calendar', 'email_notifications', 'basic_reporting',
                      'whatsapp', 'smart_suggestions', 'advanced_analytics', 'custom_reporting']
        },
        lifetime: {
            maxClients: Infinity,
            features: ['basic_crm', 'calendar', 'email_notifications', 'basic_reporting',
                      'whatsapp', 'smart_suggestions', 'advanced_analytics', 'custom_reporting',
                      'premium_support', 'early_access']
        }
    },

    getCurrentPlan() {
        return localStorage.getItem('userPlan') || 'free';
    },

    hasFeature(feature) {
        const currentPlan = this.getCurrentPlan();
        return this.plans[currentPlan].features.includes(feature);
    },

    canAddMoreClients(currentClientCount) {
        const currentPlan = this.getCurrentPlan();
        return currentClientCount < this.plans[currentPlan].maxClients;
    },

    showUpgradeDialog() {
        const notification = {
            title: 'Upgrade Required',
            message: 'This feature is only available in the Pro plan. Would you like to upgrade?',
            type: 'info',
            actions: [
                {
                    text: 'View Plans',
                    onClick: () => window.location.href = 'pricing.html'
                }
            ]
        };
        notificationManager.show(notification);
    },

    checkFeatureAccess(feature, callback) {
        if (this.hasFeature(feature)) {
            callback();
        } else {
            this.showUpgradeDialog();
        }
    }
};