import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
} from 'reactstrap';

import { getSensorTitle } from 'utils/sensorData';

export const SensorTypesDropdown = ({ graph, setGraph }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(prevState => !prevState);

    return (
        <Dropdown
            isOpen={dropdownOpen}
            size="sm"
            toggle={toggle}
            className="d-flex justify-content-end mt-5"
        >
            <DropdownToggle
                caret
                style={{
                    background: 'white',
                    color: 'black',
                }}
            >
                {getSensorTitle(graph)}
            </DropdownToggle>
            <DropdownMenu>
                <DropdownItem onClick={() => setGraph('RG')}>
                    {getSensorTitle('RG')}
                </DropdownItem>
                <DropdownItem onClick={() => setGraph('M')}>
                    {getSensorTitle('M')}
                </DropdownItem>
                <DropdownItem onClick={() => setGraph('LA')}>
                    {getSensorTitle('LA')}
                </DropdownItem>
                <DropdownItem onClick={() => setGraph('EA')}>
                    {getSensorTitle('EA')}
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

SensorTypesDropdown.propTypes = {
    graph: PropTypes.oneOf(['M', 'LA', 'EA', 'RG']).isRequired,
    setGraph: PropTypes.func.isRequired,
};
