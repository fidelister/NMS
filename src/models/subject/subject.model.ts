import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';
import ClassModel from '../class/class.model';
import Session from '../session/session.model';

interface SubjectAttributes {
    id: number;
    name: string;
    classId: number;
    teacherId?: number | null;
    sessionId?: number;
}

interface SubjectCreationAttributes extends Optional<SubjectAttributes, 'id'> { }

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
    public id!: number;
    public name!: string;
    public classId!: number;
    public teacherId?: number | null;
    public sessionId!: number;
}

Subject.init(
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
        classId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'classes',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        teacherId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'teachers', // 👈 Table name of Teacher model
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        sessionId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "sessions", key: "id" },
            onDelete: "CASCADE",
        }
    },
    {
        sequelize,
        modelName: 'Subject',
        tableName: 'subjects',
    }
);
Subject.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(Subject, { foreignKey: "sessionId", as: "subjects" });
export default Subject;
