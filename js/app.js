/**
 * Main application script for Video Area Selection Tool
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const videoContainer = document.getElementById('videoContainer');
    const videoElement = document.getElementById('videoElement');
    const coordinatesDiv = document.getElementById('coordinates');
    
    // Mode toggle controls
    const playbackModeButton = document.getElementById('playbackMode');
    const selectionModeButton = document.getElementById('selectionMode');
    
    // Display elements
    const originalPosition = document.getElementById('originalPosition');
    const originalWidth = document.getElementById('originalWidth');
    const originalHeight = document.getElementById('originalHeight');
    const videoResolution = document.getElementById('videoResolution');
    
    // Template system elements
    const templateNameInput = document.getElementById('templateName');
    const templateContentInput = document.getElementById('templateContent');
    const saveTemplateBtn = document.getElementById('saveTemplate');
    const cancelEditBtn = document.getElementById('cancelEditTemplate');
    const templatesListDiv = document.getElementById('templatesList');

    // State variables
    let videoAreaSelector = null;
    let isSelectionMode = false; // Default is playback mode

    // Initialize theme handler
    const themeHandler = new ThemeHandler({
        storageKey: 'video-select-area-theme',
        toggleElement: document.querySelector('.theme-switch input[type="checkbox"]'),
        iconElement: document.getElementById('theme-icon')
    });

    // Initialize template manager
    const templateManager = new TemplateManager({
        storageKey: 'video-select-area-templates',
        templateListContainer: templatesListDiv,
        templateNameInput: templateNameInput,
        templateContentInput: templateContentInput,
        saveButton: saveTemplateBtn,
        cancelButton: cancelEditBtn,
        onTemplateApplied: (output) => {
            // Template output available for further processing if needed
        }
    });

    // Load video when file is selected
    function handleFileSelection(file) {
        if (file && file.type.startsWith('video/')) {
            const videoURL = URL.createObjectURL(file);
            videoElement.src = videoURL;
            
            videoElement.onloadedmetadata = function() {
                // Show video container and coordinates section
                videoContainer.style.display = 'block';
                coordinatesDiv.style.display = 'block';
                
                // Display video resolution
                videoResolution.textContent = `${videoElement.videoWidth} × ${videoElement.videoHeight}`;
                
                // Initialize the video area selector
                if (videoAreaSelector) {
                    videoAreaSelector.destroy();
                }
                
                videoAreaSelector = new VideoAreaSelector({
                    videoElement: videoElement,
                    onChange: updateCoordinates,
                    selectionColor: getComputedStyle(document.documentElement).getPropertyValue('--selection-color') || 'rgba(255, 0, 0, 0.2)',
                    selectionBorder: getComputedStyle(document.documentElement).getPropertyValue('--selection-border') || 'red',
                    enabled: isSelectionMode
                });
            };
            
            // Video loaded, hide drop area
            dropArea.style.display = 'none';
        } else {
            alert('Please select a valid video file.');
        }
    }

    // Event listeners for drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFileSelection(file);
    }
    
    // Click to select file
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileSelection(this.files[0]);
        }
    });

    // Mode toggle functionality
    playbackModeButton.addEventListener('click', function() {
        if (!isSelectionMode) return; // Already in playback mode
        
        // Switch to playback mode
        isSelectionMode = false;
        playbackModeButton.classList.add('active');
        selectionModeButton.classList.remove('active');
        videoElement.controls = true;
        
        // Disable the selection mode in the video area selector
        if (videoAreaSelector) {
            videoAreaSelector.disable();
        }
    });
    
    selectionModeButton.addEventListener('click', function() {
        if (isSelectionMode) return; // Already in selection mode
        
        // Switch to selection mode
        isSelectionMode = true;
        selectionModeButton.classList.add('active');
        playbackModeButton.classList.remove('active');
        videoElement.controls = false; // Hide video controls in selection mode
        
        // Enable the selection mode in the video area selector
        if (videoAreaSelector) {
            videoAreaSelector.enable();
        }
    });

    // Key controls for video navigation (work in both modes)
    document.addEventListener('keydown', function(e) {
        // Skip if the target is an input element or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        if (videoElement.src) {
            if (e.code === 'Space') {
                // Space bar for play/pause
                e.preventDefault();
                if (videoElement.paused) {
                    videoElement.play();
                } else {
                    videoElement.pause();
                }
            } else if (e.code === 'ArrowLeft') {
                // Left arrow for step back
                e.preventDefault();
                videoElement.currentTime = Math.max(0, videoElement.currentTime - (e.shiftKey ? 1 : 0.04));
            } else if (e.code === 'ArrowRight') {
                // Right arrow for step forward
                e.preventDefault();
                videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + (e.shiftKey ? 1 : 0.04));
            } else if (e.code === 'KeyM') {
                // M key to toggle between modes
                e.preventDefault();
                if (isSelectionMode) {
                    playbackModeButton.click();
                } else {
                    selectionModeButton.click();
                }
            }
        }
    });

    // Update coordinates display and template manager
    function updateCoordinates(selectionData) {
        if (!selectionData) return;
        
        // Show coordinates display
        document.getElementById('coordinates').style.display = 'block';
        
        // Update display
        originalPosition.textContent = `(${selectionData.absolute.left}, ${selectionData.absolute.top})`;
        originalWidth.textContent = `${selectionData.absolute.width}`;
        originalHeight.textContent = `${selectionData.absolute.height}`;
        
        // Update template manager with new selection values
        templateManager.updateSelectionValues(selectionData);
    }
});