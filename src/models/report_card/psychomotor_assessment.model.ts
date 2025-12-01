import { DataTypes, Model } from "sequelize";
import sequelize from "../../database";
import { Student, ClassModel } from "../association.model";
import Session from "../session/session.model";

class PsychomotorAssessment extends Model {
    public id!: number;
    public studentId!: number;
    public classId!: number;
    public term!: string;
    public sessionId!: number;
    public skills!: any;
    public behaviours!: any;
}

PsychomotorAssessment.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        studentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "students", key: "id" },
            onDelete: "CASCADE",
        },
        classId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "classes", key: "id" },
            onDelete: "CASCADE",
        },
        sessionId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "sessions", key: "id" },
            onDelete: "CASCADE",
        },
        term: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        skills: {
            type: DataTypes.TEXT,
            allowNull: false,
            get() {
                const raw = this.getDataValue("skills");
                return raw ? JSON.parse(raw) : null;
            },
            set(value: any) {
                this.setDataValue("skills", JSON.stringify(value));
            },
        },
        behaviours: {
            type: DataTypes.TEXT,
            allowNull: false,
            get() {
                const raw = this.getDataValue("behaviours");
                return raw ? JSON.parse(raw) : null;
            },
            set(value: any) {
                this.setDataValue("behaviours", JSON.stringify(value));
            },
        },

    },
    {
        sequelize,
        modelName: "PsychomotorAssessment",
        tableName: "psychomotor_assessments",
    }
);

// Relations
PsychomotorAssessment.belongsTo(Student, { foreignKey: "studentId", as: "student" });
PsychomotorAssessment.belongsTo(ClassModel, { foreignKey: "classId", as: "class", onDelete: "CASCADE" });
PsychomotorAssessment.belongsTo(Session, { foreignKey: "sessionId", as: "session" });

export default PsychomotorAssessment;
