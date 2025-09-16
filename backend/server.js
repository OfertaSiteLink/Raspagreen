const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`Recebendo requisição para: ${req.url}`);
    
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
                'Access-Control-Allow-Headers': 'Content-Type'
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
