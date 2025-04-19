const mongoose = require('mongoose');

// MongoDB connection URL - replace with your actual MongoDB URL
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/crm';

// Connect to MongoDB
mongoose.connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Client Schema
const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Follow-up Schema
const followupSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    dueDate: { type: Date, required: true },
    notes: { type: String },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// WhatsApp Settings Schema
const whatsappSettingsSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    apiKey: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

// Create models
const Client = mongoose.model('Client', clientSchema);
const Followup = mongoose.model('Followup', followupSchema);
const WhatsappSettings = mongoose.model('WhatsappSettings', whatsappSettingsSchema);

module.exports = {
    Client,
    Followup,
    WhatsappSettings
};