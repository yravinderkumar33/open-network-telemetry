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


    pushList(key, value) {
        try {
            this.redisClient.lpush(key, value);
        } catch (error) {
            console.error('Error pushing data to Redis:', error);
            throw new Error('Error pushing data to Redis:', error.message);
        }
    }

    getList(key) {
        try {
            return this.redisClient.lrange(key, 0, -1);
        } catch (error) {
            console.error('Error fetching data from Redis:', error);
            throw new Error('Error fetching data from Redis:', error.message);
        }
    }

    getListLength(key) {
        try {
            return this.redisClient.llen(key);
        } catch (error) {
            console.error('Error fetching list length from Redis:', error);
            throw new Error('Error fetching list length from Redis:', error.message);
        }
    }

    delKey(key) {
        try {
            this.redisClient.del(key);
        } catch (error) {
            console.error('Error deleting key from Redis:', error);
            throw new Error('Error deleting key from Redis:', error.message);
        }
    }
}