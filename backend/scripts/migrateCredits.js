const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnsphere';

async function main() {
    try {
        await mongoose.connect(DB_URI, {
            family: 4,
            serverSelectionTimeoutMS: 10000,
        });

        console.log('Connected to MongoDB for credit migration');

        const filter = {
            isSubscribed: false,
            $or: [
                { credits: { $lt: 20 } },
                { credits: { $exists: false } }
            ]
        };

        const update = { $set: { credits: 20 } };

        const result = await User.updateMany(filter, update);

        console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        try { await mongoose.disconnect(); } catch(e){}
        process.exit(1);
    }
}

main();
