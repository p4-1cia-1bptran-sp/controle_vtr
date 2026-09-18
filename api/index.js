const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuração de caminhos do banco de dados (suporta ambiente Serverless/Vercel e Local/Render)
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DB_FILE = fs.existsSync(path.join(process.cwd(), 'database.json'))
    ? path.join(process.cwd(), 'database.json')
    : path.join(__dirname, '..', 'database.json');
const WRITABLE_DB_FILE = IS_VERCEL ? '/tmp/database.json' : BUNDLED_DB_FILE;

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

function getDatabase() {
    const now = Date.now();
    if (cachedDb && (now - lastDbReadTime < 1000)) {
        return cachedDb;
    }

    // 1. Tentar ler do arquivo gravável (/tmp/database.json na Vercel)
    try {
        if (fs.existsSync(WRITABLE_DB_FILE)) {
            const raw = fs.readFileSync(WRITABLE_DB_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                cachedDb = parsed;
                lastDbReadTime = now;
                return cachedDb;
            }
        }
    } catch (err) {
        console.error('Erro ao ler WRITABLE_DB_FILE:', err.message);
    }

    // 2. Tentar ler do arquivo database.json distribuído no pacote
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
    } catch (err) {
        console.error('Erro ao ler BUNDLED_DB_FILE:', err.message);
    }

    const fallback = getDefaultDatabase();
    saveDatabase(fallback);
    return fallback;
}

function saveDatabase(data) {
    try {
        cachedDb = data;
        lastDbReadTime = Date.now();
        const tmpTarget = WRITABLE_DB_FILE + '.tmp';
        fs.writeFileSync(tmpTarget, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpTarget, WRITABLE_DB_FILE);
        return true;
    } catch (err) {
        console.error('Erro ao salvar database:', err.message);
        try {
            fs.writeFileSync(WRITABLE_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (err2) {
            console.error('Falha no fallback de gravação:', err2.message);
            return false;
        }
    }
}

// Handler compatível com Vercel Serverless Function e Node.js padrão
module.exports = (req, res) => {
    // Cabeçalhos CORS & Performance
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
            const db = getDatabase();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(200);
            return res.end(JSON.stringify(db));
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const processPayload = (payload) => {
                try {
                    const currentDb = getDatabase();
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

                    const saved = saveDatabase(updatedDb);
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(200);
                    return res.end(JSON.stringify({
                        success: true,
                        message: 'Dados da frota sincronizados com sucesso no servidor online',
                        updatedAt: updatedDb.updatedAt,
                        data: updatedDb
                    }));
                } catch (err) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.writeHead(500);
                    return res.end(JSON.stringify({ error: 'Erro ao processar dados: ' + err.message }));
                }
            };

            // Suporta req.body pré-parseado pela Vercel ou buffer de stream nativo
            if (req.body && typeof req.body === 'object') {
                return processPayload(req.body);
            }

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
                if (body.length > 50 * 1024 * 1024) {
                    req.destroy();
                }
            });

            req.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    return processPayload(parsed);
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
