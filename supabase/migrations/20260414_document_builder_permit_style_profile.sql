begin;

update docbuilder.document_style_profiles dsp
set
  title = 'Permit Procedure Corporate PDF',
  description = 'PDF export theme based on the supplied Permit to Work procedure visual system, adapted into a reusable template profile.',
  theme_config = jsonb_build_object(
    'themeName', 'permit-procedure-corporate',
    'sourceReference', 'RTPR-HSE-PRO-0038 Permit To Work',
    'page', jsonb_build_object(
      'size', 'A4',
      'marginTopMm', 18,
      'marginRightMm', 18,
      'marginBottomMm', 18,
      'marginLeftMm', 18
    ),
    'branding', jsonb_build_object(
      'logoAlignment', 'left',
      'headerRule', true,
      'footerRule', true,
      'showDocumentCode', true,
      'showVersion', true,
      'showPageNumbers', true
    ),
    'typography', jsonb_build_object(
      'bodyFontFamily', 'Arial, Helvetica, sans-serif',
      'headingFontFamily', 'Arial, Helvetica, sans-serif',
      'captionFontFamily', 'Arial, Helvetica, sans-serif',
      'bodyFontSizePt', 10,
      'bodyLineHeight', 1.45,
      'heading1SizePt', 14,
      'heading2SizePt', 12,
      'heading3SizePt', 11,
      'coverTitleSizePt', 28,
      'coverSubtitleSizePt', 16,
      'captionSizePt', 8
    ),
    'colours', jsonb_build_object(
      'text', '#000000',
      'muted', '#5D6C7C',
      'heading', '#000000',
      'border', '#000000',
      'primary', '#003776',
      'primaryBright', '#0059D1',
      'redDark', '#CA2320',
      'redBrand', '#AE002F',
      'greenDark', '#015A3C',
      'greenTeal', '#007461',
      'neutralLight', '#B5B8C0',
      'blueWash', '#DDEDFB'
    ),
    'cover', jsonb_build_object(
      'enabled', true,
      'titleWeight', 700,
      'subtitleWeight', 400,
      'topBand', true,
      'bottomMetaPanel', true,
      'documentTypeLabel', true
    ),
    'header', jsonb_build_object(
      'heightMm', 16,
      'fontSizePt', 11,
      'ruleColor', '#000000',
      'ruleWidthPx', 1,
      'titleAlignment', 'left',
      'metaAlignment', 'right'
    ),
    'footer', jsonb_build_object(
      'heightMm', 14,
      'fontSizePt', 7,
      'uppercase', true,
      'ruleColor', '#000000',
      'ruleWidthPx', 1,
      'pageNumberAlignment', 'right'
    ),
    'tables', jsonb_build_object(
      'borderColor', '#000000',
      'borderWidthPx', 1,
      'cellPaddingPx', 8,
      'headerBackground', '#DDEDFB',
      'headerText', '#000000',
      'stripeBackground', '#FFFFFF'
    ),
    'sections', jsonb_build_object(
      'numberedHeadings', true,
      'headingSpacingBeforePx', 16,
      'headingSpacingAfterPx', 8,
      'paragraphSpacingPx', 8
    )
  ),
  updated_at = now()
from docbuilder.document_types dt
where dsp.document_type_id = dt.id
  and dt.slug = 'permit-to-work-procedure'
  and dsp.key = 'hses-default';

commit;
