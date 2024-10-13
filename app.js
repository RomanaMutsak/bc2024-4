const http = require('http');
const { Command } = require('commander');
const program = new Command();

// Опис аргументів командного рядка
program
    .requiredOption('-h, --host <host>', 'server address')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <path>', 'cache directory path')
    .parse(process.argv);

const options = program.opts();

// Перевірка, що всі обов'язкові параметри задані
if (!options.host || !options.port || !options.cache) {
    console.error('Error: All required options must be specified.');
    process.exit(1);
}

// Створення HTTP сервера
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Server is running!\n');
});

// Запуск сервера
server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
    console.log(`Cache directory is set to: ${options.cache}`);
});
