import { REGISTRY, isDisplayField } from "@/modules/form-fields/registry";
import type { FormSchema } from "@/modules/form-builder/types";
import { fillPlaceholders, pageSizeMm, type PdfLayout } from "./layout";

type Props = {
  schema: FormSchema;
  title: string;
  layout: PdfLayout;
};

export function PdfRenderer({ schema, title, layout }: Props) {
  const { w, h } = pageSizeMm(layout);
  const dateStr = new Date().toLocaleDateString();
  const pages = schema.pages;
  const totalPages = (layout.cover.enabled ? 1 : 0) + pages.length;

  const cssVars: React.CSSProperties = {
    ["--pdf-w" as string]: `${w}mm`,
    ["--pdf-h" as string]: `${h}mm`,
    ["--pdf-mt" as string]: `${layout.margins.top}mm`,
    ["--pdf-mr" as string]: `${layout.margins.right}mm`,
    ["--pdf-mb" as string]: `${layout.margins.bottom}mm`,
    ["--pdf-ml" as string]: `${layout.margins.left}mm`,
    ["--pdf-fg" as string]: layout.themeColors.fg,
    ["--pdf-bg" as string]: layout.themeColors.bg,
    ["--pdf-primary" as string]: layout.themeColors.primary,
    ["--pdf-accent" as string]: layout.themeColors.accent,
    fontSize: `${layout.fontScale * 14}px`,
  };

  let pageIndex = 0;

  return (
    <div className="pdf-doc" style={cssVars}>
      {layout.cover.enabled && (
        <div className="pdf-page pdf-cover" data-page={++pageIndex}>
          <div
            className="pdf-cover-hero"
            style={{
              background: `linear-gradient(135deg, ${layout.themeColors.primary} 0%, ${layout.themeColors.accent} 100%)`,
            }}
          />
          <div className="pdf-cover-body">
            <h1 className="pdf-cover-title">{title}</h1>
            {layout.cover.subtitle && <p className="pdf-cover-subtitle">{layout.cover.subtitle}</p>}
            <div className="pdf-cover-meta">
              {layout.cover.author && <span>{layout.cover.author}</span>}
              {layout.cover.showDate && <span>{dateStr}</span>}
            </div>
          </div>
        </div>
      )}
      {pages.map((page) => {
        const idx = ++pageIndex;
        const ctx = { page: idx, total: totalPages, title, date: dateStr };
        return (
          <div key={page.id} className="pdf-page" data-page={idx}>
            {layout.header.enabled && (
              <div className="pdf-header">{fillPlaceholders(layout.header.text, ctx)}</div>
            )}
            <div className="pdf-content">
              <h2 className="pdf-page-title">{page.title}</h2>
              {page.description && <p className="pdf-page-desc">{page.description}</p>}
              <div className="pdf-fields">
                {page.fields.filter((f) => !f.hidden).map((f) => {
                  const def = REGISTRY[f.type];
                  return (
                    <div key={f.id} className="pdf-field">
                      {!isDisplayField(f.type) && (
                        <label className="pdf-field-label">
                          {f.label}
                          {f.required && <span className="pdf-required">*</span>}
                        </label>
                      )}
                      {f.description && <p className="pdf-field-desc">{f.description}</p>}
                      <div className="pdf-field-control">
                        {def.render(f, f.defaultValue, () => {})}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {(layout.footer.enabled || layout.footer.showPageNumbers) && (
              <div className="pdf-footer">
                <span>{layout.footer.enabled ? fillPlaceholders(layout.footer.text, ctx) : ""}</span>
                {layout.footer.showPageNumbers && (
                  <span className="pdf-page-num">{idx} / {totalPages}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}