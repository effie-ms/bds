import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Container } from 'reactstrap';
import { connect } from 'react-redux';

import withView from 'decorators/withView';
import { selectUploads } from 'schemas/uploads';
import { fetchUploads } from 'sagas/uploads/fetchUploads';
import { createUpload } from 'sagas/uploads/createUploadSaga';
import { UploadShape, RouterLocationShape } from 'utils/types';
import SensorDataUploadForm from 'forms/SensorDataUploadForm';
import { UploadList } from 'components/sensors/UploadList';

const Home = ({ uploads, onFetchUploads, onSave, location }) => (
    <>
        <Helmet>
            <title>Barotrauma Detection System (BDS): Sensor Data Upload</title>
            <body className="main" />
        </Helmet>
        <Container className="my-5">
            <SensorDataUploadForm onSave={onSave} />
            <UploadList
                uploads={uploads}
                fetchUploads={onFetchUploads}
                location={location}
            />
        </Container>
    </>
);

Home.propTypes = {
    uploads: PropTypes.arrayOf(UploadShape).isRequired,
    onSave: PropTypes.func.isRequired,
    onFetchUploads: PropTypes.func.isRequired,
    location: RouterLocationShape.isRequired,
};

const mapDispatchToProps = {
    onSave: createUpload,
    onFetchUploads: fetchUploads,
};

const mapStateToProps = state => ({
    uploads: selectUploads(state),
});

const HomeConnector = connect(
    mapStateToProps,
    mapDispatchToProps,
)(Home);

export default withView()(HomeConnector);
