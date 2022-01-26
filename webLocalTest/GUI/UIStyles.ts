
type CSSStyle = Partial<CSSStyleDeclaration>

const Body: CSSStyle = {
    backgroundColor:    'gray',
    color:              'azure',
    height:             '100vh',
    margin:             '0',
    userSelect:         'none',
    fontFamily:         'monospace',
    boxSizing:          'border-box'
}

const Table: CSSStyle = {
    tableLayout:        'auto',
    fontFamily:         'monospace',
    borderCollapse:     'collapse',
    paddingRight:       '1em'
}

const ContainerVertical: CSSStyle = {
    display:            'flex',
    flexFlow:           'column',
}

const ContainerHorizontal: CSSStyle = {
    display:            'flex',
    flexFlow:           'row',
}


export const Style = {
    Body,
    Table,
    ContainerHorizontal,
    ContainerVertical
}