import clsx from 'clsx';

interface TabOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  activeTab: T;
  onChange: (tab: T) => void;
  tabs: TabOption<T>[];
  className?: string;
}

export default function SegmentedTabs<T extends string>({
  activeTab,
  onChange,
  tabs,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div className={clsx('mb-6 flex flex-wrap gap-2', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={clsx(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
