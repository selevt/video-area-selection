/**
 * VideoAreaSelector - A library for selecting rectangular areas in videos
 */
export class VideoAreaSelector {
    /**
     * Create a new video area selector
     * @param {Object} options - Configuration options
     * @param {HTMLVideoElement} options.videoElement - The video element to attach to
     * @param {Function} options.onChange - Callback when selection changes
     * @param {String} options.selectionColor - Color of selection overlay (CSS color)
     * @param {String} options.selectionBorder - Border color of selection (CSS color)
     * @param {Boolean} options.enabled - Whether selection mode is enabled initially
     */
    constructor(options) {
        if (!options.videoElement || !(options.videoElement instanceof HTMLVideoElement)) {
            throw new Error('VideoAreaSelector requires a valid video element');
        }

        // Store options with defaults
        this.options = {
            onChange: () => {},
            selectionColor: 'rgba(255, 0, 0, 0.2)',
            selectionBorder: 'red',
            enabled: false,
            ...options
        };

        // Store references
        this.videoElement = options.videoElement;
        this.originalVideoWidth = 0;
        this.originalVideoHeight = 0;

        // Current selection state
        this.isSelecting = false;
        this.isResizing = false;
        this.activeHandle = null;
        this.startX = 0;
        this.startY = 0;
        this.selectionLeft = 0;
        this.selectionTop = 0;
        this.selectionWidth = 0;
        this.selectionHeight = 0;
        this.lastMoveEvent = null;

        // Create DOM elements
        this._createElements();

        // Attach initial event listeners
        this._attachEventListeners();

        // Store bound event handlers for easy removal
        this._boundDocumentMouseMoveHandler = this._documentMouseMoveHandler.bind(this);
        this._boundDocumentMouseUpHandler = this._documentMouseUpHandler.bind(this);
        this._boundDocumentResizeHandler = this._documentResizeHandler.bind(this);
        this._boundWindowResizeHandler = this._updateSelectionOverlaySize.bind(this);

        // Set video dimensions immediately
        this.originalVideoWidth = this.videoElement.videoWidth;
        this.originalVideoHeight = this.videoElement.videoHeight;
        
        // Add a fallback listener in case dimensions aren't available immediately
        if (this.originalVideoWidth === 0 || this.originalVideoHeight === 0) {
            // For videos that are already loaded but dimensions not yet accessible
            if (this.videoElement.readyState >= 1) {
                setTimeout(() => {
                    this.originalVideoWidth = this.videoElement.videoWidth;
                    this.originalVideoHeight = this.videoElement.videoHeight;
                }, 100);
            }
            
            this.videoElement.addEventListener('loadedmetadata', () => {
                this.originalVideoWidth = this.videoElement.videoWidth;
                this.originalVideoHeight = this.videoElement.videoHeight;
                this._updateSelectionOverlaySize();
            });
        }

        // Initial state
        if (this.options.enabled) {
            this.enable();
        }
    }

    /**
     * Create the necessary DOM elements for selection
     * @private
     */
    _createElements() {
        // Create container to wrap the video
        this.videoWrapper = document.createElement('div');
        this.videoWrapper.className = 'video-wrapper';

        // Setup overlay for selection
        this.selectionOverlay = document.createElement('div');
        this.selectionOverlay.className = 'selection-overlay';
        this.selectionOverlay.id = 'selectionOverlay';
        
        // Setup selection box
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'selection-box';
        this.selectionBox.id = 'selectionBox';

        // Add resize handles
        this.handleNW = document.createElement('div');
        this.handleNE = document.createElement('div');
        this.handleSW = document.createElement('div');
        this.handleSE = document.createElement('div');
        
        this.handleNW.className = 'resize-handle handle-nw';
        this.handleNE.className = 'resize-handle handle-ne';
        this.handleSW.className = 'resize-handle handle-sw';
        this.handleSE.className = 'resize-handle handle-se';
        
        this.handleNW.id = 'handleNW';
        this.handleNE.id = 'handleNE';
        this.handleSW.id = 'handleSW';
        this.handleSE.id = 'handleSE';
        
        this.selectionBox.appendChild(this.handleNW);
        this.selectionBox.appendChild(this.handleNE);
        this.selectionBox.appendChild(this.handleSW);
        this.selectionBox.appendChild(this.handleSE);

        // Insert elements into DOM
        const parent = this.videoElement.parentNode;
        
        // Wrap video in our container
        parent.insertBefore(this.videoWrapper, this.videoElement);
        this.videoWrapper.appendChild(this.videoElement);
        
        // Add overlay and selection box
        this.videoWrapper.appendChild(this.selectionOverlay);
        this.videoWrapper.appendChild(this.selectionBox);
    }

