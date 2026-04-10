/**
 * TypeScript declarations for the Document Picture-in-Picture API.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API
 */

interface DocumentPictureInPictureOptions {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
}

interface DocumentPictureInPicture extends EventTarget {
    requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
    readonly window: Window | null;
    onenter: ((this: DocumentPictureInPicture, ev: Event) => any) | null;
}

interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
}

interface HTMLVideoElement {
    requestPictureInPicture(): Promise<PictureInPictureWindow>;
    disablePictureInPicture: boolean;
}

interface Document {
    pictureInPictureEnabled?: boolean;
    exitPictureInPicture(): Promise<void>;
    pictureInPictureElement: Element | null;
}

interface PictureInPictureWindow extends EventTarget {
    readonly width: number;
    readonly height: number;
    onresize: ((this: PictureInPictureWindow, ev: Event) => any) | null;
}
