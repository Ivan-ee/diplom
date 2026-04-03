'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchClient } from '@/lib/api';
import { useAuthStore, type User } from '@/stores/auth-store';

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
    } catch {
      setServerError('Неверный email или пароль');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-medium text-[var(--color-dark)]">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          {...register('email')}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-[var(--color-dark)] placeholder:text-gray-400 transition-colors duration-150 focus:border-[var(--color-dusty-rose)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dusty-rose)]/50 disabled:opacity-50"
        />
        {errors.email && (
          <p className="text-sm text-[var(--color-error)]">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-medium text-[var(--color-dark)]">
          Пароль
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            autoComplete="current-password"
            {...register('password')}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 pr-11 text-sm text-[var(--color-dark)] placeholder:text-gray-400 transition-colors duration-150 focus:border-[var(--color-dusty-rose)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dusty-rose)]/50 disabled:opacity-50"
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
        {errors.password && (
          <p className="text-sm text-[var(--color-error)]">{errors.password.message}</p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-[var(--color-error)]">{serverError}</p>
      )}

      <Button type="submit" className="w-full mt-1" disabled={isSubmitting}>
        {isSubmitting ? 'Входим...' : 'Войти'}
      </Button>
    </form>
  );
}
