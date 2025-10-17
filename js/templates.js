/**
 * TemplateManager - Manages templates for formatting selection coordinates
 */
export class TemplateManager {
    /**
     * Create a new template manager
     * @param {Object} options - Configuration options
     * @param {String} options.storageKey - localStorage key to store templates
     * @param {HTMLElement} options.templateListContainer - Element to display templates
     * @param {HTMLElement} options.templateNameInput - Input field for template name
     * @param {HTMLElement} options.templateContentInput - Input field for template content
     * @param {HTMLElement} options.saveButton - Button to save templates
     * @param {HTMLElement} options.cancelButton - Button to cancel editing
     * @param {Function} options.onTemplateApplied - Callback when a template is applied
     */
    constructor(options = {}) {
        // Default options
        this.options = {
            storageKey: 'video-select-area-templates',
            templateListContainer: null,
            templateNameInput: null,
            templateContentInput: null,
            saveButton: null,
            cancelButton: null,
            onTemplateApplied: null,
            ...options
        };
        
        // Initialize storage
        this.templates = [];
        this.urlTemplate = null;
        this.currentSelectionValues = {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            right: 0,
            bottom: 0,
            leftRel: 0,
            topRel: 0,
            widthRel: 0,
            heightRel: 0,
            rightRel: 0,
            bottomRel: 0
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize template manager
     * @private
     */
    init() {
        // Load saved templates
        this.loadTemplates();
        
        // Set up event listeners if DOM elements are provided
        if (this.options.saveButton) {
            this.options.saveButton.addEventListener('click', this.handleSaveTemplate.bind(this));
        }
        
        if (this.options.cancelButton) {
            this.options.cancelButton.addEventListener('click', this.handleCancelEdit.bind(this));
        }
    }
    
    /**
     * Load templates from localStorage
     */
    loadTemplates() {
        // Check for URL params
        const params = this.getUrlParams();
        if (params.template) {
            this.urlTemplate = {
                name: params.templateName || 'URL Template',
                content: params.template
            };
        }
        
        // Load from localStorage
        const savedTemplates = localStorage.getItem(this.options.storageKey);
        if (savedTemplates) {
            this.templates = JSON.parse(savedTemplates);
        }
        
        // Render templates if container is provided
        if (this.options.templateListContainer) {
            this.renderTemplates();
        }
    }
    
    /**
     * Save templates to localStorage
     */
    saveTemplates() {
        localStorage.setItem(this.options.storageKey, JSON.stringify(this.templates));
    }
    
    /**
     * Render templates in the container
     */
    renderTemplates() {
        const templatesListDiv = this.options.templateListContainer;
        if (!templatesListDiv) return;
        
        // Clear existing templates
        while (templatesListDiv.firstChild) {
            templatesListDiv.removeChild(templatesListDiv.firstChild);
        }

        // Show URL template if present
        if (this.urlTemplate) {
            const templateOutput = this.applyTemplate(this.urlTemplate.content);
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.style.border = '2px solid var(--primary-color)';
            templateItem.style.background = 'var(--light-bg)';

            // Header
            const templateHeader = document.createElement('div');
            templateHeader.className = 'template-header';
            const templateName = document.createElement('span');
            templateName.className = 'template-name';
            templateName.textContent = this.urlTemplate.name + ' (from URL)';
            templateHeader.appendChild(templateName);
            templateItem.appendChild(templateHeader);

            // Output row
            const templateOutputRow = document.createElement('div');
            templateOutputRow.className = 'template-output-row';
            const outputDiv = document.createElement('div');
            outputDiv.className = 'template-output';
            outputDiv.textContent = templateOutput;
            templateOutputRow.appendChild(outputDiv);
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.setAttribute('data-output', encodeURIComponent(templateOutput));
            copyButton.textContent = 'Copy';
            templateOutputRow.appendChild(copyButton);
            templateItem.appendChild(templateOutputRow);

            templatesListDiv.appendChild(templateItem);
        }

        if (this.templates.length === 0 && !this.urlTemplate) {
            const noTemplatesMsg = document.createElement('p');
            noTemplatesMsg.textContent = 'No templates yet. Create one below!';
            templatesListDiv.appendChild(noTemplatesMsg);
            return;
        }

        this.templates.forEach((template, index) => {
            const templateOutput = this.applyTemplate(template.content);

            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';

            // Create header
            const templateHeader = document.createElement('div');
            templateHeader.className = 'template-header';

            // Create name span
            const templateName = document.createElement('span');
            templateName.className = 'template-name';
            templateName.textContent = template.name;
            templateHeader.appendChild(templateName);

            // Create actions container
            const templateActions = document.createElement('div');
            templateActions.className = 'template-actions';

            // Create edit button
            const editButton = document.createElement('button');
            editButton.className = 'template-edit';
            editButton.setAttribute('data-index', index);
            editButton.textContent = 'Edit';
            templateActions.appendChild(editButton);

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'template-delete';
            deleteButton.setAttribute('data-index', index);
            deleteButton.textContent = 'Delete';
            templateActions.appendChild(deleteButton);

            templateHeader.appendChild(templateActions);
            templateItem.appendChild(templateHeader);

            // Create output row
            const templateOutputRow = document.createElement('div');
            templateOutputRow.className = 'template-output-row';

            // Create output div
            const outputDiv = document.createElement('div');
            outputDiv.className = 'template-output';
            outputDiv.textContent = templateOutput;
            templateOutputRow.appendChild(outputDiv);

            // Create copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.setAttribute('data-output', encodeURIComponent(templateOutput));
            copyButton.textContent = 'Copy';
            templateOutputRow.appendChild(copyButton);

            templateItem.appendChild(templateOutputRow);
            templatesListDiv.appendChild(templateItem);
        });

        // Add event listeners for buttons
        this._addEventListeners();
    }
    
    /**
     * Add event listeners to template list items
     * @private
     */
    _addEventListeners() {
        // Add event listeners for delete buttons
        document.querySelectorAll('.template-delete').forEach(button => {
            button.addEventListener('click', this._handleDeleteClick.bind(this));
        });

        // Add event listeners for edit buttons
        document.querySelectorAll('.template-edit').forEach(button => {
            button.addEventListener('click', this._handleEditClick.bind(this));
        });

        // Add event listeners for copy buttons
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', this._handleCopyClick.bind(this));
        });
    }
    
