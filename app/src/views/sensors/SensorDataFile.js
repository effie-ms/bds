import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { Helmet } from 'react-helmet';
import loadable from '@loadable/component';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { resolvePath as urlResolve } from 'tg-named-routes';
import { Switch } from '@blueprintjs/core';

import withView from 'decorators/withView';
import { selectSensorFile } from 'schemas/files';
import { selectAnnotations } from 'schemas/annotations';
import { SensorFileShape, AnnotationShape } from 'utils/types';
import { getData, getLayout } from 'utils/sensorData';
import { deleteAnnotation } from 'sagas/annotations/deleteAnnotation';
import { patchAnnotation } from 'sagas/annotations/patchAnnotation';
import { addAnnotation } from 'sagas/annotations/addAnnotation';
import { SensorTypesDropdown } from 'components/sensors/SensorTypesDropdown';
import { Configuration } from 'components/sensors/Configuration';

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

const SensorDataFile = ({
    sensorFile,
    annotations,
    onAddAnnotation,
    onEditAnnotation,
    onRemoveAnnotation,
}) => {
    const sensorData = sensorFile ? setSensorDataObject(sensorFile.data) : null;
    const [graph2, setGraph2] = useState('EA');
    const [graph3, setGraph3] = useState('LA');
    const [quantization, setQuantization] = useState(200);

    const [showAnnotations1, setShowAnnotations1] = useState(true);
    const [showAnnotations2, setShowAnnotations2] = useState(true);
    const [showAnnotations3, setShowAnnotations3] = useState(true);

    const [selectedStart, setSelectedStart] = useState(null);
    const [selectedEnd, setSelectedEnd] = useState(null);
    const [updatedName, setUpdatedName] = useState('-');

    const [openedEditAnnotation, setOpenedEditAnnotation] = useState(null);
    const [openNewAnnotation, setOpenNewAnnotation] = useState(false);

    const graph1Data = sensorData
        ? getData(sensorData, 'P', quantization)
        : null;
    const graph2Data = sensorData
        ? getData(sensorData, graph2, quantization)
        : null;
    const graph3Data = sensorData
        ? getData(sensorData, graph3, quantization)
        : null;

    const minValue = sensorFile ? sensorFile.min_time : 0;
    const maxValue = sensorFile ? sensorFile.max_time : 0;
    const yLabelCoordinate = sensorFile ? sensorFile.max_pressure : 0;

    const onAreaSelect = data => {
        const points = data?.points;
        if (points && points.length > 0) {
            const firstX = points[0].x;
            const lastX = points[points.length - 1].x;
            setSelectedStart(firstX);
            setSelectedEnd(lastX);
        }
    };

    const resetSelection = () => {
        setSelectedStart(null);
        setSelectedEnd(null);
        setUpdatedName('-');
    };

    return (
        <>
            <Helmet>
                <title>Barotrauma Detection System (BDS): Sensor Data</title>
            </Helmet>
            <Container className="my-5">
                <Row>
                    <Col xl={3} className="order-1">
                        <Link
                            to={urlResolve('files:list', {
                                uploadId: sensorFile.upload,
                            })}
                            className="bp3-button btn bp3-icon-arrow-left mr-5 mb-3"
                        >
                            Back
                        </Link>
                        <Configuration
                            quantization={quantization}
                            setQuantization={setQuantization}
                            annotations={annotations}
                            minValue={minValue}
                            maxValue={maxValue}
                            onAddAnnotation={onAddAnnotation}
                            onEditAnnotation={onEditAnnotation}
                            onRemoveAnnotation={onRemoveAnnotation}
                            sensorFileId={sensorFile.id}
                            selectedStart={selectedStart}
                            selectedEnd={selectedEnd}
                            setSelectedStart={setSelectedStart}
                            setSelectedEnd={setSelectedEnd}
                            resetSelection={resetSelection}
                            openNewAnnotation={openNewAnnotation}
                            setOpenNewAnnotation={setOpenNewAnnotation}
                            openedEditAnnotation={openedEditAnnotation}
                            setOpenedEditAnnotation={setOpenedEditAnnotation}
                            updatedName={updatedName}
                            setUpdatedName={setUpdatedName}
                        />
                    </Col>
                    <Col xl={9} className="order-2">
                        <div className="d-flex flex-column w-100">
                            <p className="font-weight-bold my-2 text-center">
                                {sensorFile ? sensorFile.name : 'Loading...'}
                            </p>
                            {sensorData && Plot && (
                                <>
                                    <Switch
                                        checked={showAnnotations1}
                                        onChange={() =>
                                            setShowAnnotations1(
                                                !showAnnotations1,
                                            )
                                        }
                                        label="Show annotations"
                                        className="mb-0"
                                    />
                                    <Plot
                                        data={graph1Data}
                                        className="w-100 my-2"
                                        divId="graph1-P"
                                        layout={getLayout(
                                            'P',
                                            annotations,
                                            yLabelCoordinate,
                                            showAnnotations1,
                                            selectedStart,
                                            selectedEnd,
                                            openedEditAnnotation,
                                            updatedName,
                                        )}
                                        showlegend
                                        config={config}
                                        useResizeHandler
                                        style={{ height: 400 }}
                                        onSelected={data =>
                                            (openedEditAnnotation !== null ||
                                                openNewAnnotation) &&
                                            onAreaSelect(data)
                                        }
                                    />
                                    <div className="d-flex flex-row justify-content-between mt-5">
                                        <Switch
                                            checked={showAnnotations2}
                                            onChange={() =>
                                                setShowAnnotations2(
                                                    !showAnnotations2,
                                                )
                                            }
                                            label="Show annotations"
                                            className="mb-0"
                                        />
                                        <SensorTypesDropdown
                                            graph={graph2}
                                            setGraph={setGraph2}
                                        />
                                    </div>
                                    <Plot
                                        data={graph2Data}
                                        className="w-100 my-2"
                                        divId={`graph2-${graph2}`}
                                        layout={getLayout(
                                            graph2,
                                            annotations,
                                            yLabelCoordinate,
                                            showAnnotations2,
                                            selectedStart,
                                            selectedEnd,
                                            openedEditAnnotation,
                                            updatedName,
                                        )}
                                        showlegend
                                        config={config}
                                        useResizeHandler
                                        style={{ height: 400 }}
                                        onSelected={data =>
                                            (openedEditAnnotation !== null ||
                                                openNewAnnotation) &&
                                            onAreaSelect(data)
                                        }
                                    />
                                    <div className="d-flex flex-row justify-content-between mt-5">
                                        <Switch
                                            checked={showAnnotations3}
                                            onChange={() =>
                                                setShowAnnotations3(
                                                    !showAnnotations3,
                                                )
                                            }
                                            label="Show annotations"
                                            className="mb-0"
                                        />
                                        <SensorTypesDropdown
                                            graph={graph3}
                                            setGraph={setGraph3}
                                        />
                                    </div>
                                    <Plot
                                        data={graph3Data}
                                        className="w-100 my-2"
                                        divId={`graph3-${graph3}`}
                                        layout={getLayout(
                                            graph3,
                                            annotations,
                                            yLabelCoordinate,
                                            showAnnotations3,
                                            selectedStart,
                                            selectedEnd,
                                            openedEditAnnotation,
                                            updatedName,
                                        )}
                                        showlegend
                                        config={config}
                                        useResizeHandler
                                        style={{ height: 400 }}
                                        onSelected={data =>
                                            (openedEditAnnotation !== null ||
                                                openNewAnnotation) &&
                                            onAreaSelect(data)
                                        }
                                    />
                                </>
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

SensorDataFile.propTypes = {
    sensorFile: SensorFileShape,
    annotations: PropTypes.arrayOf(AnnotationShape),
    onAddAnnotation: PropTypes.func.isRequired,
    onEditAnnotation: PropTypes.func.isRequired,
    onRemoveAnnotation: PropTypes.func.isRequired,
};

SensorDataFile.defaultProps = {
    sensorFile: null,
    annotations: [],
};

const mapStateToProps = (state, ownProps) => ({
    sensorFile: selectSensorFile(state, ownProps.match.params.fileId),
    annotations: selectAnnotations(state),
});

const mapDispatchToProps = dispatch => ({
    onAddAnnotation: data => dispatch(addAnnotation(data)),
    onEditAnnotation: (pk, data) => dispatch(patchAnnotation(pk, data)),
    onRemoveAnnotation: pk => dispatch(deleteAnnotation(pk)),
});

const SensorDataFileConnector = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SensorDataFile);

export default withView()(SensorDataFileConnector);
