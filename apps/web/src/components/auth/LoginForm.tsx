'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
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
  returnPath?: string;
}

export function LoginForm({ onSuccess, returnPath }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

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
      if (returnPath) {
        router.push(returnPath);
      }
    } catch (err) {
      const message = err instanceof Error && (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('network'))
        ? 'Ошибка сети. Проверьте подключение к интернету.'
        : 'Неверный email или пароль';
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold font-heading text-center mb-6">Вход в аккаунт</h2>
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FieldWrapper>

      {serverError && (
        <p className="text-sm text-[var(--color-error)]">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[var(--color-dusty-rose)] hover:bg-[var(--color-dusty-rose-hover)] text-white rounded-xl h-11 text-sm font-medium mt-4 transition-colors disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? 'Входим...' : 'Войти'}
      </button>
    </form>
  );
}
