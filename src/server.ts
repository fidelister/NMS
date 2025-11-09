import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rootRoutes from './routes/index.route';
import { connectDB } from './database';
import Admin from './models/auth/admin.model';


dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', rootRoutes)
// Simple route test
// app.get('/', (req: Request, res: Response) => {
//   res.send('API is running...');
// });
// console.log(Admin.getTableName());

// Connect to DB and start server
const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
};

startServer();
