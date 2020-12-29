import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Container } from 'reactstrap';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { resolvePath as urlResolve } from 'tg-named-routes';

import withView from 'decorators/withView';
import { SensorFileShape } from 'utils/types';
import { selectSensorFiles } from 'schemas/files';

const SensorDataFileList = ({ sensorFiles }) => {
    const hasSensorFiles = sensorFiles && sensorFiles.length > 0;

    return (
        <>
            <Helmet>
                <title>
                    Barotrauma Detection System (BDS): Sensor Data Files
                </title>
            </Helmet>
            <Container className="my-5">
                <div className="d-flex flex-row">
                    <Link
                        to={urlResolve('landing')}
                        className="btn bp3-button bp3-icon-arrow-left mr-5 mb-3"
                        style={{ height: 38, width: 90 }}
                    >
                        Back
                    </Link>
                    <div className="w-100">
                        <h3>Sensor data files</h3>
                        {hasSensorFiles ? (
                            <div className="mt-3 list-group">
                                {sensorFiles.map(f => (
                                    <Link
                                        key={f.id}
                                        to={urlResolve('files:details', {
                                            fileId: f.id,
                                            uploadId: f.upload,
                                        })}
                                        className="list-group-item-action list-group-item btn-next"
                                    >
                                        {f.name}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted mt-3">
                                No sensor data files found.
                            </p>
                        )}
                    </div>
                </div>
            </Container>
        </>
    );
};

SensorDataFileList.propTypes = {
    sensorFiles: PropTypes.arrayOf(SensorFileShape),
};

SensorDataFileList.defaultProps = {
    sensorFiles: [],
};

const mapStateToProps = state => ({
    sensorFiles: selectSensorFiles(state),
});

const SensorDataFileListConnector = connect(
    mapStateToProps,
    null,
)(SensorDataFileList);

export default withView()(SensorDataFileListConnector);