    /**
     * Attach event listeners for selection and resizing
     * @private
     */
    _attachEventListeners() {
        // Selection overlay events
        this.selectionOverlay.addEventListener('mousedown', this._handleSelectionStart.bind(this));
        this.selectionOverlay.addEventListener('mousemove', this._handleSelectionMove.bind(this));
        this.selectionOverlay.addEventListener('mouseup', this._handleSelectionEnd.bind(this));
        this.selectionOverlay.addEventListener('mouseleave', this._handleSelectionLeave.bind(this));

        // Resize handle events
        [this.handleNW, this.handleNE, this.handleSW, this.handleSE].forEach(handle => {
            handle.addEventListener('mousedown', this._handleResizeStart.bind(this));
        });

        // Window resize event
        window.addEventListener('resize', this._boundWindowResizeHandler);

        // Document-level handlers are attached dynamically when needed
    }

    /**
     * Start selection process
     * @param {MouseEvent} e - The mousedown event
     * @private
     */
    _handleSelectionStart(e) {
        e.preventDefault();

        if (!this.videoElement.src || !this.options.enabled) return;

        const rect = this.videoElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Constrain to video boundaries
        if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
            return; // Clicked outside actual video area
        }
        
        // Check if we're clicking inside an existing selection
        const selBoxLeft = parseInt(this.selectionBox.style.left) || 0;
        const selBoxTop = parseInt(this.selectionBox.style.top) || 0;
        const selBoxWidth = parseInt(this.selectionBox.style.width) || 0;
        const selBoxHeight = parseInt(this.selectionBox.style.height) || 0;
        
        const insideExistingSelection = 
            this.selectionBox.style.display === 'block' &&
            mouseX >= selBoxLeft && 
            mouseX <= selBoxLeft + selBoxWidth && 
            mouseY >= selBoxTop && 
            mouseY <= selBoxTop + selBoxHeight;
        
