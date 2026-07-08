import React, { useEffect, useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { InlineCreateModal } from './InlineCreateModal';

export interface EntityOption {
  id: string;
  name: string;
}

interface EntitySelectorProps {
  value: string;
  onChange: (id: string) => void;
  options: EntityOption[];
  placeholder: string;
  label: string;
  disabled?: boolean;
  createLabel: string;
  createTitle: string;
  createLoading: boolean;
  onCreateEntity: (name: string) => Promise<void>;
}

export function EntitySelector({
  value,
  onChange,
  options,
  placeholder,
  label,
  disabled = false,
  createLabel,
  createTitle,
  createLoading,
  onCreateEntity,
}: EntitySelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [initialCreateValue, setInitialCreateValue] = useState('');

  const handleCreateOpen = (name: string) => {
    setInitialCreateValue(name);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (name: string) => {
    await onCreateEntity(name);
    setIsCreateOpen(false);
  };

  useEffect(() => {
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
        isLoading={createLoading}
      />
    </div>
  );
}
