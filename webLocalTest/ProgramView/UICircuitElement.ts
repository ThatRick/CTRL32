import { SelectableElement } from "./UISelection"

export interface UICircuitElement extends SelectableElement
{
    readonly typeName: string
    readonly isMovable: boolean
}