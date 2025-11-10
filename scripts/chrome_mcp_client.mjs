import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_PROTOCOL_VERSION = '2024-11-05';

export class ChromeMcpClient {
  constructor({
    headless = true,
    isolated = true,
    viewport = '1400x900',
    extraArgs = [],
    verbose = false,
  } = {}) {
    const cliArgs = ['chrome-devtools-mcp@latest'];
    cliArgs.push(`--headless=${headless}`);
    cliArgs.push(`--isolated=${isolated}`);
    if (viewport) {
      cliArgs.push('--viewport', viewport);
    }
    cliArgs.push(...extraArgs);

    this.verbose = verbose;
    this.child = spawn('npx', cliArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    this.closed = false;

    this.child.stdout.on('data', chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.#processBuffer();
    });

    this.child.stderr.on('data', chunk => {
      if (this.verbose) {
        process.stderr.write(chunk);
      }
    });

    this.child.on('exit', (code, signal) => {
      this.closed = true;
      const error = new Error(
        `chrome-devtools-mcp exited (code=${code}, signal=${signal})`,
      );
      for (const { reject } of this.pending.values()) {
        reject(error);
      }
      this.pending.clear();
    });
  }

  async init({
    clientName = 'custom-script',
    clientVersion = '0.1.0',
    protocolVersion = DEFAULT_PROTOCOL_VERSION,
    capabilities = {},
  } = {}) {
    const result = await this.#sendRequest('initialize', {
      protocolVersion,
      capabilities,
      clientInfo: {
        name: clientName,
        version: clientVersion,
      },
    });
    await this.#sendNotification('initialized', {});
    return result;
  }

  async listTools() {
    return this.#sendRequest('tools/list', {});
  }

  async callTool(name, args = {}) {
    return this.#sendRequest('tools/call', {
      name,
      arguments: args,
    });
  }

  async shutdown() {
    if (this.closed) return;
    try {
      await this.#sendRequest('shutdown', {});
    } catch (error) {
      if (this.verbose) {
        console.warn('shutdown error', error);
      }
    } finally {
      this.child.stdin.end();
    }
  }

  #writeMessage(message) {
    if (this.closed) {
      throw new Error('chrome-devtools-mcp process already exited');
    }
    const payload = Buffer.from(JSON.stringify(message), 'utf8');
    const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`);
    this.child.stdin.write(header);
    this.child.stdin.write(payload);
  }

  #sendRequest(method, params) {
    const id = this.nextId++;
    if (this.verbose) {
      console.error(`-> ${method} (${id})`, JSON.stringify(params));
    }
    this.#writeMessage({
      jsonrpc: '2.0',
      id,
      method,
      params,
    });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  #sendNotification(method, params) {
    this.#writeMessage({
      jsonrpc: '2.0',
      method,
      params,
    });
  }

  #processBuffer() {
    while (this.buffer.length) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        return;
      }
      const headerChunk = this.buffer.slice(0, headerEnd).toString('utf8');
      const match = headerChunk.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        throw new Error(`Invalid MCP header: ${headerChunk}`);
      }
      const length = Number(match[1]);
      const messageEnd = headerEnd + 4 + length;
      if (this.buffer.length < messageEnd) {
        return;
      }
      const body = this.buffer.slice(headerEnd + 4, messageEnd).toString('utf8');
      this.buffer = this.buffer.slice(messageEnd);
      const payload = JSON.parse(body);
      this.#handleMessage(payload);
    }
  }

  #handleMessage(message) {
    if (message.id !== undefined) {
      if (this.verbose) {
        console.error(`<-${message.id}`, JSON.stringify(message));
      }
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(
          new Error(
            message.error.message ||
              `Unknown MCP error (code=${message.error.code})`,
          ),
        );
      } else {
        pending.resolve(message.result);
      }
      return;
    }
    if (this.verbose) {
      console.error('notification', JSON.stringify(message));
    }
  }
}

const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  (async () => {
    const client = new ChromeMcpClient({ verbose: true });
    try {
      await client.init();
      const tools = await client.listTools();
      const preview = tools.tools.slice(0, 5).map(tool => tool.name);
      const remaining = Math.max(0, tools.tools.length - preview.length);
      console.log(
        `Available tools: ${preview.join(', ')}${
          remaining ? ` ... (+${remaining} more)` : ''
        }`,
      );
    } finally {
      await client.shutdown();
    }
  })().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
