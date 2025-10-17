/**
 * ThemeHandler - Manages light/dark mode theme for the application
 */
export class ThemeHandler {
    /**
     * Create a new theme handler
     * @param {Object} options - Configuration options
     * @param {String} options.storageKey - localStorage key to store preference
     * @param {HTMLElement} options.toggleElement - The checkbox element for toggling theme
     * @param {HTMLElement} options.iconElement - Optional element to show theme icon
     * @param {Function} options.onChange - Optional callback when theme changes
     */
    constructor(options = {}) {
        // Default options
        this.options = {
            storageKey: 'theme-preference',
            toggleElement: null,
            iconElement: null,
            onChange: null,
            ...options
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize theme handler
     * @private
     */
    init() {
        // Set initial theme
        const currentTheme = this.getColorPreference();
        this.setTheme(currentTheme);
        
        // If toggle element is provided, set up its state and events
        if (this.options.toggleElement) {
            // Set checkbox state based on theme
            if (currentTheme === 'dark') {
                this.options.toggleElement.checked = true;
                if (this.options.iconElement) {
                    this.options.iconElement.textContent = '🌙';
                }
            } else {
                this.options.toggleElement.checked = false;
                if (this.options.iconElement) {
                    this.options.iconElement.textContent = '☀️';
                }
            }
            
            // Add event listener for theme switch
            this.options.toggleElement.addEventListener('change', this.handleToggle.bind(this));
        }
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            // Only change theme if user hasn't set a preference
            if (!localStorage.getItem(this.options.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    /**
     * Get stored color preference
     * @returns {String} - 'dark' or 'light'
     */
    getColorPreference() {
        if (localStorage.getItem(this.options.storageKey)) {
            return localStorage.getItem(this.options.storageKey);
        } else {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    }
    
    /**
     * Set theme
     * @param {String} theme - 'dark' or 'light'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.options.storageKey, theme);
        
        // Update toggle element if it exists
        if (this.options.toggleElement) {
            this.options.toggleElement.checked = theme === 'dark';
            
            if (this.options.iconElement) {
                this.options.iconElement.textContent = theme === 'dark' ? '🌙' : '☀️';
            }
        }
        
        // Call onChange callback if provided
        if (typeof this.options.onChange === 'function') {
            this.options.onChange(theme);
        }
    }
    
    /**
     * Handle toggle change
     * @param {Event} e - The change event
     * @private
     */
    handleToggle(e) {
        const theme = e.target.checked ? 'dark' : 'light';
        this.setTheme(theme);
    }
    
    /**
     * Get the current theme
     * @returns {String} - 'dark' or 'light'
     */
    getCurrentTheme() {
        return this.getColorPreference();
    }
    
    /**
     * Toggle the theme
     * @returns {String} - The new theme ('dark' or 'light')
     */
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }
}

// Export default for ES modules
export default ThemeHandler;