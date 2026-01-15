import sequelize from "./database";
import { seedStudents } from "./seeders/student.seeder";

(async () => {
  try {
    await sequelize.authenticate();
    await seedStudents();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
