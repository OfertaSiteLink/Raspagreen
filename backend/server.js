const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function handlePreflight(res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
}

function createPixPayment(amount = 0.5, description = 'Raspadinha Centavo da Sorte') {
    return new Promise((resolve, reject) => {
        if (!MP_ACCESS_TOKEN) {
            return reject(new Error('MP_ACCESS_TOKEN ausente. Configure a variável de ambiente.'));
        }

        const payload = JSON.stringify({
            transaction_amount: Number(amount),
            description,
            payment_method_id: 'pix',
            payer: {
                email: 'comprador@example.com'
            }
        });

        const options = {
            hostname: 'api.mercadopago.com',
            path: '/v1/payments',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (mpRes) => {
            let body = '';
            mpRes.on('data', (chunk) => (body += chunk));
            mpRes.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (mpRes.statusCode >= 200 && mpRes.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(`Mercado Pago erro ${mpRes.statusCode}: ${body}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function getPaymentStatus(paymentId) {
    return new Promise((resolve, reject) => {
        if (!MP_ACCESS_TOKEN) {
            return reject(new Error('MP_ACCESS_TOKEN ausente. Configure a variável de ambiente.'));
        }
        const options = {
            hostname: 'api.mercadopago.com',
            path: `/v1/payments/${paymentId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            }
        };
        const req = https.request(options, (mpRes) => {
            let body = '';
            mpRes.on('data', (chunk) => (body += chunk));
            mpRes.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (mpRes.statusCode >= 200 && mpRes.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(`Mercado Pago erro ${mpRes.statusCode}: ${body}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

const server = http.createServer((req, res) => {
    console.log(`Recebendo requisição para: ${req.url}`);
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return handlePreflight(res);
    }

    // API: criar pagamento PIX
    if (req.method === 'POST' && req.url === '/api/pix') {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', async () => {
            try {
                const data = body ? JSON.parse(body) : {};
                const amount = data.amount || 0.5;
                const description = data.description || 'Raspadinha Centavo da Sorte';
                const resp = await createPixPayment(amount, description);
                const tx = resp.point_of_interaction?.transaction_data || {};
                return sendJSON(res, 200, {
                    id: resp.id,
                    status: resp.status,
                    qr_code: tx.qr_code,
                    qr_code_base64: tx.qr_code_base64,
                    ticket_url: tx.ticket_url,
                    expiration_time: tx.expiration_time
                });
            } catch (err) {
                console.error('Erro ao criar PIX:', err.message);
                return sendJSON(res, 500, { error: 'Falha ao criar pagamento PIX', details: err.message });
            }
        });
        return;
    }

    // API: status do pagamento PIX
    if (req.method === 'GET' && req.url.startsWith('/api/pix/')) {
        const paymentId = req.url.split('/').pop();
        getPaymentStatus(paymentId)
            .then(json => sendJSON(res, 200, { id: json.id, status: json.status, status_detail: json.status_detail }))
            .catch(err => {
                console.error('Erro ao consultar PIX:', err.message);
                sendJSON(res, 500, { error: 'Falha ao consultar pagamento PIX', details: err.message });
            });
        return;
    }

    // Mapear URLs para arquivos
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './test-carousel.html';
    }

    // Obter a extensão do arquivo
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    // Mapear extensões para tipos MIME
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    // Definir o tipo de conteúdo com base no mapeamento
    contentType = mimeTypes[extname] || 'application/octet-stream';

    // Ler o arquivo
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                console.error(`Arquivo não encontrado: ${filePath}`);
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Erro interno do servidor: '+error.code);
                res.end();
            }
        } else {
            console.log(`Enviando arquivo: ${filePath} (${contentType})`);
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end(content, 'utf-8');
        }
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}/`);
    console.log('Pressione Ctrl+C para encerrar');
});

