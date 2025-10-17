/**
 * Utility function to apply templates to selection data
 * Allows using template formatting without the full TemplateManager
 */

/**
 * Apply a template to selection data
 * @param {String} template - Template string with placeholders like {left}, {top}, etc.
 * @param {Object} selectionData - Data from VideoAreaSelector's onChange callback
 * @returns {String} - Formatted output string with placeholders replaced by values
 */
export function applyTemplate(template, selectionData) {
    if (!template || !selectionData || !selectionData.absolute) {
        return '';
    }

    // Extract values from the selection data
    const values = {
        left: selectionData.absolute.left,
        top: selectionData.absolute.top,
        width: selectionData.absolute.width,
        height: selectionData.absolute.height,
        right: selectionData.absolute.right,
        bottom: selectionData.absolute.bottom,
        leftRel: selectionData.relative.left,
        topRel: selectionData.relative.top,
        widthRel: selectionData.relative.width,
        heightRel: selectionData.relative.height,
        rightRel: selectionData.relative.right,
        bottomRel: selectionData.relative.bottom
    };

    // Apply the template replacements
    return template
        .replace(/\{left\}/g, values.left)
        .replace(/\{top\}/g, values.top)
        .replace(/\{width\}/g, values.width)
        .replace(/\{height\}/g, values.height)
        .replace(/\{right\}/g, values.right)
        .replace(/\{bottom\}/g, values.bottom)
        .replace(/\{leftRel\}/g, values.leftRel)
        .replace(/\{topRel\}/g, values.topRel)
        .replace(/\{widthRel\}/g, values.widthRel)
        .replace(/\{heightRel\}/g, values.heightRel)
        .replace(/\{rightRel\}/g, values.rightRel)
        .replace(/\{bottomRel\}/g, values.bottomRel);
}

export default applyTemplate;