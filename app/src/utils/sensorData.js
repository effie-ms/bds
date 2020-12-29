export const getSensorTitle = typeId => {
    switch (typeId) {
        case 'P': {
            return 'Total pressure [hPa]';
        }
        case 'RG': {
            return 'Rate gyroscope [rad/s]';
        }
        case 'M': {
            return 'Magnetometer [microT]';
        }
        case 'LA': {
            return 'Linear acceleration [m/s2]';
        }
        case 'EA': {
            return 'Euler angle [deg]';
        }
        default: {
            return '';
        }
    }
};

const getSensorDataKeys = typeId => {
    switch (typeId) {
        case 'P': {
            return [
                {
                    yKey: 'PL [hPa]',
                    name: 'Left',
                },
                {
                    yKey: 'PC [hPa]',
                    name: 'Center',
                },
                {
                    yKey: 'PR [hPa]',
                    name: 'Right',
                },
            ];
        }
        case 'RG': {
            return [
                {
                    yKey: 'RX [rad/s]',
                    name: 'Rate Gyro X',
                },
                {
                    yKey: 'RY [rad/s]',
                    name: 'Rate Gyro Y',
                },
                {
                    yKey: 'RZ [rad/s]',
                    name: 'Rate Gyro Z',
                },
            ];
        }
        case 'M': {
            return [
                {
                    yKey: 'MX [microT]',
                    name: 'Magn. Field X',
                },
                {
                    yKey: 'MY [microT]',
                    name: 'Magn. Field Y',
                },
                {
                    yKey: 'MZ [microT]',
                    name: 'Magn. Field Z',
                },
            ];
        }
        case 'LA': {
            return [
                {
                    yKey: 'AX [m/s2]',
                    name: 'Acc X',
                },
                {
                    yKey: 'AY [m/s2]',
                    name: 'Acc Y',
                },
                {
                    yKey: 'AZ [m/s2]',
                    name: 'Acc Z',
                },
            ];
        }
        case 'EA': {
            return [
                {
                    yKey: 'EX [deg]',
                    name: 'Heading',
                },
                {
                    yKey: 'EY [deg]',
                    name: 'Roll',
                },
                {
                    yKey: 'EZ [deg]',
                    name: 'Pitch',
                },
            ];
        }
        default: {
            return [
                {
                    yKey: '',
                    name: '',
                },
                {
                    yKey: '',
                    name: '',
                },
                {
                    yKey: '',
                    name: '',
                },
            ];
        }
    }
};

const getSeverityColour = severity => {
    switch (severity) {
        case 0: {
            return 'green';
        }
        case 1: {
            return 'lime';
        }
        case 2: {
            return 'yellow';
        }
        case 3: {
            return 'orange';
        }
        case 4: {
            return 'green';
        }
        case 5: {
            return 'red';
        }
        default: {
            return 'green';
        }
    }
};

// Source: https://gist.github.com/revolunet/5702041
export function slice(array, _from, _to, _step) {
    let from = _from;
    let to = _to;
    let step = _step;

    if (from === null) from = 0;
    if (to === null) to = array.length;
    if (!step) return array.slice(from, to);

    let result = Array.prototype.slice.call(array, from, to);
    if (step < 0) result.reverse();
    step = Math.abs(step);
    if (step > 1) {
        const final = [];
        for (let i = result.length - 1; i >= 0; i--) {
            if (i % step === 0) {
                final.push(result[i]);
            }
        }
        final.reverse();
        result = final;
    }
    return result;
}

export const getStep = (start, end) => {
    const pointsN = Math.abs(end - start);
    const maxPoints = 500; // 500 points per window max
    return Math.floor(pointsN / maxPoints) + 1;
};

