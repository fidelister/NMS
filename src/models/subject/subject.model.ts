import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';
import ClassModel from '../class/class.model';

interface SubjectAttributes {
    id: number;
    name: string;
    classId: number;
    teacherId?: number | null;
}

interface SubjectCreationAttributes extends Optional<SubjectAttributes, 'id'> { }

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
    public id!: number;
    public name!: string;
    public classId!: number;
    public teacherId?: number | null;
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
    },
    {
        sequelize,
        modelName: 'Subject',
        tableName: 'subjects',
    }
);

export default Subject;
