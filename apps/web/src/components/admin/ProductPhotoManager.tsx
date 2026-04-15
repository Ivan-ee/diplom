'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { uploadFileToMinio } from '@/lib/upload';

// ---------- Types ----------

export interface ProductPhotoManagerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

// ---------- SortablePhoto ----------

interface SortablePhotoProps {
  url: string;
  index: number;
  disabled?: boolean;
  onRemove: (url: string) => void;
}

function SortablePhoto({ url, index, disabled, onRemove }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--color-champagne)] bg-neutral-100 cursor-grab active:cursor-grabbing select-none"
    >
      <Image
        src={url}
        alt={`Фото товара ${index + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 33vw, 25vw"
        draggable={false}
      />

      {/* Badge "Главное" на первом фото */}
      {index === 0 && (
        <span className="absolute bottom-1 left-1 rounded-md bg-[var(--color-caramel)] px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
          Главное
        </span>
      )}

      {/* Кнопка удаления */}
      {!disabled && (
        <button
          type="button"
          aria-label="Удалить фото"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(url);
          }}
          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

// ---------- UploadingPlaceholder ----------

function UploadingPlaceholder() {
  return (
    <div className="relative aspect-square rounded-xl border-2 border-[var(--color-champagne)] bg-neutral-50 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-[var(--color-caramel)]" />
    </div>
  );
}

// ---------- DropZone ----------

interface DropZoneProps {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
}

function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [draggingOver, setDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDraggingOver(true);
  };

  const handleDragLeave = () => setDraggingOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    if (disabled || !e.dataTransfer.files.length) return;
    onFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFiles(e.target.files);
      // Сброс значения чтобы можно было выбрать тот же файл повторно
      e.target.value = '';
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Загрузить фотографии"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer select-none',
        draggingOver
          ? 'border-[var(--color-caramel)] bg-orange-50'
          : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)] hover:bg-orange-50',
        disabled ? 'opacity-50 pointer-events-none' : '',
      ].join(' ')}
    >
      <Upload size={20} className="text-[var(--color-caramel)]" />
      <span className="text-center text-[11px] text-neutral-500 px-2 leading-tight">
        Перетащите фото или нажмите для выбора
      </span>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}

// ---------- Validation ----------

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 МБ

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Файл «${file.name}»: допустимы только JPEG, PNG, WebP`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Файл «${file.name}»: размер превышает 10 МБ`;
  }
  return null;
}

// ---------- ProductPhotoManager ----------

export function ProductPhotoManager({
  photos,
  onChange,
  maxPhotos = 10,
  disabled = false,
}: ProductPhotoManagerProps) {
  // useRef для трекинга актуального состояния фото во избежание гонок
  const photosRef = useRef<string[]>(photos);
  photosRef.current = photos;

  const [uploadingCount, setUploadingCount] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ---------- Удаление ----------
  const handleRemove = useCallback(
    (url: string) => {
      onChange(photosRef.current.filter((p) => p !== url));
    },
    [onChange]
  );

  // ---------- Сортировка ----------
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = photosRef.current.indexOf(String(active.id));
      const newIndex = photosRef.current.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      onChange(arrayMove(photosRef.current, oldIndex, newIndex));
    },
    [onChange]
  );

  // ---------- Загрузка файлов ----------
  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList);

      // Клиентская валидация
      for (const file of files) {
        const err = validateFile(file);
        if (err) {
          toast.error(err);
          return;
        }
      }

      // Проверка лимита
      const slots = maxPhotos - photosRef.current.length;
      if (slots <= 0) {
        toast.error(`Максимум ${maxPhotos} фотографий`);
        return;
      }
      const filesToUpload = files.slice(0, slots);
      if (filesToUpload.length < files.length) {
        toast.error(`Можно добавить ещё ${slots} фото, остальные будут пропущены`);
      }

      setUploadingCount((n) => n + filesToUpload.length);

      // Параллельная загрузка
      await Promise.allSettled(
        filesToUpload.map(async (file) => {
          try {
            const { fileUrl } = await uploadFileToMinio({ file, bucket: 'products' });
            // Добавляем через ref чтобы не затирать параллельные обновления
            onChange([...photosRef.current, fileUrl]);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : `Не удалось загрузить «${file.name}»`
            );
          } finally {
            setUploadingCount((n) => Math.max(0, n - 1));
          }
        })
      );
    },
    [onChange, maxPhotos]
  );

  const showDropZone = photos.length + uploadingCount < maxPhotos;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={photos} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((url, index) => (
            <SortablePhoto
              key={url}
              url={url}
              index={index}
              disabled={disabled}
              onRemove={handleRemove}
            />
          ))}

          {Array.from({ length: uploadingCount }).map((_, i) => (
            <UploadingPlaceholder key={`uploading-${i}`} />
          ))}

          {showDropZone && (
            <DropZone onFiles={handleFiles} disabled={disabled} />
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
