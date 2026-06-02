const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const CONFIG_PATH = path.join(__dirname, '..', 'configuracoes.json');

function readConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Erro ao ler configuracoes.json', e);
    }
    // Padrão simples caso não exista
    return {
        versao: '2.0.0',
        nomeSistema: 'IPIL - Sistema de Reclamações e Denúncias',
        modoManutencao: false
    };
}

function writeConfig(obj) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(obj, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Erro ao gravar configuracoes.json', e);
        return false;
    }
}

router.get('/', (req, res) => {
    const cfg = readConfig();
    res.json({ success: true, data: cfg });
});

router.post('/', (req, res) => {
    const body = req.body || {};
    const existing = readConfig();
    const merged = { ...existing, ...body };
    const ok = writeConfig(merged);
    if (ok) {
        return res.json({ success: true, data: merged });
    }
    return res.status(500).json({ success: false, error: 'Não foi possível salvar configurações' });
});

module.exports = router;
