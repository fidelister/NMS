import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

export const connectDB = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');
        // ✅ Sync models here
        await import ('../models/association.model')
        // await sequelize.sync({ alter: true });

        await sequelize.sync({ force: false });
        console.log('✅ All models synchronized successfully.');

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
};

export default sequelize;
