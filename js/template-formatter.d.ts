/**
 * Utility function to apply templates to selection data
 */

export interface TemplateSelectionData {
  absolute: {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
  };
  relative: {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
  };
}

/**
 * Apply a template to selection data
 * @param template - Template string with placeholders like {left}, {top}, etc.
 * @param selectionData - Data from VideoAreaSelector's onChange callback
 * @returns Formatted output string with placeholders replaced by values
 */
export function applyTemplate(template: string, selectionData: TemplateSelectionData): string;

export default applyTemplate;
