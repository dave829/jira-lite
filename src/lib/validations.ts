import { z } from 'zod';
import { LIMITS } from './constants';

// Auth Validations
export const signUpSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요').max(LIMITS.EMAIL_MAX),
  password: z
    .string()
    .min(LIMITS.PASSWORD_MIN, `비밀번호는 ${LIMITS.PASSWORD_MIN}자 이상이어야 합니다`)
    .max(LIMITS.PASSWORD_MAX),
  name: z
    .string()
    .min(1, '이름을 입력하세요')
    .max(LIMITS.USER_NAME_MAX, `이름은 ${LIMITS.USER_NAME_MAX}자 이하여야 합니다`),
});

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
    newPassword: z
      .string()
      .min(LIMITS.PASSWORD_MIN, `비밀번호는 ${LIMITS.PASSWORD_MIN}자 이상이어야 합니다`)
      .max(LIMITS.PASSWORD_MAX),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력하세요')
    .max(LIMITS.USER_NAME_MAX),
  profile_image: z.string().url().nullable().optional(),
});

// Team Validations
export const teamSchema = z.object({
  name: z
    .string()
    .min(1, '팀 이름을 입력하세요')
    .max(LIMITS.TEAM_NAME_MAX, `팀 이름은 ${LIMITS.TEAM_NAME_MAX}자 이하여야 합니다`),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
});

// Project Validations
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, '프로젝트 이름을 입력하세요')
    .max(LIMITS.PROJECT_NAME_MAX),
  description: z
    .string()
    .max(LIMITS.PROJECT_DESCRIPTION_MAX)
    .nullable()
    .optional(),
});

// Issue Validations
export const issueSchema = z.object({
  title: z
    .string()
    .min(1, '이슈 제목을 입력하세요')
    .max(LIMITS.ISSUE_TITLE_MAX),
  description: z
    .string()
    .max(LIMITS.ISSUE_DESCRIPTION_MAX)
    .nullable()
    .optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  assignee_id: z.string().uuid().nullable().optional().or(z.literal('')),
  due_date: z.string().nullable().optional().or(z.literal('')),
  label_ids: z.array(z.string().uuid()).max(LIMITS.MAX_LABELS_PER_ISSUE).optional(),
});

export const subtaskSchema = z.object({
  title: z
    .string()
    .min(1, '서브태스크 제목을 입력하세요')
    .max(LIMITS.SUBTASK_TITLE_MAX),
});

// Comment Validations
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력하세요')
    .max(LIMITS.COMMENT_MAX),
});

// Label Validations
export const labelSchema = z.object({
  name: z.string().min(1).max(LIMITS.LABEL_NAME_MAX),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '유효한 HEX 색상을 입력하세요'),
});

// Status Validations
export const statusSchema = z.object({
  name: z.string().min(1).max(LIMITS.STATUS_NAME_MAX),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type IssueInput = z.infer<typeof issueSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type LabelInput = z.infer<typeof labelSchema>;
