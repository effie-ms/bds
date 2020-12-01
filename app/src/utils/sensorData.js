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

    if (typeId !== 'P') {
        traces.push({
            x: sensorData['Time [s]'],
            y: sensorData['P [hPa]'],
            name: 'Avg pressure',
            yaxis: 'y2',
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'violet' },
        });
    }

    return traces;
};

export const getLayout = typeId => {
    const layoutDict = {
        showlegend: true,
        xaxis: {
            showticklabels: true,
            title: 'Time [s]',
        },
        yaxis: {
            showticklabels: true,
            title: getSensorTitle(typeId),
        },
        legend: {
            orientation: 'h',
            xanchor: 'center',
            y: 1.2,
            x: 0.5,
        },
    };

    if (typeId !== 'P') {
        layoutDict.yaxis2 = {
            title: getSensorTitle('P'),
            overlaying: 'y',
            side: 'right',
        };
    }

    return layoutDict;
};
