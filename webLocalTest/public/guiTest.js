import { GUIWindow } from './GUI/GUIWindow.js';
import { vec2 } from './Vector2.js';
import { htmlElement } from './HTML.js';
export function createTestSet(gui) {
    const size = vec2(200, 100);
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * (window.innerWidth - size.x);
        const y = Math.random() * (window.innerHeight - size.y);
        const element = new GUIWindow(vec2(i * size.x / 2, 100 + i * size.y / 2), size);
        const textArea = htmlElement('textarea', {
            textContent: 'abcdefghijklmnopqrstuvwxyzåäö',
            style: {
                backgroundColor: 'Cornsilk',
                width: '100%', height: '100%'
            },
            parent: element.userContent
        });
        gui.addElement(element);
    }
}
