const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

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

// Переконайся, що директорія кешу існує
fs.mkdir(cachePath, { recursive: true }).catch(console.error);

// Створення HTTP сервера
const server = http.createServer(async (req, res) => {
    const code = req.url.slice(1);  // Наприклад, з /200 отримуємо '200'
    console.log(`Received ${req.method} request for /${code}`);

    try {
        if (req.method === 'GET') {
            // Читання файлу з кешу
            const filePath = path.join(cachePath, `${code}.jpg`);
            console.log(`Looking for file: ${filePath}`);

            const data = await fs.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);

        } else if (req.method === 'PUT') {
            // Запис файлу в кеш
            let body = [];
            req.on('data', chunk => {
                body.push(chunk);
            }).on('end', async () => {
                body = Buffer.concat(body);
                const filePath = path.join(cachePath, `${code}.jpg`);
                console.log(`Saving file to: ${filePath}`);

                // Перевірка чи тіло запиту містить дані
                if (body.length > 0) {
                    await fs.writeFile(filePath, body);
                    console.log('File saved successfully');
                    res.writeHead(201, { 'Content-Type': 'text/plain' });
                    res.end('Created');
                } else {
                    console.log('No data received in the request');
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('No image data received');
                }
            });

        } else if (req.method === 'DELETE') {
            // Видалення файлу з кешу
            const filePath = path.join(cachePath, `${code}.jpg`);
            console.log(`Deleting file: ${filePath}`);

            await fs.unlink(filePath);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Deleted');

        } else {
            // Якщо використано невірний метод
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    } catch (err) {
        // Обробка помилки, якщо файл не знайдено
        console.error(err);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
