import React, { useState } from 'react';
import { ChevronDown, Laptop } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  title: string;
  previewText?: string;
  devicePreview?: {
    model: string;
    version: string;
  };
  content?: React.ReactNode;
}

export interface AccordionGroupProps {
  items: AccordionItemData[];
  defaultOpenId?: string;
  className?: string;
}

export const AccordionGroup: React.FC<AccordionGroupProps> = ({
  items,
  defaultOpenId = 'devices',
  className = '',
}) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[var(--bg-card-subtle)] transition-colors"
            >
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {item.title}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-4 pt-1 border-t border-[var(--border-subtle)]/50 text-xs text-[var(--text-secondary)] animate-fadeIn">
                {item.devicePreview ? (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] mt-1">
                    <div className="w-9 h-9 rounded-lg bg-[#222222] text-white flex items-center justify-center shrink-0">
                      <Laptop className="w-4 h-4 text-[#F8E7A1]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)] leading-tight">
                        {item.devicePreview.model}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {item.devicePreview.version}
                      </p>
                    </div>
                  </div>
                ) : item.content ? (
                  item.content
                ) : (
                  <p className="text-xs text-[var(--text-muted)] py-1">
                    {item.previewText || 'Confidential organizational records managed under verified access permissions.'}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
