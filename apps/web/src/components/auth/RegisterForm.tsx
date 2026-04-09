'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchClient } from '@/lib/api';
import { useAuthStore, type User } from '@/stores/auth-store';
import { FieldWrapper, inputClass } from './shared';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Имя должно содержать не менее 2 символов'),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+7[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(val),
        { message: 'Введите номер в формате +7 (___) ___-__-__' }
      ),
    email: z.string().email('Введите корректный email'),
    password: z
      .string()
      .min(8, 'Пароль должен содержать не менее 8 символов')
      .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterFields = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFields) => {
    setServerError(null);
    try {
      const payload: Record<string, string> = {
        name: data.name,
        email: data.email,
        password: data.password,
      };
      if (data.phone) payload.phone = data.phone;

      const res = await fetchClient<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUser(res.data);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('email')) {
        setServerError('Email уже зарегистрирован');
      } else {
        setServerError('Не удалось создать аккаунт. Попробуйте позже');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <FieldWrapper id="reg-name" label="Имя" error={errors.name?.message}>
        <input
          id="reg-name"
          type="text"
          placeholder="Имя"
          autoComplete="given-name"
          {...register('name')}
          className={inputClass}
        />
      </FieldWrapper>

      {/* Phone */}
      <FieldWrapper id="reg-phone" label="Телефон (необязательно)" error={errors.phone?.message}>
        <input
          id="reg-phone"
          type="tel"
          placeholder="+7 (___) ___-__-__"
          autoComplete="tel"
          {...register('phone')}
          className={inputClass}
        />
      </FieldWrapper>

      {/* Email */}
      <FieldWrapper id="reg-email" label="Email" error={errors.email?.message}>
        <input
          id="reg-email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          {...register('email')}
          className={inputClass}
        />
      </FieldWrapper>

      {/* Password */}
      <FieldWrapper id="reg-password" label="Пароль" error={errors.password?.message}>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            autoComplete="new-password"
            {...register('password')}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-[var(--color-dark)] transition-colors duration-150"
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FieldWrapper>

      {/* Confirm password */}
      <FieldWrapper
        id="reg-confirm"
        label="Повторите пароль"
        error={errors.confirmPassword?.message}
      >
        <div className="relative">
          <input
            id="reg-confirm"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Повторите пароль"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-[var(--color-dark)] transition-colors duration-150"
            aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FieldWrapper>

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-[var(--color-error)]">{serverError}</p>
      )}

      <Button type="submit" className="w-full mt-1" disabled={isSubmitting}>
        {isSubmitting ? 'Регистрируем...' : 'Зарегистрироваться'}
      </Button>
    </form>
  );
}
