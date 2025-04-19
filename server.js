const express = require('express');
const cors = require('cors');
const path = require('path');
const { Client, Followup, WhatsappSettings } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/api/clients', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const client = new Client(req.body);
        await client.save();
        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/clients/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(client);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/api/followups', async (req, res) => {
    try {
        const followups = await Followup.find().populate('clientId');
        res.json(followups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/followups', async (req, res) => {
    try {
        const followup = new Followup(req.body);
        await followup.save();
        res.status(201).json(followup);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/followups/:id', async (req, res) => {
    try {
        const followup = await Followup.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(followup);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/api/whatsapp-settings', async (req, res) => {
    try {
        const settings = await WhatsappSettings.findOne() || new WhatsappSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/whatsapp-settings', async (req, res) => {
    try {
        const settings = await WhatsappSettings.findOneAndUpdate(
            {},
            { ...req.body, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json(settings);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
