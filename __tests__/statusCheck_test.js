const request = require('supertest');
const app = require('../app'); // importe ton application Express

describe('POST /api/checkStatus', () => {
    it('should return status of each URL', async () => {
        const response = await request(app)
            .post('/api/checkStatus')
            .send({ urls: ['http://www.google.com'] })
            .expect(200);

        expect(response.body).toEqual([{ url: 'http://www.google.com', status: 'up' }]);
    });

    it('should return 400 if urls are not provided', async () => {
        const response = await request(app)
            .post('/api/checkStatus')
            .send({})
            .expect(400);

        expect(response.body).toEqual({ message: 'URLs not provided' });
    });

    it('should return 400 if urls are not correct', async () => {
        const response = await request(app)
            .post('/api/checkStatus')
            .send({urls: ["http://salut.com"]})
            .expect(400);

        expect(response.body).toEqual({ message: 'URLs not conformed' });
    });
});