    /**
     * Handle delete button click
     * @param {Event} event - Click event
     * @private
     */
    _handleDeleteClick(event) {
        const index = parseInt(event.currentTarget.getAttribute('data-index'));
        this.templates.splice(index, 1);
        this.saveTemplates();
        this.renderTemplates();
    }
    
    /**
     * Handle edit button click
     * @param {Event} event - Click event
     * @private
     */
    _handleEditClick(event) {
        if (!this.options.templateNameInput || !this.options.templateContentInput || 
            !this.options.saveButton || !this.options.cancelButton) return;
            
        const index = parseInt(event.currentTarget.getAttribute('data-index'));
        const template = this.templates[index];

        // Populate form with template data
        this.options.templateNameInput.value = template.name;
        this.options.templateContentInput.value = template.content;

        // Change save button to update button
        this.options.saveButton.textContent = 'Update Template';
        this.options.saveButton.dataset.editIndex = index;

        // Show cancel button
        this.options.cancelButton.style.display = 'inline-block';

        // Scroll to the form if available
        this.options.templateNameInput.scrollIntoView({ behavior: 'smooth' });
        this.options.templateNameInput.focus();
    }
    
    /**
     * Handle copy button click
     * @param {Event} event - Click event
     * @private
     */
    _handleCopyClick(event) {
        // Decode the URI component to get back the original string
        const output = decodeURIComponent(event.currentTarget.getAttribute('data-output'));
        this.copyToClipboard(output, event.currentTarget);
        
        // Call callback if provided
        if (typeof this.options.onTemplateApplied === 'function') {
            this.options.onTemplateApplied(output);
        }
    }
    
