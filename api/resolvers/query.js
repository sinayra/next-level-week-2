const { ApolloError } = require("apollo-server");

module.exports = {
    users: async (parent, args, { dataSources }, info) => {
        return {
            code: 200,
            success: true,
            message: "Users had been retrieved",
            users: await dataSources.userAPI.getUsers()
        }
    },

    teachers: async (parent, { teacher }, { dataSources }, info) => {
        if (!teacher || !teacher.schedules) {
            return {
                code: 200,
                success: true,
                message: "Teachers had been retrieved",
                teachers: await dataSources.teacherAPI.getTeachers(teacher)
            }
        }

        const filteredSchedules = await dataSources.scheduleAPI.getSchedules(teacher.schedules);

        if (filteredSchedules.length > 0) {
            let set = new Set();
            filteredSchedules.forEach(elem => {
                set.add(elem.teacher_id);
            });

            const teacher_ids = Array.from(set);
            return {
                code: 200,
                success: true,
                message: "Teachers had been retrieved",
                teachers: teacher_ids.map((id) => dataSources.teacherAPI.findTeacher({ _id: id, ...teacher }))
            }
        }
        return {
            code: 400,
            success: false,
            message: "Filters could not be applied",
            error: new ApolloError("Filters could not be applied")
        }
    },

    students: async (parent, args, { dataSources }, info) => {
        return {
            code: 200,
            success: true,
            message: "Students had been retrieved",
            student: await dataSources.studentAPI.getStudents()
        }
    },

    teacherByCurrentUser: async (parent, args, { dataSources, user }, info) => {
        return {
            code: 200,
            success: true,
            message: "Teacher had been retrieved",
            teacher: await dataSources.teacherAPI.getTeacherByUser(user)
        }
    },

    studentByCurrentUser: async (parent, args, { dataSources, user }, info) => {
        return {
            code: 200,
            success: true,
            message: "Teacher had been retrieved",
            student: await dataSources.studentAPI.getStudentByUser(user)
        }
    },

}