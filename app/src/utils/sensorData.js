export const setSensorDataObject = data => {
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
};

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

export const getSensorDataKeys = typeId => {
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

export const getColourTruncation = (
    start,
    end,
    minValue,
    maxValue,
    minMaxPointsNumber,
) => {
    const stepSize = Math.abs(maxValue - minValue) / minMaxPointsNumber;
    const pointsN = Math.abs(end - start) / stepSize;
    const maxPoints = 500; // 500 points per window max

    const ratio = pointsN / maxPoints;
    if (ratio <= 1) {
        return 'green';
    } else if (ratio <= 2) {
        return 'yellow';
    } else if (ratio <= 3) {
        return 'orange';
    }
    return 'red';
};

export const getMinSlider = pointsNumber => {
    const maxPointsNumberGraph = 500;
    let minSlider =
        Math.floor(Math.round(pointsNumber / maxPointsNumberGraph) / 10) * 10;
    if (minSlider < 1) {
        minSlider = 1;
    }
    return minSlider;
};