    /**
     * Handle save template button click
     */
    handleSaveTemplate() {
        if (!this.options.templateNameInput || !this.options.templateContentInput) return;
        
        const name = this.options.templateNameInput.value.trim();
        const content = this.options.templateContentInput.value.trim();
        
        if (!name) {
            alert("Please provide a template name");
            return;
        }
        
        if (!content) {
            alert("Please provide template content");
            return;
        }
        
        // Check if we're editing an existing template
        const editIndex = this.options.saveButton.dataset.editIndex;
        
        if (editIndex !== undefined) {
            // Update existing template
            this.templates[editIndex] = {
                name: name,
                content: content
            };
            // Remove edit index from button
            delete this.options.saveButton.dataset.editIndex;
            // Restore button text
            this.options.saveButton.textContent = 'Save Template';
            // Hide cancel button
            this.options.cancelButton.style.display = 'none';
        } else {
            // Add new template
            this.templates.push({
                name: name,
                content: content
            });
        }
        
        this.saveTemplates();
        this.renderTemplates();
        
        // Clear inputs
        this.options.templateNameInput.value = '';
        this.options.templateContentInput.value = '';
    }
    
    /**
     * Handle cancel edit button click
     */
    handleCancelEdit() {
        if (!this.options.templateNameInput || !this.options.templateContentInput || 
            !this.options.saveButton || !this.options.cancelButton) return;
            
        // Clear form
        this.options.templateNameInput.value = '';
        this.options.templateContentInput.value = '';
        
        // Reset save button
        this.options.saveButton.textContent = 'Save Template';
        delete this.options.saveButton.dataset.editIndex;
        
        // Hide cancel button
        this.options.cancelButton.style.display = 'none';
    }
    
    /**
     * Apply template with current selection values
     * @param {String} templateContent - Template string with placeholders
     * @returns {String} - Formatted output string
     */
    applyTemplate(templateContent) {
        return templateContent
            .replace(/\{left\}/g, this.currentSelectionValues.left)
            .replace(/\{top\}/g, this.currentSelectionValues.top)
            .replace(/\{width\}/g, this.currentSelectionValues.width)
            .replace(/\{height\}/g, this.currentSelectionValues.height)
            .replace(/\{right\}/g, this.currentSelectionValues.right)
            .replace(/\{bottom\}/g, this.currentSelectionValues.bottom)
            .replace(/\{leftRel\}/g, this.currentSelectionValues.leftRel)
            .replace(/\{topRel\}/g, this.currentSelectionValues.topRel)
            .replace(/\{widthRel\}/g, this.currentSelectionValues.widthRel)
            .replace(/\{heightRel\}/g, this.currentSelectionValues.heightRel)
            .replace(/\{rightRel\}/g, this.currentSelectionValues.rightRel)
            .replace(/\{bottomRel\}/g, this.currentSelectionValues.bottomRel);
    }
    
    /**
     * Copy text to clipboard
     * @param {String} text - Text to copy
     * @param {HTMLElement} buttonElement - Button element to show feedback
     */
    copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(
            function() {
                // Success feedback
                const originalText = buttonElement.textContent;
                buttonElement.textContent = "Copied!";
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                }, 1000);
            },
            function() {
                alert("Failed to copy to clipboard");
            }
        );
    }
    
    /**
     * Get URL parameters
     * @returns {Object} - URL parameters as key-value pairs
     * @private
     */
    getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams.entries()) {
            params[key] = value;
        }
        return params;
    }
    
    /**
     * Update the current selection values
     * @param {Object} selectionData - Data from VideoAreaSelector
     */
    updateSelectionValues(selectionData) {
        if (!selectionData || !selectionData.absolute) {
            return;
        }
        
        this.currentSelectionValues = {
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
        
        // Re-render templates with new values
        this.renderTemplates();
    }
    
    /**
     * Add a template programmatically
     * @param {String} name - Template name
     * @param {String} content - Template content
     */
    addTemplate(name, content) {
        this.templates.push({
            name: name,
            content: content
        });
        
        this.saveTemplates();
        this.renderTemplates();
    }
    
    /**
     * Get all templates
     * @returns {Array} - Array of template objects
     */
    getTemplates() {
        return [...this.templates];
    }
}

// Export default for ES modules
export default TemplateManager;