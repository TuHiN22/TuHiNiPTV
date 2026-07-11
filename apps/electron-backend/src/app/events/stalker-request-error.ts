/**
 * Error thrown by the Stalker IPC handler. Extending Error ensures the message
 * survives Electron IPC serialization; the status is also embedded because
 * Electron can flatten rejected errors before they reach the renderer.
 */
export class StalkerRequestError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(`${message} (status: ${status})`);
        this.name = 'StalkerRequestError';
        this.status = status;
    }
}
