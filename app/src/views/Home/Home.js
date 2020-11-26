import React, { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
    Container,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
} from 'reactstrap';
import { useDropzone } from 'react-dropzone';
import { getSensorTitle, getData } from 'utils/sensorData';
import withView from 'decorators/withView';

import loadable from '@loadable/component';

const Plot =
    process.env.BUILD_TARGET === 'client'
        ? loadable(() => import('react-plotly.js'))
        : null;

const getColor = props => {
    if (props.isDragAccept) {
        return '#00e676';
    }
    if (props.isDragReject) {
        return '#ff1744';
    }
    if (props.isDragActive) {
        return '#2196f3';
    }
    return '#eeeeee';
};

const styles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderRadius: 2,
    borderColor: `${props => getColor(props)}`,
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
};

const config = {
    responsive: true,
    staticPlot: false,
    displayModeBar: true,
    displaylogo: false,
};

const getLayout = typeId => ({
    showlegend: true,
    xaxis: {
        showticklabels: true,
        title: 'Time [s]',
    },
    yaxis: {
        showticklabels: true,
        title: getSensorTitle(typeId),
    },
});

const Home = () => {
    const [sensorData, setSensorData] = useState(null);
    const [error, setError] = useState('');

    const [graph2, setGraph2] = useState('EA');
    const [dropdownOpen2, setDropdownOpen2] = useState(false);
    const toggle2 = () => setDropdownOpen2(prevState => !prevState);

    const [graph3, setGraph3] = useState('LA');
    const [dropdownOpen3, setDropdownOpen3] = useState(false);
    const toggle3 = () => setDropdownOpen3(prevState => !prevState);

    const onDrop = useCallback(acceptedFiles => {
        setSensorData(null);
        setError(null);
        acceptedFiles.forEach(file => {
            fetch('/api/read-sensor-data/', {
                method: 'POST',
                body: file,
                headers: { 'Content-Type': 'application/json' },
            })
                .then(res => res.json())
                .then(data => setSensorData(data))
                .catch(err => setError(`Error: ${err}`));
        });
    }, []);

    const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: false,
    });

    return (
        <>
            <Helmet>
                <title>
                    Barotrauma Detection System (BDS): Sensor Data Processing
                    Tool
                </title>
                <body className="main" />
            </Helmet>
            <Container>
                <div className="container px-0 mt-5">
                    <div
                        {...getRootProps({ className: 'dropzone' })}
                        style={styles}
                    >
                        <input {...getInputProps()} />
                        <p className="my-5">
                            Drag and drop a sensor data file here, or click to
                            select it
                        </p>
                    </div>
                </div>
                <div className="d-flex flex-column mt-3">
                    {acceptedFiles?.length > 0 && (
                        <>
                            <p className="text-center font-weight-bold my-2">
                                {acceptedFiles[0].path}
                            </p>
                            {!error && !sensorData && (
                                <p className="animate-flicker text-center">
                                    Loading...
                                </p>
                            )}
                            {error && (
                                <p
                                    className="text-center"
                                    style={{ color: 'red' }}
                                >
                                    {error}
                                </p>
                            )}
                        </>
                    )}
                    {sensorData && Plot && (
                        <>
                            <Plot
                                data={getData(sensorData, 'P')}
                                className="w-100 my-2"
                                divId="P"
                                layout={getLayout('P')}
                                showlegend
                                config={config}
                                useResizeHandler
                                style={{ height: 400 }}
                            />
                            <Dropdown
                                isOpen={dropdownOpen2}
                                size="sm"
                                toggle={toggle2}
                                className="d-flex justify-content-end mt-5"
                            >
                                <DropdownToggle
                                    caret
                                    style={{
                                        background: 'white',
                                        color: 'black',
                                    }}
                                >
                                    {getSensorTitle(graph2)}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem
                                        onClick={() => setGraph2('RG')}
                                    >
                                        {getSensorTitle('RG')}
                                    </DropdownItem>
                                    <DropdownItem
                                        onClick={() => setGraph2('M')}
                                    >
                                        {getSensorTitle('M')}
                                    </DropdownItem>
                                    <DropdownItem
                                        onClick={() => setGraph2('LA')}
                                    >
                                        {getSensorTitle('LA')}
                                    </DropdownItem>
                                    <DropdownItem
                                        onClick={() => setGraph2('EA')}
                                    >
                                        {getSensorTitle('EA')}
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            <Plot
                                data={getData(sensorData, graph2)}
                                className="w-100 my-2"
                                divId={graph2}
                                layout={getLayout(graph2)}
                                showlegend
                                config={config}
                                useResizeHandler
                                style={{ height: 400 }}
                            />
                            <Dropdown
                                isOpen={dropdownOpen3}
                                size="sm"
                                toggle={toggle3}
                                className="d-flex justify-content-end mt-5"
                            >
                                <DropdownToggle
                                    caret
                                    style={{
                                        background: 'white',
                                        color: 'black',
                                    }}
                                >
                                    {getSensorTitle(graph3)}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem
                                        onClick={() => setGraph3('RG')}
                                    >
                                        {getSensorTitle('RG')}
                                    </DropdownItem>
                                    <DropdownItem
                                        onClick={() => setGraph3('M')}
                                    >
                                        {getSensorTitle('M')}
                                    </DropdownItem>
                                    <DropdownItem
                                        onClick={() => setGraph3('LA')}
                                    >
                                        {getSensorTitle('LA')}
                                    </DropdownItem>
                                    <DropdownItem
                                        onClick={() => setGraph3('EA')}
                                    >
                                        {getSensorTitle('EA')}
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            <Plot
                                data={getData(sensorData, graph3)}
                                className="w-100 my-2"
                                divId={graph3}
                                layout={getLayout(graph3)}
                                showlegend
                                config={config}
                                useResizeHandler
                                style={{ height: 400 }}
                            />
                        </>
                    )}
                </div>
            </Container>
        </>
    );
};

export default withView()(Home);
