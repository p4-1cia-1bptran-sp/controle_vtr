const fs = require('fs');
const path = require('path');
const url = require('url');

// Configurações do Banco de Dados
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DB_FILE = fs.existsSync(path.join(process.cwd(), 'database.json'))
    ? path.join(process.cwd(), 'database.json')
    : path.join(__dirname, '..', 'database.json');
const WRITABLE_DB_FILE = IS_VERCEL ? '/tmp/database.json' : BUNDLED_DB_FILE;
const FIREBASE_URL = 'https://controle-frota-vagner-default-rtdb.firebaseio.com/frota_database.json';

let cachedDb = null;
let lastDbReadTime = 0;

function getDefaultDatabase() {
    return {
        appTitle: "🚓 CONTROLE DE VIATURAS - FROTA 1ª CIA DO 1º BPTRAN",
        pizzaCenterImage: "",
        lastStatusUpdate: new Date().toLocaleString('pt-BR'),
        customCias: ["Batalhão", "1ª Cia", "2ª Cia", "3ª Cia", "4ª Cia", "CTT"],
        customModels: ["BASE MÓVEL", "CARGO", "DUSTER", "GUINCHO", "RANGER", "S-10", "SPIN", "TRAIL BLAZER", "XT-660", "MASTER", "OUTRO"],
        customPelotoes: ["1º PEL", "2º PEL", "3º PEL", "4º PEL", "5º PEL", "6º PEL", "7º PEL", "8º PEL", "DEJEM", "DELEGADA", "ADM"],
        customStatuses: ["OPERANDO", "BAIXADA", "DESCARGA", "ADM"],
        customLocais: ["ADM", "BASE", "CONCESSIONÁRIA", "CPTRAN", "OFICINA", "PÁTIO", "EAP", "OUTRO"],
        customQuickReasons: [
            { key: "ARREFECIMENTO", label: "Arrefecimento" },
            { key: "ARRANQUE", label: "Arranque" },
            { key: "BATERIA", label: "Bateria" },
            { key: "CÂMBIO", label: "Câmbio" },
            { key: "EMBREAGEM", label: "Embreagem" },
            { key: "LUMINOSOS", label: "Luminosos" },
            { key: "MOTOR", label: "Motor" },
            { key: "PNEU", label: "Pneu" },
            { key: "RÁDIO", label: "Rádio" },
            { key: "SONORO", label: "Sonoro" },
            { key: "DESCARGA", label: "Descarga" }
        ],
        systemUsers: [],
        records: [],
        updatedAt: new Date().toISOString()
    };
}

async function getDatabase() {
    const now = Date.now();
    // Cache em memória curto (1.5s) para acelerar requisições consecutivas sem perder tempo real
    if (cachedDb && (now - lastDbReadTime < 1500)) {
        return cachedDb;
    }

    // 1. Prioridade Máxima: Banco de Dados Central em Nuvem (Firebase Realtime Database)
    // Isso garante que alterações feitas em um celular apareçam imediatamente no outro celular
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const fbRes = await fetch(FIREBASE_URL, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData && typeof fbData === 'object' && Array.isArray(fbData.records) && fbData.records.length > 0) {
                cachedDb = fbData;
                lastDbReadTime = now;
                try {
                    fs.writeFileSync(WRITABLE_DB_FILE, JSON.stringify(fbData, null, 2), 'utf-8');
                } catch(e) {}
                return cachedDb;
            }
        }
    } catch (err) {
        console.warn('Aviso: Leitura do Firebase falhou, usando cache local:', err.message);
    }

    // 2. Cache em arquivo gravável (/tmp/database.json)
    try {
        if (fs.existsSync(WRITABLE_DB_FILE)) {
            const raw = fs.readFileSync(WRITABLE_DB_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
                cachedDb = parsed;
                lastDbReadTime = now;
                return cachedDb;
            }
        }
    } catch (err) {}

    // 3. Arquivo database.json bundled no projeto
    try {
        if (fs.existsSync(BUNDLED_DB_FILE)) {
            const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                cachedDb = parsed;
                lastDbReadTime = now;
                return cachedDb;
            }
        }
    } catch (err) {}

    const fallback = getDefaultDatabase();
    cachedDb = fallback;
    return fallback;
}

