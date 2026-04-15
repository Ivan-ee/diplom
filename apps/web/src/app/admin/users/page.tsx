'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClient } from '@/lib/api';
import { cn } from '@/lib/utils';

// ---------- Types ----------

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  ordersCount?: number;
}

// ---------- Filter groups ----------

const FILTER_GROUPS: { label: string; role: 'user' | 'admin' | null }[] = [
  { label: 'Все',             role: null },
  { label: 'Пользователи',   role: 'user' },
  { label: 'Администраторы', role: 'admin' },
];

// ---------- Helpers ----------

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// ---------- EditUserModal ----------

const fieldClass =
  'w-full rounded-xl border border-[var(--color-champagne)] bg-white px-4 py-3 text-sm text-[var(--color-graphite)] focus:border-[var(--color-caramel)] focus:outline-none focus:ring-1 focus:ring-[var(--color-caramel)]';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}

function EditUserModal({ user, onClose, onSaved }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [role, setRole] = useState<'user' | 'admin'>(user.role);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Введите имя'); return; }
    setSaving(true);
    try {
      await fetchClient(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          role,
        }),
      });
      toast.success('Пользователь обновлён');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось обновить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-neutral-900">Редактировать пользователя</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              required
            />
          </div>

          {/* Email — readonly */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500">Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className={cn(fieldClass, 'bg-neutral-50 text-neutral-400 cursor-not-allowed')}
            />
          </div>

          {/* Телефон */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className={fieldClass}
            />
          </div>

          {/* Роль */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              className={fieldClass}
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-caramel)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-caramel-hover)] transition-colors disabled:opacity-50"
            >
              {saving && <RefreshCw size={13} className="animate-spin" />}
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- TableSkeleton ----------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-neutral-100 last:border-0">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded-lg bg-neutral-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------- Page ----------

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<number>(0);
  const [editUser, setEditUser] = useState<User | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchClient<User[]>('/admin/users')
      .then((res) => setUsers(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const activeRole = FILTER_GROUPS[activeFilter].role;
  const filtered = activeRole ? users.filter((u) => u.role === activeRole) : users;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Пользователи</h1>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTER_GROUPS.map((group, idx) => {
          const count = group.role
            ? users.filter((u) => u.role === group.role).length
            : users.length;
          return (
            <button
              key={idx}
              onClick={() => setActiveFilter(idx)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                activeFilter === idx
                  ? 'bg-[var(--color-caramel)] text-white'
                  : 'bg-white border border-[var(--color-champagne)] text-neutral-600 hover:border-neutral-300'
              )}
            >
              {group.label}
              {!loading && (
                <span
                  className={cn(
                    'ml-1.5',
                    activeFilter === idx ? 'text-white/70' : 'text-neutral-400'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Имя
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Телефон
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Роль
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Дата регистрации
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-neutral-400"
                  >
                    Пользователей нет
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      {user.phone ? (
                        <span className="text-neutral-600">{user.phone}</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditUser(user)}
                        title="Редактировать пользователя"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-300 hover:text-[var(--color-caramel)] hover:bg-neutral-100 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
