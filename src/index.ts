import { Client } from 'pg';
import { createClient } from 'redis';  
import type { DbMessage } from '../types'

const pgClient = new Client({
    user: 'your_user',
    host: 'localhost',
    database: 'my_database',
    password: 'your_password',
    port: 5432,
});
pgClient.connect();

async function main() {
    const redisClient = createClient();
    await redisClient.connect();
    console.log("connected to redis");

    while (true) {
        const response = await redisClient.rPop("db_processor" as string)
        if (!response) {

        }  else {
            const data: DbMessage = JSON.parse(response);
            if (data.type === "TRADE_ADDED") {
                console.log("adding data");
                console.log(data);
                const price = data.data.price;
                const timestamp = new Date(data.data.timestamp);
                const volume = data.data.quantity
                 const currency_code = data.data.market.split('_')[1] || 'INR'
                const query = 'INSERT INTO tata_prices (time, price,volume,currency_code) VALUES ($1, $2, $3, $4)';
                
                const values = [timestamp, parseFloat(price),parseFloat(volume), currency_code];
                await pgClient.query(query, values);
            }
        }
    }

}

main();