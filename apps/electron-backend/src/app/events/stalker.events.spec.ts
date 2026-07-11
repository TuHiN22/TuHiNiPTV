import { StalkerRequestError } from './stalker-request-error';

describe('StalkerRequestError', () => {
    it('is a real Error and embeds status in its serializable message', () => {
        const error = new StalkerRequestError('HTTP Error: Not Found', 404);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('StalkerRequestError');
        expect(error.status).toBe(404);
        expect(error.message).toBe('HTTP Error: Not Found (status: 404)');
        expect(`${error.name}: ${error.message}`).toBe(
            'StalkerRequestError: HTTP Error: Not Found (status: 404)'
        );
    });
});
