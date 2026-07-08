import React from 'react';
import { SearchableSelect } from '../ui/SearchableSelect';
import { InlineCreateModal } from '../ui/InlineCreateModal';
import type { EntityOption } from '../ui/EntitySelector';

interface TodayPlanEntitySelectorProps {
  label: string;
  value: string;
  options: EntityOption[];
  placeholder: string;
  disabled?: boolean;
  createLabel: string;
  createTitle: string;
  isLoading: boolean;
  onChange: (id: string) => void;
  onCreate: (name: string) => void;
}

export function TodayPlanEntitySelector({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  createLabel,
  createTitle,
  isLoading,
  onChange,
  onCreate,
}: TodayPlanEntitySelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [initialCreateValue, setInitialCreateValue] = React.useState('');

  const handleCreateOpen = (name: string) => {
    setInitialCreateValue(name);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (name: string) => {
    onCreate(name);
    setIsCreateOpen(false);
  };

  React.useEffect(() => {
    if (!isCreateOpen) {
      setInitialCreateValue('');
    }
  }, [isCreateOpen]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-on-surface">{label}</label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        createLabel={createLabel}
        onCreate={handleCreateOpen}
      />
      <InlineCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={createTitle}
        initialValue={initialCreateValue}
        onSubmit={handleCreateSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
