
class ApiClient {
    constructor() {
        this.responseMap = {};
        this.nextMessageId = 1;
        this.handlers = [];
    }

    start() {
        this.socket = new WebSocket('wss://s-usc1a-nss-2040.firebaseio.com/.ws?v=5&ns=pq-dev');
        this.socket.addEventListener('message', (m) => { this.handleResponse(m); });
        return new Promise((resolve, reject) => {
            this.socket.addEventListener('open', resolve);
        });
    }

    handleResponse(message) {
        let data = JSON.parse(message.data);
        switch (data.t) {
            case 'c':// Don't know, log it I guess
                console.log("C style message", message);
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
                    this.handlers.forEach(h => {
                        h(data);
                    });
                }

                break;
            default:
                console.log("Unknown message", message);
        }
    }

    submitMessage(type, body) {
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
            this.socket.send(JSON.stringify(wrapper));
        });

        return result;
    }

    addHandler(handlerFunction) {
        this.handlers.push(handlerFunction);
    }
}

export { ApiClient };