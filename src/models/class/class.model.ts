import { DataTypes, Model, Optional, HasManyGetAssociationsMixin } from 'sequelize';
import sequelize from '../../database';
import Student from '../auth/student.model';
import Subject from '../subject/subject.model';
import Session from '../session/session.model';

interface ClassAttributes {
  id: number;
  name: string;
  teacherId?: number;
  sessionId?: number;
}

interface ClassCreationAttributes extends Optional<ClassAttributes, 'id'> { }

class ClassModel extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  public id!: number;
  public name!: string;
  public teacherId?: number;
    public sessionId!: number;
  // ✅ Add these optional association fields so TypeScript knows they exist
  public students?: Student[];
  public subjects?: Subject[];

  // ✅ (Optional) Sequelize mixins for better typing in your code
  public getStudents!: HasManyGetAssociationsMixin<Student>;
  public getSubjects!: HasManyGetAssociationsMixin<Subject>;
}

ClassModel.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
      sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "sessions", key: "id" },
      onDelete: "CASCADE",
    },
    teacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'teachers', // matches table name
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Class',
    tableName: 'classes',
  }
);
ClassModel.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(ClassModel, { foreignKey: "sessionId", as: "classes" });
export default ClassModel;
