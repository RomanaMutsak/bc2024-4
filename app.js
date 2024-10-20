const http = require('http');
const { Command } = require('commander');
const program = new Command();

program
    .requiredOption('-h, --host <host>', 'Server address')
    .requiredOption('-p, --port <port>', 'Server port')
    .requiredOption('-c, --cache <path>', 'Cache directory path');

program.parse(process.argv);

const options = program.opts();

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, world!\n');
});

server.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
