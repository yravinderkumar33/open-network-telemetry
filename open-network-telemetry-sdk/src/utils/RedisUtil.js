import Redis from "ioredis";


export class RedisClient {
    constructor(config) {
        this.config = config;
        this.initialize();
    }

    initialize() {
            this.redisClient = new Redis({
                port: this.config.telemetry.redis.port,
                host: this.config.telemetry.redis.host,
                db: this.config.telemetry.redis.db,
            });

            this.redisClient.on('error', (error) => {
                console.error('Error while establishing connection to redis ', error);
            });
    }


    async pushList(key, value) {
        try {
            await this.redisClient.lpush(key, value);
        } catch (error) {
            console.error('Error pushing data to Redis:', error);
            throw new Error('Error pushing data to Redis:', error.message);
        }
    }

    async getList(key) {
        try {
            let data = await this.redisClient.lrange(key, 0, -1);
            return data;
        } catch (error) {
            console.error('Error fetching data from Redis:', error);
            throw new Error('Error fetching data from Redis:', error.message);
        }
    }

    async getListLength(key) {
        try {
            let data = await this.redisClient.llen(key);
            return data;
        } catch (error) {
            console.error('Error fetching list length from Redis:', error);
            throw new Error('Error fetching list length from Redis:', error.message);
        }
    }

    async delKey(key) {
        try {
            await this.redisClient.del(key);
        } catch (error) {
            console.error('Error deleting key from Redis:', error);
            throw new Error('Error deleting key from Redis:', error.message);
        }
    }
}