async function saveDatabase(data) {
    cachedDb = data;
    lastDbReadTime = Date.now();

    // 1. Salva no cache local (/tmp)
    try {
        const tmpTarget = WRITABLE_DB_FILE + '.tmp';
        fs.writeFileSync(tmpTarget, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpTarget, WRITABLE_DB_FILE);
    } catch (err) {
        try {
            fs.writeFileSync(WRITABLE_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        } catch (e2) {}
    }

    // 2. CRÍTICO: Grava e AGUARDA a confirmação no Firebase Realtime Database
    // Sem esse await, a Vercel congela a função antes do envio e outros celulares não recebem a mudança!
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const fbRes = await fetch(FIREBASE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!fbRes.ok) {
            console.error('Firebase PUT respondeu com status:', fbRes.status);
        }
    } catch (err) {
        console.error('Erro ao sincronizar com Firebase:', err.message);
    }

    return true;
}

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname || '';

    // Health check & Ping
    if (pathname === '/api/status' || pathname === '/healthz' || pathname === '/ping' || pathname.endsWith('/status')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.writeHead(200);
        return res.end(JSON.stringify({
            status: 'online',
            service: 'Painel de Controle de Viaturas (VTR) - 1ª Cia 1º BPTran',
            platform: 'Vercel Serverless / Node.js',
            timestamp: new Date().toISOString()
        }));
    }

    // Rotas de Dados da Frota
    if (pathname.includes('/frota') || pathname.includes('/dados') || pathname.includes('/database') || pathname.includes('/oleo')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (req.method === 'GET') {
            const db = await getDatabase();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(200);
            return res.end(JSON.stringify(db));
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const processPayload = async (payload) => {
                try {
                    const currentDb = await getDatabase();
                    const updatedDb = {
                        appTitle: payload.appTitle || currentDb.appTitle || "🚓 CONTROLE DE VIATURAS - FROTA 1ª CIA DO 1º BPTRAN",
                        pizzaCenterImage: payload.pizzaCenterImage !== undefined ? payload.pizzaCenterImage : (currentDb.pizzaCenterImage || ""),
                        lastStatusUpdate: payload.lastStatusUpdate || currentDb.lastStatusUpdate || new Date().toLocaleString('pt-BR'),
                        customCias: Array.isArray(payload.customCias) ? payload.customCias : (currentDb.customCias || []),
                        customModels: Array.isArray(payload.customModels) ? payload.customModels : (currentDb.customModels || []),
                        customPelotoes: Array.isArray(payload.customPelotoes) ? payload.customPelotoes : (currentDb.customPelotoes || []),
                        customStatuses: Array.isArray(payload.customStatuses) ? payload.customStatuses : (currentDb.customStatuses || []),
                        customLocais: Array.isArray(payload.customLocais) ? payload.customLocais : (currentDb.customLocais || []),
                        customQuickReasons: Array.isArray(payload.customQuickReasons) ? payload.customQuickReasons : (currentDb.customQuickReasons || []),
                        systemUsers: Array.isArray(payload.systemUsers) ? payload.systemUsers : (currentDb.systemUsers || []),
                        records: Array.isArray(payload.records) ? payload.records : (currentDb.records || []),
                        updatedAt: payload.updatedAt || new Date().toISOString()
                    };

                    await saveDatabase(updatedDb);
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(200);
                    return res.end(JSON.stringify({
                        success: true,
                        message: 'Dados da frota sincronizados com sucesso em todos os dispositivos',
                        updatedAt: updatedDb.updatedAt,
                        data: updatedDb
                    }));
                } catch (err) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(500);
                    return res.end(JSON.stringify({ error: 'Erro ao processar dados: ' + err.message }));
                }
            };

            // Suporta req.body pré-parseado pela Vercel ou stream
            if (req.body && typeof req.body === 'object') {
                return await processPayload(req.body);
            }

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
                if (body.length > 50 * 1024 * 1024) {
                    req.destroy();
                }
            });

            req.on('end', async () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    await processPayload(parsed);
                } catch (err) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Payload JSON inválido: ' + err.message }));
                }
            });
            return;
        }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
};
