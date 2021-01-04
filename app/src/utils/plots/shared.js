import { getSensorTitle, getSensorDataKeys } from 'utils/sensorData';

const annotationColours = [
    'steelblue',
    'coral',
    'lightseagreen',
    'mediumpurple',
    'gold',
];

export const getColour = idx => {
    const coloursN = annotationColours.length;
    const floor = Math.floor(idx / coloursN);
    const colourIdx = idx - floor * coloursN;
    return annotationColours[colourIdx];
};

export const getConfig = isUpdated => ({
    responsive: true,
    staticPlot: false,
    displayModeBar: true,
    displaylogo: false,
    edits: {
        shapePosition: isUpdated,
    },
    modeBarButtonsToRemove: ['select2d', 'lasso2d'],
});

export const getSelectionBox = (selectedStart, selectedEnd) => ({
    type: 'rect',
    x0: selectedStart,
    x1: selectedEnd,
    y0: 0,
    y1: 1,
    xref: 'x',
    yref: 'paper',
    fillcolor: '#0047d3',
    opacity: 0.2,
    layer: 'below',
    line: {
        width: 0,
    },
    name: 'selection-box',
});

export const getPlotAnnotationShape = (
    annotationStart,
    annotationEnd,
    colour,
) => ({
    type: 'rect',
    x0: annotationStart,
    x1: annotationEnd,
    y0: 0,
    y1: 1,
    xref: 'x',
    yref: 'paper',
    fillcolor: colour,
    opacity: 0.2,
    layer: 'below',
    line: {
        width: 0,
    },
});

export const getPlotAnnotationLabel = (
    annotationStart,
    annotationTitle,
    labelY,
    colour,
    graph,
) => ({
    x: annotationStart,
    y: labelY,
    xref: 'x',
    yref: graph === 'P' ? 'y' : 'y2',
    text: annotationTitle,
    showarrow: true,
    font: {
        size: 16,
        color: '#000000',
    },
    align: 'center',
    arrowhead: 0,
    arrowsize: 1,
    arrowwidth: 2,
    arrowcolor: '#636363',
    ax: 20,
    ay: -30,
    bordercolor: colour,
    borderwidth: 2,
    borderpad: 4,
    bgcolor: '#ffffff',
    opacity: 0.8,
});

export const getLayout = typeId => {
    const layoutDict = {
        showlegend: true,
        shapes: [],
        annotations: [],
        xaxis: {
            showticklabels: true,
            title: 'Time [s]',
        },
        yaxis: {
            fixedrange: true,
            showticklabels: true,
            title: getSensorTitle(typeId),
        },
        legend: {
            orientation: 'h',
            xanchor: 'center',
            y: 1.2,
            x: 0.5,
        },
        dragmode: false,
        selectdirection: 'h',
    };

    if (typeId !== 'P') {
        layoutDict.yaxis2 = {
            fixedrange: true,
            title: getSensorTitle('P'),
            overlaying: 'y',
            side: 'right',
        };
    }

    return layoutDict;
};

export const getData = (sensorData, typeId) => {
    const sensorDataKeys = getSensorDataKeys(typeId);

    const traces = [
        {
            x: sensorData['Time [s]'],
            y: sensorData[sensorDataKeys[0].yKey],
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'red' },
            name: sensorDataKeys[0].name,
        },
        {
            x: sensorData['Time [s]'],
            y: sensorData[sensorDataKeys[1].yKey],
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'blue' },
            name: sensorDataKeys[1].name,
        },
        {
            x: sensorData['Time [s]'],
            y: sensorData[sensorDataKeys[2].yKey],
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'black' },
            name: sensorDataKeys[2].name,
        },
    ];

    return traces;
};
