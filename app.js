const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent');

const program = new Command();

// Обробка параметрів командного рядка
program
    .requiredOption('-h, --host <host>', 'Server address')
    .requiredOption('-p, --port <port>', 'Server port')
    .requiredOption('-c, --cache <path>', 'Cache directory path');

program.parse(process.argv);
const options = program.opts();

// Шлях до кешу
const cachePath = path.resolve(options.cache);

// Створення HTTP сервера
const server = http.createServer(async (req, res) => {
    const code = req.url.slice(1);  // Наприклад, з /200 отримуємо '200'

    try {
        if (req.method === 'GET') {
            // Читання файлу з кешу
            const filePath = path.join(cachePath, `${code}.jpg`);
            try {
                const data = await fs.readFile(filePath);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(data);
            } catch (fileError) {
                // Якщо файл не знайдено в кеші, запит до http.cat
                try {
                    const response = await superagent.get(`https://http.cat/${code}`);
                    await fs.writeFile(filePath, response.body);
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(response.body);
                } catch (httpError) {
                    // Якщо запит до http.cat завершився помилкою
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            }

        } else if (req.method === 'PUT') {
            // Запис файлу в кеш
            let body = [];
            req.on('data', chunk => {
                body.push(chunk);
            }).on('end', async () => {
                body = Buffer.concat(body);
                const filePath = path.join(cachePath, `${code}.jpg`);
                await fs.writeFile(filePath, body);
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Created');
            });

        } else if (req.method === 'DELETE') {
            // Видалення файлу з кешу
            const filePath = path.join(cachePath, `${code}.jpg`);
            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Deleted');

        } else {
            // Якщо використано невірний метод
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    } catch (err) {
        // Обробка загальної помилки
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
