import type { BlockEditorProps, RecentArticlesBlockData } from '../../lib/page-blocks';
import BlockChrome from './BlockChrome';

export default function RecentArticlesBlockEditor({
  data,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled = false,
  errors = {},
  idPrefix = 'recent-articles',
}: BlockEditorProps<RecentArticlesBlockData>) {
  return (
    <BlockChrome
      title="Artigos Recentes"
      isFirst={isFirst}
      isLast={isLast}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
      disabled={disabled}
    >
      <div class="admin-field">
        <label htmlFor={`${idPrefix}-heading`}>Título (opcional)</label>
        <input
          id={`${idPrefix}-heading`}
          type="text"
          value={data.heading ?? ''}
          onInput={(event) => {
            const value = (event.target as HTMLInputElement).value;
            onChange({ ...data, heading: value || undefined });
          }}
          disabled={disabled}
        />
      </div>

      <div class="admin-field">
        <label htmlFor={`${idPrefix}-count`}>Quantidade de artigos</label>
        <input
          id={`${idPrefix}-count`}
          type="number"
          min={1}
          max={12}
          step={1}
          value={data.count}
          onInput={(event) => {
            const parsed = Number((event.target as HTMLInputElement).value);
            const count = Number.isFinite(parsed) ? Math.min(12, Math.max(1, Math.round(parsed))) : 3;
            onChange({ ...data, count });
          }}
          disabled={disabled}
          required
        />
        <p class="admin-field__hint">Exibe de 1 a 12 artigos, do mais recente para o mais antigo.</p>
        {errors.count ? <p class="admin-field__error">{errors.count}</p> : null}
      </div>
    </BlockChrome>
  );
}
