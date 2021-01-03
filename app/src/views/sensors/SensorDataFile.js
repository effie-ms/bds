import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'reactstrap';
import { Helmet } from 'react-helmet';
import loadable from '@loadable/component';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { resolvePath as urlResolve } from 'tg-named-routes';
import { Switch, Spinner, Intent } from '@blueprintjs/core';

import withView from 'decorators/withView';
import {
    selectSensorFile,
    selectSensorFileData,
    selectSensorFilePressureData,
} from 'schemas/files';
import { selectAnnotations } from 'schemas/annotations';
import {
    SensorFileShape,
    AnnotationShape,
    SensorFileDataShape,
} from 'utils/types';
import { setSensorDataObject } from 'utils/sensorData';
import { getDataPlots, getLayoutPlots } from 'utils/plots/plots';
import { getData, getConfig } from 'utils/plots/shared';
import { deleteAnnotation } from 'sagas/annotations/deleteAnnotation';
import { patchAnnotation } from 'sagas/annotations/patchAnnotation';
import { addAnnotation } from 'sagas/annotations/addAnnotation';
import { patchSensorFile } from 'sagas/sensors/patchSensorFile';
import { fetchSensorFileData } from 'sagas/sensors/fetchSensorFileData';
import { fetchSensorFilePressureData } from 'sagas/sensors/fetchSensorFilePressureData';
import { SensorTypesDropdown } from 'components/sensors/SensorTypesDropdown';
import { Configuration } from 'components/sensors/Configuration';

const Plot =
    process.env.BUILD_TARGET === 'client'
        ? loadable(() => import('react-plotly.js'))
        : null;

