// export {};

// declare global {

interface Window {
    ton: TonProvider;
    tonProtocolVersion: number
    // importScripts: (...scripts: any) => Promise<void>
}

// }

type WindowState = {
    top: number,
    left: number,
    height: number,
    width: number
}

class TonProvider {
    private listeners: { [key: string]: ((...args: any) => void)[] };
    private isTonWallet: boolean;
    private targetOrigin: string;
    private _nextJsonRpcId: number;
    private _promises: any;

    private _onMessage: any; // ???? type

    constructor() {
        this.listeners = window.ton ? window.ton.listeners : {};

        this.isTonWallet = true;
        this.targetOrigin = '*'; // todo

        // Init storage
        this._nextJsonRpcId = window.ton ? window.ton._nextJsonRpcId : 0;
        this._promises = window.ton ? window.ton._promises : {};

        // Fire the connect
        this._connect();

        // Listen for jsonrpc responses
        this._onMessage = this._handleJsonRpcMessage.bind(this);
        window.addEventListener('message', this._onMessage);
    }

    /* Connection handling */
    _connect() {
        // Send to TON Wallet
        window.postMessage(
            {type: 'TONHoldAPI_ton_provider_connect'},
            this.targetOrigin,
        );

        // Reconnect on close
        // this.once('close', this._connect.bind(this)); todo
    }

    /* Methods */

    send(method: string, params = []) {
        const id = this._nextJsonRpcId++;
        const jsonrpc = '2.0';
        const payload = {
            jsonrpc,
            id,
            method,
            params,
        };

        const promise = new Promise((resolve, reject) => {
            this._promises[payload.id] = {
                resolve,
                reject,
            };
        });

        // Send jsonrpc request to TON Wallet
        window.postMessage(
            {
                type: 'TONHoldAPI_ton_provider_write',
                message: payload,
            },
            this.targetOrigin,
        );

        return promise;
    }

    /* Internal methods */

    async _handleJsonRpcMessage(event: any) {
        // Return if no data to parse
        if (!event || !event.data) return;

        let data;
        try {
            data = JSON.parse(event.data);
        } catch (error) {
            // Return if we can't parse a valid object
            return;
        }

        if (data.type !== 'TONHoldAPI') return;

        // Return if not a jsonrpc response
        if (!data || !data.message || !data.message.jsonrpc) return;

        const message = data.message;
        const {
            id,
            method,
            error,
            result,
        } = message;

        if (typeof id !== 'undefined') {
            const promise = this._promises[id];
            if (promise) {
                // Handle pending promise
                if (data.type === 'error') {
                    promise.reject(message);
                } else if (message.error) {
                    promise.reject(error);
                } else {
                    promise.resolve(result);
                }
                delete this._promises[id];
            }
        } else {
            if (method) {
                if (method.indexOf('_subscription') > -1) {
                    // Emit subscription notification
                    this._emitNotification(message.params);
                } else if (method === 'ton_accounts') { // todo
                    this._emitAccountsChanged(message.params);
                }
            }
        }
    }

    /* Events */

    _emitNotification(result: any) {
        this.emit('notification', result);
    }

    _emitAccountsChanged(accounts: any[]) {
        this.emit('accountsChanged', accounts);
    }

    /* EventEmitter */

    on(method: string, listener: () => void) {
        let methodListeners = this.listeners[method];
        if (!methodListeners) {
            methodListeners = [];
            this.listeners[method] = methodListeners;
        }
        if (methodListeners.indexOf(listener) === -1) {
            methodListeners.push(listener);
        }
        return this;
    }

    removeListener(method: string, listener: () => void) {
        const methodListeners = this.listeners[method];
        if (!methodListeners) return;
        const index = methodListeners.indexOf(listener);
        if (index > -1) {
            methodListeners.splice(index, 1);
        }
    }

    emit(method: string, ...args: any) {
        const methodListeners = this.listeners[method];
        if (!methodListeners || !methodListeners.length) return false;
        methodListeners.forEach(listener => listener(...args));
        return true;
    }
}

(() => {
    const havePrevInstance = !!window.ton;
    window.tonProtocolVersion = 1;
    window.ton = new TonProvider();
    if (!havePrevInstance) window.dispatchEvent(new Event('tonready'));
})();
