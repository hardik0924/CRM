import React from 'react';
import { Download } from 'lucide-react';
import Button from './Button';

/**
 * Standardized page header for CRM listing pages.
 *
 * Props:
 * - title: page title (e.g. "Contacts")
 * - description: subtitle/description text
 * - primaryAction: { label, icon, onClick, disabled? } — rendered as primary button
 * - exportData: { filename, columns, data } — when provided, renders Export button
 * - secondary: ReactNode — additional actions (e.g. bulk delete, filters)
 * - className: extra classes
 */
const PageHeader = ({
  title,
  description,
  primaryAction,
  exportData,
  secondary,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between px-8 py-6 surface border-b border-border shrink-0 z-10 ${className}`}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-sidebar text-2xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-secondary text-sm font-medium mt-0.5">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {exportData && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportData.onExport()}
            className="gap-2 font-medium text-secondary border border-border"
          >
            <Download size={16} className="text-slate-500" /> Export
          </Button>
        )}
        {primaryAction && (
          <Button
            variant="primary"
            size="sm"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="gap-2 font-semibold"
            title={primaryAction.title}
          >
            {primaryAction.icon && React.isValidElement(primaryAction.icon) ? (
              primaryAction.icon
            ) : null}
            {primaryAction.label}
          </Button>
        )}
        {secondary}
      </div>
    </div>
  );
};

export default PageHeader;