const SensorDataFile = ({
    sensorFile,
    sensorFileData,
    sensorFilePressureData,
    annotations,
    onAddAnnotation,
    onEditAnnotation,
    onRemoveAnnotation,
    onSaveTruncation,
    onFetchTruncatedSensorData,
    onFetchPressureData,
}) => {
    const [graph2, setGraph2] = useState('EA');
    const [graph3, setGraph3] = useState('LA');

    const [showAnnotations1, setShowAnnotations1] = useState(true);
    const [showAnnotations2, setShowAnnotations2] = useState(true);
    const [showAnnotations3, setShowAnnotations3] = useState(true);

    const [showSpinner, setShowSpinner] = useState(true);

    const truncationStart = sensorFile ? sensorFile.truncation_start : null;
    const truncationEnd = sensorFile ? sensorFile.truncation_end : null;

    const allPressureData = sensorFilePressureData
        ? getData(setSensorDataObject(sensorFilePressureData.data), 'P')
        : null;

    const truncatedSensorData = sensorFileData
        ? setSensorDataObject(sensorFileData.data)
        : null;
    const graph1Data = truncatedSensorData
        ? getDataPlots(truncatedSensorData, 'P', annotations, true)
        : null;
    const graph1DataWithoutMarkers = truncatedSensorData
        ? getDataPlots(truncatedSensorData, 'P', annotations, false)
        : null;

    const graph2Data = truncatedSensorData
        ? getDataPlots(truncatedSensorData, graph2, annotations, false)
        : null;
    const graph3Data = truncatedSensorData
        ? getDataPlots(truncatedSensorData, graph3, annotations, false)
        : null;

    const minValueTruncated = sensorFileData ? sensorFileData.min_time : null;
    const maxValueTruncated = sensorFileData ? sensorFileData.max_time : null;
    const minValueAll = sensorFilePressureData
        ? sensorFilePressureData.min_time
        : null;
    const maxValueAll = sensorFilePressureData
        ? sensorFilePressureData.max_time
        : null;
    const yLabelCoordinateTruncated = sensorFileData
        ? sensorFileData.max_pressure
        : 0;

    useEffect(() => {
        if (sensorFile?.id) {
            onFetchPressureData();
            // onFetchTruncatedSensorData();
        }
    }, [sensorFile?.id]);

    useEffect(() => {
        setShowSpinner(true);
        onFetchTruncatedSensorData();
    }, [sensorFile.updated_at]);

    useEffect(() => {
        setShowSpinner(sensorFileData === null);
    }, [sensorFileData?.updated_at]);

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
                            annotations={annotations}
                            minValueTruncated={minValueTruncated}
                            maxValueTruncated={maxValueTruncated}
                            minValueAll={minValueAll}
                            maxValueAll={maxValueAll}
                            onAddAnnotation={onAddAnnotation}
                            onEditAnnotation={onEditAnnotation}
                            onRemoveAnnotation={onRemoveAnnotation}
                            sensorFileId={sensorFile.id}
                            pressureData={graph1DataWithoutMarkers}
                            yLabelCoordinate={yLabelCoordinateTruncated}
                            allPressureData={allPressureData}
                            truncationStart={truncationStart}
                            truncationEnd={truncationEnd}
                            onSaveTruncation={onSaveTruncation}
                        />
                    </Col>
                    <Col xl={9} className="order-2">
                        <div className="d-flex flex-column w-100">
                            <p className="font-weight-bold my-2 text-center">
                                {sensorFileData
                                    ? sensorFileData.name
                                    : 'Loading...'}
                            </p>
                            {(!sensorFileData || showSpinner) && (
                                <Spinner
                                    intent={Intent.PRIMARY}
                                    size={Spinner.SIZE_STANDARD}
                                />
                            )}
                            {truncatedSensorData && Plot && !showSpinner && (
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
                                        layout={getLayoutPlots(
                                            'P',
                                            annotations,
                                            yLabelCoordinateTruncated,
                                            showAnnotations1,
                                        )}
                                        showlegend
                                        config={getConfig(false)}
                                        useResizeHandler
                                        style={{ height: 400 }}
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
                                        layout={getLayoutPlots(
                                            graph2,
                                            annotations,
                                            yLabelCoordinateTruncated,
                                            showAnnotations2,
                                        )}
                                        showlegend
                                        config={getConfig(false)}
                                        useResizeHandler
                                        style={{ height: 400 }}
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
                                        layout={getLayoutPlots(
                                            graph3,
                                            annotations,
                                            yLabelCoordinateTruncated,
                                            showAnnotations3,
                                        )}
                                        showlegend
                                        config={getConfig(false)}
                                        useResizeHandler
                                        style={{ height: 400 }}
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
    sensorFileData: SensorFileDataShape,
    sensorFilePressureData: SensorFileDataShape,
    annotations: PropTypes.arrayOf(AnnotationShape),
    onAddAnnotation: PropTypes.func.isRequired,
    onEditAnnotation: PropTypes.func.isRequired,
    onRemoveAnnotation: PropTypes.func.isRequired,
    onSaveTruncation: PropTypes.func.isRequired,
    onFetchTruncatedSensorData: PropTypes.func.isRequired,
    onFetchPressureData: PropTypes.func.isRequired,
};

SensorDataFile.defaultProps = {
    sensorFile: null,
    sensorFileData: null,
    sensorFilePressureData: null,
    annotations: [],
};

const mapStateToProps = (state, ownProps) => ({
    sensorFile: selectSensorFile(state, ownProps.match.params.fileId),
    sensorFileData: selectSensorFileData(state, ownProps.match.params.fileId),
    sensorFilePressureData: selectSensorFilePressureData(
        state,
        ownProps.match.params.fileId,
    ),
    annotations: selectAnnotations(state).sort((a, b) =>
        a.title.localeCompare(b.title),
    ),
});

const mapDispatchToProps = dispatch => ({
    onAddAnnotation: data => dispatch(addAnnotation(data)),
    onEditAnnotation: (pk, data) => dispatch(patchAnnotation(pk, data)),
    onRemoveAnnotation: pk => dispatch(deleteAnnotation(pk)),
    onSaveTruncation: (pk, data) => dispatch(patchSensorFile(pk, data)),
    onFetchTruncatedSensorData: () => dispatch(fetchSensorFileData()),
    onFetchPressureData: () => dispatch(fetchSensorFilePressureData()),
});

const SensorDataFileConnector = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SensorDataFile);

export default withView()(SensorDataFileConnector);
