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

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginFields = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setServerError(null);
    try {
      const res = await fetchClient<User>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(res.data);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error && (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('network'))
        ? 'Ошибка сети. Проверьте подключение к интернету.'
        : 'Неверный email или пароль';
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FieldWrapper id="login-email" label="Email" error={errors.email?.message}>
        <input
          id="login-email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          {...register('email')}
          className={inputClass}
        />
      </FieldWrapper>

      <FieldWrapper id="login-password" label="Пароль" error={errors.password?.message}>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            autoComplete="current-password"
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

      {serverError && (
        <p className="text-sm text-[var(--color-error)]">{serverError}</p>
      )}

      <Button type="submit" className="w-full mt-1" disabled={isSubmitting}>
        {isSubmitting ? 'Входим...' : 'Войти'}
      </Button>
    </form>
  );
}
