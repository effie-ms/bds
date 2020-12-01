import React, { useState } from 'react';
import { Container } from 'reactstrap';
import { Helmet } from 'react-helmet';
import loadable from '@loadable/component';
import withView from 'decorators/withView';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { resolvePath as urlResolve } from 'tg-named-routes';

import { getData, getLayout } from 'utils/sensorData';
import { SensorTypesDropdown } from 'components/SensorTypesDropdown';
import { selectSensorFile } from 'schemas/files';
import { SensorFileShape } from 'utils/types';

const Plot =
    process.env.BUILD_TARGET === 'client'
        ? loadable(() => import('react-plotly.js'))
        : null;

const config = {
    responsive: true,
    staticPlot: false,
    displayModeBar: true,
    displaylogo: false,
};

const setSensorDataObject = data => {
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
};

const SensorDataFile = ({ sensorFile }) => {
    const sensorData = sensorFile ? setSensorDataObject(sensorFile.data) : null;
    const [graph2, setGraph2] = useState('EA');
    const [graph3, setGraph3] = useState('LA');

    const graph1Data = sensorData ? getData(sensorData, 'P') : null;
    const graph2Data = sensorData ? getData(sensorData, graph2) : null;
    const graph3Data = sensorData ? getData(sensorData, graph3) : null;

    return (
        <>
            <Helmet>
                <title>Barotrauma Detection System (BDS): Sensor Data</title>
            </Helmet>
            <Container className="my-5">
                <div className="d-flex flex-row">
                    <Link
                        to={urlResolve('files:list', {
                            uploadId: sensorFile.upload,
                        })}
                        className="btn btn-secondary btn-back mr-5"
                    >
                        Back
                    </Link>
                    <div className="d-flex flex-column w-100">
                        <p className="text-center font-weight-bold my-2">
                            {sensorFile ? sensorFile.name : 'Loading...'}
                        </p>
                        {sensorData && Plot && (
                            <>
                                <Plot
                                    data={graph1Data}
                                    className="w-100 my-2"
                                    divId="graph1-P"
                                    layout={getLayout('P')}
                                    showlegend
                                    config={config}
                                    useResizeHandler
                                    style={{ height: 400 }}
                                />
                                <SensorTypesDropdown
                                    graph={graph2}
                                    setGraph={setGraph2}
                                />
                                <Plot
                                    data={graph2Data}
                                    className="w-100 my-2"
                                    divId={`graph2-${graph2}`}
                                    layout={getLayout(graph2)}
                                    showlegend
                                    config={config}
                                    useResizeHandler
                                    style={{ height: 400 }}
                                />
                                <SensorTypesDropdown
                                    graph={graph3}
                                    setGraph={setGraph3}
                                />
                                <Plot
                                    data={graph3Data}
                                    className="w-100 my-2"
                                    divId={`graph3-${graph3}`}
                                    layout={getLayout(graph3)}
                                    showlegend
                                    config={config}
                                    useResizeHandler
                                    style={{ height: 400 }}
                                />
                            </>
                        )}
                    </div>
                </div>
            </Container>
        </>
    );
};

SensorDataFile.propTypes = {
    sensorFile: SensorFileShape,
};

SensorDataFile.defaultProps = {
    sensorFile: null,
};

const mapStateToProps = (state, ownProps) => ({
    sensorFile: selectSensorFile(state, ownProps.match.params.fileId),
});

const SensorDataFileConnector = connect(
    mapStateToProps,
    null,
)(SensorDataFile);

export default withView()(SensorDataFileConnector);
