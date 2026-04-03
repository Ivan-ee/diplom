'use client';
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-heading text-xl font-semibold text-[var(--color-dark)]">
            Что-то пошло не так
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {this.state.error?.message ?? 'Попробуйте перезагрузить страницу'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-4 rounded-lg bg-[var(--color-dusty-rose)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-dusty-rose-hover)] transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
