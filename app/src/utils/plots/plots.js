import {
    getColour,
    getLayout,
    getData,
    getPlotAnnotationLabel,
    getPlotAnnotationShape,
} from 'utils/plots/shared';

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

const getWindowedPointsTimePressure = (
    timePoints,
    pressurePoints,
    severityPoints,
    annotations,
) => {
    const timeList = [];
    const pressureList = [];
    const severityList = [];
    for (let t = 0; t < timePoints?.length; t++) {
        const timePoint = timePoints[t];
        for (let i = 0; i < annotations.length; i++) {
            const start = Math.min(annotations[i].start, annotations[i].end);
            const end = Math.max(annotations[i].start, annotations[i].end);
            if (timePoint >= start && timePoint <= end) {
                timeList.push(timePoint);
                pressureList.push(pressurePoints[t]);
                severityList.push(severityPoints[t]);
                break;
            }
        }
    }
    return { time: timeList, pressure: pressureList, severity: severityList };
};

export const getDataPlots = (sensorData, typeId, annotations, withMarkers) => {
    const traces = getData(sensorData, typeId);

    traces.push({
        x: sensorData['Time [s]'],
        y: sensorData['P [hPa]'],
        name: 'Avg pressure',
        yaxis: typeId !== 'P' ? 'y2' : 'y1',
        type: 'scatter',
        line: {
            color: 'gray',
        },
        mode: 'lines',
    });

    if (withMarkers) {
        const pointsInWindows = getWindowedPointsTimePressure(
            sensorData['Time [s]'],
            sensorData['P [hPa]'],
            sensorData.severity,
            annotations,
        );

        traces.push({
            x: pointsInWindows.time,
            y: pointsInWindows.pressure,
            name: 'Severity',
            yaxis: 'y1',
            type: 'scatter',
            mode: 'markers',
            marker: {
                color: pointsInWindows.severity.map(s => getSeverityColour(s)),
                size: 5,
            },
        });
    }

    return traces;
};

export const getLayoutPlots = (
    typeId,
    annotations,
    yLabelCoordinate,
    showAnnotations,
) => {
    const layoutDict = getLayout(typeId);

    if (showAnnotations) {
        layoutDict.shapes = annotations.map((annotation, idx) =>
            getPlotAnnotationShape(
                annotation.start,
                annotation.end,
                getColour(idx),
            ),
        );
        layoutDict.annotations = annotations.map((annotation, idx) =>
            getPlotAnnotationLabel(
                annotation.start,
                annotation.title,
                yLabelCoordinate,
                getColour(idx),
                typeId,
            ),
        );
    }

    return layoutDict;
};