        if (!insideExistingSelection) {
            // Start new selection
            this.isSelecting = true;
            
            // Store initial mouse position
            this.startX = mouseX;
            this.startY = mouseY;
            
            // Start showing the selection box right away with minimal dimensions
            this.selectionBox.style.left = this.startX + 'px';
            this.selectionBox.style.top = this.startY + 'px';
            this.selectionBox.style.width = '1px';
            this.selectionBox.style.height = '1px';
            this.selectionBox.style.display = 'block';
            
            // Track the current values
            this.selectionLeft = this.startX;
            this.selectionTop = this.startY;
            this.selectionWidth = 1;
            this.selectionHeight = 1;
            
            this._updateCoordinates(this.startX, this.startY, 1, 1);
            
            // Add document-level event listeners
            document.addEventListener('mousemove', this._boundDocumentMouseMoveHandler);
        }
    }

    /**
     * Handle selection box movement
     * @param {MouseEvent} e - The mousemove event
     * @private
     */
    _handleSelectionMove(e) {
        if (this.isSelecting && this.videoElement.src && this.options.enabled) {
            e.preventDefault();
            
            const rect = this.videoElement.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            // Constrain to video boundaries
            const videoRect = this.videoElement.getBoundingClientRect();
            const constrainedX = Math.min(Math.max(0, currentX), videoRect.width);
            const constrainedY = Math.min(Math.max(0, currentY), videoRect.height);
            
            // Calculate dimensions and position of selection box
            const width = Math.max(1, Math.abs(constrainedX - this.startX));
            const height = Math.max(1, Math.abs(constrainedY - this.startY));
            const left = Math.min(this.startX, constrainedX);
            const top = Math.min(this.startY, constrainedY);
            
            // Update selection box styling
            this.selectionBox.style.left = left + 'px';
            this.selectionBox.style.top = top + 'px';
            this.selectionBox.style.width = width + 'px';
            this.selectionBox.style.height = height + 'px';
            
            // Store this event for mouseup
            this.lastMoveEvent = {
                clientX: e.clientX,
                clientY: e.clientY
            };
            
            // Store values
            this.selectionLeft = left;
            this.selectionTop = top;
            this.selectionWidth = width;
            this.selectionHeight = height;
            
            this._updateCoordinates(left, top, width, height);
        }
    }

    /**
     * End selection process
     * @param {MouseEvent} e - The mouseup event
     * @private
     */
    _handleSelectionEnd(e) {
        e.preventDefault();
        
        if (this.isSelecting) {
            document.removeEventListener('mousemove', this._boundDocumentMouseMoveHandler);
            
            if (this.lastMoveEvent) {
                const event = new MouseEvent('mousemove', this.lastMoveEvent);
                this.selectionOverlay.dispatchEvent(event);
            }
            
            this.isSelecting = false;
        }
    }

    /**
     * Handle mouse leaving selection overlay
     * @param {MouseEvent} e - The mouseleave event
     * @private
     */
    _handleSelectionLeave(e) {
        if (this.isSelecting) {
            e.preventDefault();
            // We will continue tracking via document events
        }
    }

    /**
     * Start resize operation
     * @param {MouseEvent} e - The mousedown event
     * @private
     */
    _handleResizeStart(e) {
        if (!this.options.enabled) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.isResizing = true;
        this.activeHandle = e.target;
        
        // Store current selection dimensions
        this.selectionLeft = parseInt(this.selectionBox.style.left) || 0;
        this.selectionTop = parseInt(this.selectionBox.style.top) || 0;
        this.selectionWidth = parseInt(this.selectionBox.style.width) || 0;
        this.selectionHeight = parseInt(this.selectionBox.style.height) || 0;
        
        document.addEventListener('mousemove', this._boundDocumentResizeHandler);
    }

    /**
     * Document-level mousemove handler for selection
     * @param {MouseEvent} e - The mousemove event
     * @private
     */
    _documentMouseMoveHandler(e) {
        if (this.isSelecting && this.videoElement.src && this.options.enabled) {
            const rect = this.videoElement.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            // Constrain to video boundaries
            const constrainedX = Math.min(Math.max(0, currentX), rect.width);
            const constrainedY = Math.min(Math.max(0, currentY), rect.height);
            
            // Calculate dimensions and position of selection box
            const width = Math.max(1, Math.abs(constrainedX - this.startX));
            const height = Math.max(1, Math.abs(constrainedY - this.startY));
            const left = Math.min(this.startX, constrainedX);
            const top = Math.min(this.startY, constrainedY);
            
            // Update selection box styling
            this.selectionBox.style.left = left + 'px';
            this.selectionBox.style.top = top + 'px';
            this.selectionBox.style.width = width + 'px';
            this.selectionBox.style.height = height + 'px';
            
            // Store values
            this.selectionLeft = left;
            this.selectionTop = top;
            this.selectionWidth = width;
            this.selectionHeight = height;
            
            // Store this event for mouseup
            this.lastMoveEvent = {
                clientX: e.clientX,
                clientY: e.clientY
            };
            
            this._updateCoordinates(left, top, width, height);
        }
    }

    /**
     * Document-level mousemove handler for resize operations
     * @param {MouseEvent} e - The mousemove event
     * @private
     */
    _documentResizeHandler(e) {
        if (this.isResizing && this.videoElement.src && this.options.enabled) {
            e.preventDefault();
            
            const rect = this.videoElement.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            // Constrain to video boundaries
            const constrainedX = Math.min(Math.max(0, currentX), rect.width);
            const constrainedY = Math.min(Math.max(0, currentY), rect.height);
            
            let newLeft = this.selectionLeft;
            let newTop = this.selectionTop;
            let newWidth = this.selectionWidth;
            let newHeight = this.selectionHeight;
            
            // Handle resizing based on which handle is active
            if (this.activeHandle === this.handleNW) {
                // For NW handle, the bottom-right corner is fixed
                // and we adjust top-left position and dimensions
                newWidth = this.selectionLeft + this.selectionWidth - constrainedX;
                newHeight = this.selectionTop + this.selectionHeight - constrainedY;
                newLeft = constrainedX;
                newTop = constrainedY;
            } else if (this.activeHandle === this.handleNE) {
                // For NE handle, the bottom-left corner is fixed
                // We adjust width and top position
                newWidth = constrainedX - this.selectionLeft;
                newHeight = this.selectionTop + this.selectionHeight - constrainedY;
                newTop = constrainedY;
            } else if (this.activeHandle === this.handleSW) {
                // For SW handle, the top-right corner is fixed
                // We adjust width and left position
                newWidth = this.selectionLeft + this.selectionWidth - constrainedX;
                newHeight = constrainedY - this.selectionTop;
                newLeft = constrainedX;
            } else if (this.activeHandle === this.handleSE) {
                // For SE handle, the top-left corner is fixed
                // We just adjust width and height
                newWidth = constrainedX - this.selectionLeft;
                newHeight = constrainedY - this.selectionTop;
            }
            
            // Ensure minimum size of 1px
            if (newWidth < 1) {
                newWidth = 1;
                if (this.activeHandle === this.handleNW || this.activeHandle === this.handleSW) {
                    newLeft = this.selectionLeft + this.selectionWidth - 1;
                }
            }
            
            if (newHeight < 1) {
                newHeight = 1;
                if (this.activeHandle === this.handleNW || this.activeHandle === this.handleNE) {
                    newTop = this.selectionTop + this.selectionHeight - 1;
                }
            }
            
            // Update selection box styling
            this.selectionBox.style.left = newLeft + 'px';
            this.selectionBox.style.top = newTop + 'px';
            this.selectionBox.style.width = newWidth + 'px';
            this.selectionBox.style.height = newHeight + 'px';
            
            // Store the values
            this.selectionLeft = newLeft;
            this.selectionTop = newTop;
            this.selectionWidth = newWidth;
            this.selectionHeight = newHeight;
            
            this._updateCoordinates(newLeft, newTop, newWidth, newHeight);
        }
    }

    /**
     * Document-level mouseup handler
     * @param {MouseEvent} e - The mouseup event
     * @private
     */
    _documentMouseUpHandler(e) {
        // Handle resizing end
        if (this.isResizing) {
            document.removeEventListener('mousemove', this._boundDocumentResizeHandler);
            this.isResizing = false;
            this.activeHandle = null;
        }
        
        // Handle selection end if mouse released outside overlay
        if (this.isSelecting) {
            this.isSelecting = false;
            
            document.removeEventListener('mousemove', this._boundDocumentMouseMoveHandler);
            
            // Try to process the final position by simulating a mousemove on the overlay
            if (this.lastMoveEvent) {
                const event = new MouseEvent('mousemove', {
                    clientX: this.lastMoveEvent.clientX,
                    clientY: this.lastMoveEvent.clientY
                });
                this.selectionOverlay.dispatchEvent(event);
            }
        }
    }

    /**
     * Update selection overlay size when video or window size changes
     * @private
     */
    _updateSelectionOverlaySize() {
        // Since we're using a layout that automatically sizes the overlay
        // with the video, we don't need to manually set dimensions.
    }

    /**
     * Update coordinates and trigger onChange callback
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @private
     */
    _updateCoordinates(x, y, width, height) {
        // Try to get dimensions if they're still not available
        if ((!this.originalVideoWidth || !this.originalVideoHeight) && this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0) {
            this.originalVideoWidth = this.videoElement.videoWidth;
            this.originalVideoHeight = this.videoElement.videoHeight;
        }
        
        // Convert to original video dimensions
        if (this.videoElement.src && this.originalVideoWidth && this.originalVideoHeight) {
            // Calculate scale factors based on the actual displayed video size
            const videoDisplayWidth = this.videoElement.clientWidth;
            const videoDisplayHeight = this.videoElement.clientHeight;

            // Ensure we're not dividing by zero
            if (videoDisplayWidth > 0 && videoDisplayHeight > 0) {
                const scaleX = this.originalVideoWidth / videoDisplayWidth;
                const scaleY = this.originalVideoHeight / videoDisplayHeight;

                // Constrain selection to video dimensions
                const constrainedX = Math.min(Math.max(0, x), videoDisplayWidth);
                const constrainedY = Math.min(Math.max(0, y), videoDisplayHeight);

                // Constrain selection width/height
                const constrainedWidth = Math.min(width, videoDisplayWidth - constrainedX);
                const constrainedHeight = Math.min(height, videoDisplayHeight - constrainedY);

                // Calculate original coordinates (absolute)
                const originalX = Math.round(constrainedX * scaleX);
                const originalY = Math.round(constrainedY * scaleY);
                const originalW = Math.round(constrainedWidth * scaleX);
                const originalH = Math.round(constrainedHeight * scaleY);
                const originalRight = this.originalVideoWidth - (originalX + originalW);
                const originalBottom = this.originalVideoHeight - (originalY + originalH);

                // Calculate relative coordinates (0..1)
                const leftRel = +(originalX / this.originalVideoWidth).toFixed(6);
                const topRel = +(originalY / this.originalVideoHeight).toFixed(6);
                const widthRel = +(originalW / this.originalVideoWidth).toFixed(6);
                const heightRel = +(originalH / this.originalVideoHeight).toFixed(6);
                const rightRel = +(originalRight / this.originalVideoWidth).toFixed(6);
                const bottomRel = +(originalBottom / this.originalVideoHeight).toFixed(6);

                // Create selection data object
                const selectionData = {
                    absolute: {
                        left: originalX,
                        top: originalY,
                        width: originalW,
                        height: originalH,
                        right: originalRight,
                        bottom: originalBottom
                    },
                    relative: {
                        left: leftRel,
                        top: topRel,
                        width: widthRel,
                        height: heightRel,
                        right: rightRel,
                        bottom: bottomRel
                    },
                    video: {
                        width: this.originalVideoWidth,
                        height: this.originalVideoHeight
                    }
                };

                // Call onChange callback
                if (typeof this.options.onChange === 'function') {
                    this.options.onChange(selectionData);
                }
            }
        }
    }

    /**
     * Enable selection mode
     * @returns {VideoAreaSelector} - Returns this for method chaining
     */
    enable() {
        this.options.enabled = true;
        this.selectionOverlay.style.display = 'block';
        document.addEventListener('mouseup', this._boundDocumentMouseUpHandler);
        this.selectionBox.classList.remove('playback-mode');
        return this;
    }
    
    /**
     * Disable selection mode
     * @returns {VideoAreaSelector} - Returns this for method chaining
     */
    disable() {
        this.options.enabled = false;
        this.selectionOverlay.style.display = 'none';
        
        // Add playback mode class to selection box if it exists
        if (this.selectionBox.style.display === 'block') {
            this.selectionBox.classList.add('playback-mode');
        }
        
        document.removeEventListener('mouseup', this._boundDocumentMouseUpHandler);
        return this;
    }
    
    /**
     * Get the current selection
     * @returns {Object|null} - Selection data with absolute and relative coordinates, or null if no selection
     */
    getSelection() {
        if (this.selectionBox.style.display !== 'block') {
            return null; // No selection exists
        }
        
        // Calculate the selection data
        const x = parseInt(this.selectionBox.style.left) || 0;
        const y = parseInt(this.selectionBox.style.top) || 0;
        const width = parseInt(this.selectionBox.style.width) || 0;
        const height = parseInt(this.selectionBox.style.height) || 0;
        
        // Check if video dimensions are available
        if (!this.originalVideoWidth || !this.originalVideoHeight) {
            this.originalVideoWidth = this.videoElement.videoWidth;
            this.originalVideoHeight = this.videoElement.videoHeight;
        }
        
        // Convert to original video dimensions
        if (this.videoElement.src && this.originalVideoWidth && this.originalVideoHeight) {
            const videoDisplayWidth = this.videoElement.clientWidth;
            const videoDisplayHeight = this.videoElement.clientHeight;

            if (videoDisplayWidth > 0 && videoDisplayHeight > 0) {
                const scaleX = this.originalVideoWidth / videoDisplayWidth;
                const scaleY = this.originalVideoHeight / videoDisplayHeight;

                // Calculate original coordinates (absolute)
                const originalX = Math.round(x * scaleX);
                const originalY = Math.round(y * scaleY);
                const originalW = Math.round(width * scaleX);
                const originalH = Math.round(height * scaleY);
                const originalRight = this.originalVideoWidth - (originalX + originalW);
                const originalBottom = this.originalVideoHeight - (originalY + originalH);

                // Calculate relative coordinates (0..1)
                const leftRel = +(originalX / this.originalVideoWidth).toFixed(6);
                const topRel = +(originalY / this.originalVideoHeight).toFixed(6);
                const widthRel = +(originalW / this.originalVideoWidth).toFixed(6);
                const heightRel = +(originalH / this.originalVideoHeight).toFixed(6);
                const rightRel = +(originalRight / this.originalVideoWidth).toFixed(6);
                const bottomRel = +(originalBottom / this.originalVideoHeight).toFixed(6);

                return {
                    absolute: {
                        left: originalX,
                        top: originalY,
                        width: originalW,
                        height: originalH,
                        right: originalRight,
                        bottom: originalBottom
                    },
                    relative: {
                        left: leftRel,
                        top: topRel,
                        width: widthRel,
                        height: heightRel,
                        right: rightRel,
                        bottom: bottomRel
                    },
                    video: {
                        width: this.originalVideoWidth,
                        height: this.originalVideoHeight
                    }
                };
            }
        }
        
        return null;
    }
    
    /**
     * Set the selection programmatically
     * @param {Object} selection - The selection to set
     * @param {Number} selection.left - Left coordinate in original video dimensions
     * @param {Number} selection.top - Top coordinate in original video dimensions
     * @param {Number} selection.width - Width in original video dimensions
     * @param {Number} selection.height - Height in original video dimensions
     * @returns {VideoAreaSelector} - Returns this for method chaining
     */
    setSelection({left, top, width, height}) {
        if (this.videoElement.src && this.originalVideoWidth && this.originalVideoHeight) {
            // Calculate scale factors based on the actual displayed video size
            const videoDisplayWidth = this.videoElement.clientWidth;
            const videoDisplayHeight = this.videoElement.clientHeight;

            if (videoDisplayWidth > 0 && videoDisplayHeight > 0) {
                const scaleX = videoDisplayWidth / this.originalVideoWidth;
                const scaleY = videoDisplayHeight / this.originalVideoHeight;

                // Convert to display dimensions
                const displayLeft = Math.round(left * scaleX);
                const displayTop = Math.round(top * scaleY);
                const displayWidth = Math.round(width * scaleX);
                const displayHeight = Math.round(height * scaleY);

                // Update selection box
                this.selectionBox.style.left = displayLeft + 'px';
                this.selectionBox.style.top = displayTop + 'px';
                this.selectionBox.style.width = displayWidth + 'px';
                this.selectionBox.style.height = displayHeight + 'px';
                this.selectionBox.style.display = 'block';

                // Store values
                this.selectionLeft = displayLeft;
                this.selectionTop = displayTop;
                this.selectionWidth = displayWidth;
                this.selectionHeight = displayHeight;

                // Update coordinates
                this._updateCoordinates(displayLeft, displayTop, displayWidth, displayHeight);
            }
        }
        
        return this;
    }
    
    /**
     * Clear the current selection
     * @returns {VideoAreaSelector} - Returns this for method chaining
     */
    clearSelection() {
        this.selectionBox.style.display = 'none';
        return this;
    }
    
    /**
     * Destroy the selector and clean up event listeners
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this._boundWindowResizeHandler);
        document.removeEventListener('mousemove', this._boundDocumentMouseMoveHandler);
        document.removeEventListener('mouseup', this._boundDocumentMouseUpHandler);
        document.removeEventListener('mousemove', this._boundDocumentResizeHandler);
        
        // Remove DOM elements
        if (this.videoWrapper.parentNode) {
            // Move the video element back to its original position
            this.videoWrapper.parentNode.insertBefore(this.videoElement, this.videoWrapper);
            this.videoWrapper.parentNode.removeChild(this.videoWrapper);
        }
    }
}

// Default export for easier importing
export default VideoAreaSelector;