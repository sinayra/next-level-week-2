const { AuthenticationError, ForbiddenError, UserInputError, ApolloError } = require('apollo-server');
const auth = require('../util/auth');

module.exports = {
    signup: async (parent, { account }, { dataSources, res, user }, info) => {

        if (user) {
            throw new ApolloError("You must logout before create a new account");
        }

        const existingUser = await dataSources.userAPI.getUserByEmail(account.email.toLowerCase());

        if (existingUser) {
            throw new AuthenticationError("A user account with this email already exists");
        }

        if (account.role === 'ADMIN') {
            throw new ForbiddenError("Cannot creates an admin account via client.");
        }

        const newUser = await dataSources.userAPI.addUser(account);

        if (account.role === 'STUDENT') {
            await dataSources.studentAPI.addStudent(newUser);
        }
        else if (account.role === 'TEACHER') {
            await dataSources.teacherAPI.addTeacher(newUser)
        }

        const token = auth.createToken(newUser);
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: true,
            secure: true
        });

        return {
            user: newUser
        }
    },

    logout: async (parent, args, { dataSources, res }, info) => {
        res.clearCookie("token");
        return {
            user: undefined,
        };
    },

    login: async (parent, { account }, { dataSources, res }, info) => {
        const existingUser = await dataSources.userAPI.getUserByEmail(account.email.toLowerCase());

        if (!existingUser) {
            throw new AuthenticationError("Incorrect email address or password.");
        }

        const isValidPassword = auth.verifyPassword(
            account.password,
            existingUser.hash
        );

        if (!isValidPassword) {
            throw new AuthenticationError("Incorrect email address or password.");
        }

        const token = auth.createToken(existingUser);
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: true,
            secure: true
        });

        return {
            user: existingUser
        }
    },

    updateUser: async (parent, { userInput }, { dataSources, user }, info) => {
        let userId = null;

        if (user.role === "ADMIN") {
            userId = (userInput._id ? userInput._id : user._id);
        } else {
            userId = user._id;
        }

        let existingUser = await dataSources.userAPI.getUserById(userId);

        if (existingUser) {
            existingUser = await dataSources.userAPI.updateUser(userId, userInput);

            return existingUser;
        }

        throw new ApolloError("User not found");
    },

    updateTeacher: async (parent, { teacherInput }, { dataSources, user }, info) => {
        let teacherBefore = null;

        if (user.role === "TEACHER") {
            teacherBefore = await dataSources.teacherAPI.getTeacherByUser(user);
        }
        else {
            if (!teacherInput._id) {
                throw new UserInputError("Teacher id is missing");
            }
            teacherBefore = await dataSources.teacherAPI.getTeacherById(teacherInput._id);
        }

        if (teacherBefore) {
            let { schedules, ...data } = teacherInput;

            data.schedule_ids = schedules.map(async (schedule) => {
                if (schedule._id) {
                    await dataSources.scheduleAPI.updateSchedule(schedules[i]._id, schedules[i]);
                }
                else {
                    schedule = await dataSources.scheduleAPI.addSchedule(teacherBefore._id, schedules[i]);
                }

                return schedule._id;
            });
            const removeSchedules = teacherBefore.schedule_ids.filter((elem) => !data.schedule_ids.includes(elem));
            removeSchedules.forEach(async (id) => await dataSources.scheduleAPI.deleteSchedule(id));

            return await dataSources.teacherAPI.updateTeacher(teacherBefore._id, data);
        }

        throw new ApolloError("Teacher not found");
    },

    toogleFavoriteTeacher: async (parent, { teacherId, studentId }, { dataSources, user }, info) => {
        let existingStudentId = null;
        let student;

        if (user.role === 'STUDENT') {
            student = await dataSources.studentAPI.getStudentById(user._id);

        }
        else {
            if (!studentId) {
                throw new UserInputError("Student id is missing");
            }
            student = await dataSources.studentAPI.getStudentById(studentId);
        }

        existingStudentId = student ? student._id : null;

        if (existingStudentId) {

            return await dataSources.studentAPI.toogleFavoriteTeacher(existingStudentId, teacherId);
        }

        throw new ApolloError("Student not found");

    },

    addTeacherStudentConnection: async (parent, { teacherId, studentId }, { dataSources, user }, info) => {
        let existingStudentId = null;
        let student;

        if (user.role === 'STUDENT') {
            student = await dataSources.studentAPI.getStudentById(user._id);

        }
        else {
            if (!studentId) {
                throw new UserInputError("Student id is missing");
            }
            student = await dataSources.studentAPI.getStudentById(studentId);
        }

        existingStudentId = student ? student._id : null;

        if (existingStudentId) {
            return await dataSources.studentAPI.addTeacherStudentConnection(existingStudentId, teacherId);
        }

        throw new ApolloError("Student not found");

    }
};