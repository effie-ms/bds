import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getSensorTitle } from 'utils/sensorData';

export const SensorTypesDropdown = ({ graph, setGraph }) => {
    const [selectedOption, setSelectedOption] = useState(graph);

    const onSetGraph = key => {
        setSelectedOption(key);
        setGraph(key);
    };

    return (
        <div className="bp3-select">
            <select
                onChange={e => onSetGraph(e.target.value)}
                value={selectedOption}
            >
                <option value="RG">{getSensorTitle('RG')}</option>
                <option value="M">{getSensorTitle('M')}</option>
                <option value="LA">{getSensorTitle('LA')}</option>
                <option value="EA">{getSensorTitle('EA')}</option>
            </select>
        </div>
    );
};

SensorTypesDropdown.propTypes = {
    graph: PropTypes.oneOf(['M', 'LA', 'EA', 'RG']).isRequired,
    setGraph: PropTypes.func.isRequired,
};
