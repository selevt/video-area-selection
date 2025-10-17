export interface VideoAreaSelectorOptions {
  videoElement: HTMLVideoElement;
  onChange?: (selectionData: VideoAreaSelectionData) => void;
  selectionColor?: string;
  selectionBorder?: string;
  enabled?: boolean;
}

export interface VideoAreaSelectionCoordinates {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface VideoAreaSelectionData {
  absolute: VideoAreaSelectionCoordinates;
  relative: VideoAreaSelectionCoordinates;
  video: {
    width: number;
    height: number;
  };
}

export interface VideoAreaSelection {
  left: number;
  top: number;
  width: number;
  height: number;
}

export declare class VideoAreaSelector {
  constructor(options: VideoAreaSelectorOptions);
  
  enable(): VideoAreaSelector;
  disable(): VideoAreaSelector;
  getSelection(): VideoAreaSelectionData | null;
  setSelection(selection: VideoAreaSelection): VideoAreaSelector;
  clearSelection(): VideoAreaSelector;
  destroy(): void;
  
  /**
   * Returns a promise that resolves when the video dimensions are available
   * @returns A promise that resolves with {width, height} when dimensions are available
   */
  ready(): Promise<{width: number, height: number}>;
}

export default VideoAreaSelector;