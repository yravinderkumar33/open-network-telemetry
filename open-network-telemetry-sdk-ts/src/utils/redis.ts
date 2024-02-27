import Redis from "ioredis";

export default (config: Record<string, any>) => {

    let redisClient: Redis;

    const init = (config: Record<string, any>) => {
        const { port, host, db } = config?.telemetry?.redis || {};
        redisClient = new Redis({ port, host, db });
        redisClient.on('error', onError);
    }

    const onError = (error: any) => {
        console.error('Error while establishing connection to redis ', error);
    };

    const pushList = (key: string, value: string) => {
        try {
            return redisClient.lpush(key, value);
        } catch (error) {
            console.error('Error pushing data to Redis:', error);
            throw error;
        }
    }

    const getList = (key: string) => {
        try {
            return redisClient.lrange(key, 0, -1);
        } catch (error) {
            console.error('Error fetching data from Redis:', error);
            throw error;
        }
    }

    const getListLength = (key: string) => {
        try {
            return redisClient.llen(key);
        } catch (error) {
            console.error('Error fetching list length from Redis:', error);
            throw error;
        }
    }

    const delKey = (key: string) => {
        try {
            return redisClient.del(key);
        } catch (error) {
            console.error('Error deleting key from Redis:', error);
            throw error;
        }
    }

    init(config);

    return {
        pushList,
        getList,
        getListLength,
        delKey
    }
}