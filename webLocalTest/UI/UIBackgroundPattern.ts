export function backgroundGridStyle(scale: {x: number, y: number}, lineColor: string) {
    return {
        backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${scale.x}px ${scale.y}px`
    } as Partial<CSSStyleDeclaration>
}

export function backgroundLinesStyle(scale: {x: number, y: number}, lineColor: string) {
    return {
        backgroundImage: `linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${scale.x}px ${scale.y}px`
    } as Partial<CSSStyleDeclaration>
}

export function backgroundDotStyle(scale: {x: number, y: number}, lineColor: string) {
    return {
        backgroundImage: `radial-gradient(circle, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${scale.x}px ${scale.y}px`
    } as Partial<CSSStyleDeclaration>
}