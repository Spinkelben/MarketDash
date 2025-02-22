
class ApiClient {
    constructor() {
        this.responseMap = {};
        this.nextMessageId = 1;
        this.handlers = [];
        this.socketUrl = 'wss://s-usc1a-nss-2040.firebaseio.com/.ws?v=5&ns=pq-dev';
        this.messagedToBeRead = [];
    }

    async start() {
        this.nextMessageId = 1;
        this.socket = new WebSocket(this.socketUrl);
        this.socket.addEventListener('message', (message) =>  this.handleResponse(message));
        this.socket.addEventListener('close', () => this.handleClose());
    }

    handleClose() {
        console.log("Socket closed");
    }

    handleResponse(message) {
        if (Number.isInteger(Number(message.data))) {
            this.numberOfChunks = Number(message.data);
            this.chunkBuffer = [];
            console.log("Received chunks:", this.numberOfChunks, "Original value:", message.data); return;
        }

        if (this.numberOfChunks > 0) {
            this.numberOfChunks--;
            this.chunkBuffer.push(message.data);
            if (this.numberOfChunks !== 0) {
                return;
            }
        }

        let data;
        if (this.chunkBuffer !== undefined) {
            let combined = this.chunkBuffer.join('');
            delete this.chunkBuffer;
            data = JSON.parse(combined);
        }
        else {
            data = JSON.parse(message.data);
        }

        switch (data.t) {

            case 'c': // Control maybe?
                if (data.d.t === "r") {
                    // Redirect
                    const newDomain = data.d.d;
                    if (newDomain !== undefined) {
                        this.socket.close();
                        this.socketUrl = `wss://${newDomain}/.ws?v=5&ns=pq-dev`;
                        this.start();
                    }
                }
                else {
                    this.messagedToBeRead.push(data);
                }
                break;
            case 'd': // Data maybe?
                console.log("D syle message", message);
                let id = data.d.r;
                let responseHandler = this.responseMap[id];
                if (id !== undefined && responseHandler !== undefined) {
                    // Its an ack message
                    responseHandler(data);
                    delete this.responseMap[id];
                }
                else {
                    this.messagedToBeRead.push(data);
                }

                break;
            default:
                console.log("Unknown message", message);
        }
    }

    submitMessage(type, body, timeout=5000) {
        let result = new Promise((resolve, reject) => {
            const id = this.nextMessageId++;
            this.responseMap[id] = resolve;
            let wrapper = {
                t: "d",
                d: {
                    r: id,
                    a: type,
                    b: body,
                }
            }
            const timeOutId = setTimeout(_ => reject("Timed out"), timeout);
            this.socket.send(JSON.stringify(wrapper));
            clearTimeout(timeOutId);
        });

        return result;
    }

    hasMessages() {
        return this.messagedToBeRead.length > 0;
    }

    peekMessage() {
        if (this.messagedToBeRead.length > 0) {
            return this.messagedToBeRead[0];
        }

        return null;
    }
    /**
     * Wait until a message is present
     * @param {Number} timeout ms to wait
     * @returns the message
     */
    async readMessage(timeout) {
        if (this.messagedToBeRead.length === 0) {
            let promise = new Promise((resolve, error) => {
                const timeOutId = setTimeout(_ => error("Timed out"), timeout);
                this.socket.addEventListener('message', _ => {
                    clearTimeout(timeOutId);
                    resolve();
                }, 
                { once: true, });
            });

            await promise;
        }

        const message = this.messagedToBeRead.shift();
        return message;
    }
}

export { ApiClient };