export const getData = (sensorData, typeId, step) => {
    const sensorDataKeys = getSensorDataKeys(typeId);

    const traces = [
        {
            x: slice(
                sensorData['Time [s]'],
                0,
                sensorData['Time [s]'].length,
                step,
            ),
            y: slice(
                sensorData[sensorDataKeys[0].yKey],
                0,
                sensorData['Time [s]'].length,
                step,
            ),
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'red' },
            name: sensorDataKeys[0].name,
        },
        {
            x: slice(
                sensorData['Time [s]'],
                0,
                sensorData['Time [s]'].length,
                step,
            ),
            y: slice(
                sensorData[sensorDataKeys[1].yKey],
                0,
                sensorData['Time [s]'].length,
                step,
            ),
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'blue' },
            name: sensorDataKeys[1].name,
        },
        {
            x: slice(
                sensorData['Time [s]'],
                0,
                sensorData['Time [s]'].length,
                step,
            ),
            y: slice(
                sensorData[sensorDataKeys[2].yKey],
                0,
                sensorData['Time [s]'].length,
                step,
            ),
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'black' },
            name: sensorDataKeys[2].name,
        },
    ];

    // if (typeId !== 'P') {
    traces.push({
        x: slice(
            sensorData['Time [s]'],
            0,
            sensorData['Time [s]'].length,
            step,
        ),
        y: slice(sensorData['P [hPa]'], 0, sensorData['Time [s]'].length, step),
        name: 'Avg pressure',
        yaxis: typeId !== 'P' ? 'y2' : 'y1',
        type: 'scatter',
        mode: 'lines+markers',
        marker: {
            color: sensorData.severity.map(s => getSeverityColour(s)),
            size: 5,
        },
    });
    // }

    return traces;
};

const getAnnotationsGraph = (
    graph,
    annotations,
    yLabelCoordinate,
    editedAnnotationId,
) => {
    let filteredAnnotations;

    if (editedAnnotationId) {
        filteredAnnotations = annotations.filter(
            a => a.id !== editedAnnotationId,
        );
    } else {
        filteredAnnotations = annotations;
    }

    return filteredAnnotations.map(annotation => ({
        x: annotation.start,
        y: yLabelCoordinate,
        xref: 'x',
        yref: graph === 'P' ? 'y' : 'y2',
        text: annotation.title,
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
        bordercolor: '#c7c7c7',
        borderwidth: 2,
        borderpad: 4,
        bgcolor: '#ffffff',
        opacity: 0.8,
    }));
};

const getAnnotationShapesGraph = (graph, annotations, editedAnnotationId) => {
    let filteredAnnotations;

    if (editedAnnotationId) {
        filteredAnnotations = annotations.filter(
            a => a.id !== editedAnnotationId,
        );
    } else {
        filteredAnnotations = annotations;
    }

    return filteredAnnotations.map(annotation => ({
        type: 'rect',
        x0: annotation.start,
        x1: annotation.end,
        y0: 0,
        y1: 1,
        xref: 'x',
        yref: 'paper',
        fillcolor: '#d3d3d3',
        opacity: 0.2,
        layer: 'below',
        line: {
            width: 0,
        },
    }));
};

const getSelectionBox = (selectedStart, selectedEnd) => ({
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
});

const getSelectionAnnotation = (
    selectedStart,
    yLabelCoordinate,
    title,
    graph,
) => ({
    x: selectedStart,
    y: yLabelCoordinate,
    xref: 'x',
    yref: graph === 'P' ? 'y' : 'y2',
    text: title,
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
    bordercolor: '#0047d3',
    borderwidth: 2,
    borderpad: 4,
    bgcolor: '#ffffff',
    opacity: 0.8,
});

export const getLayout = (
    typeId,
    annotations,
    yLabelCoordinate,
    showAnnotations,
    selectedStart,
    selectedEnd,
    openedEditAnnotationId,
    updatedName,
) => {
    const shapes = showAnnotations
        ? getAnnotationShapesGraph(typeId, annotations, openedEditAnnotationId)
        : [];
    const annotationsGraph = showAnnotations
        ? getAnnotationsGraph(
              typeId,
              annotations,
              yLabelCoordinate,
              openedEditAnnotationId,
          )
        : [];

    if (selectedStart && selectedEnd) {
        const selectionBox = getSelectionBox(selectedStart, selectedEnd);
        shapes.push(selectionBox);
        const selectionAnnotation = getSelectionAnnotation(
            selectedStart,
            yLabelCoordinate,
            updatedName,
            typeId,
        );
        annotationsGraph.push(selectionAnnotation);
    }

    const layoutDict = {
        showlegend: true,
        shapes,
        annotations: annotationsGraph,
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
        selectdirection: 'h',
        dragmode: 'select',
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
