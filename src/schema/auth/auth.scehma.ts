import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string()
        .min(2, { message: 'name should have at least 2 characters.' })
        .max(50, { message: 'name should have at most 50 characters.' })
        .nonempty({ message: 'name is required.' }),
    email: z.string()
        .email({ message: 'Email must be a valid email address.' })
        .nonempty({ message: 'Email is required.' }),
    password: z.string()
        .min(6, { message: 'Password should have at least 6 characters.' })
        .max(50, { message: 'Password should have at most 50 characters.' })
        .nonempty({ message: 'Password is required.' }),
    role: z.enum(['admin', 'teacher', 'student']).default('admin')
});

export const loginSchema = z.object({
 email: z.string()
        .email({ message: 'Email must be a valid email address.' })
        .nonempty({ message: 'Email is required.' }),

 password: z.string()
        .min(6, { message: 'Password should have at least 6 characters.' })
        .max(50, { message: 'Password should have at most 50 characters.' })
        .nonempty({ message: 'Password is required.' }),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: 'Email must be a valid email address.' }),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().nonempty({ message: 'Old password is required.' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password should have at least 6 characters.' }),
});