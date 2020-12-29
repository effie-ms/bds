import React, { useState } from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import { getIn, withFormik, Form } from 'formik';
import { connect } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import omit from 'lodash.omit';
import classNames from 'classnames';
import { FormText } from 'reactstrap';
import { Button, Intent } from '@blueprintjs/core';
import { getFormPropTypes } from 'utils/types';

import {
    selectors as fileUploadSelectors,
    setFileUploads,
} from 'ducks/fileUpload';

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

const SensorDataUpload = ({
    errors,
    touched,
    isSubmitting,
    setFieldTouched,
    setFieldValue,
    onSetFileUploads,
    uploads,
}) => {
    const hasFormikErrors = Object.keys(errors).length;
    const hasFilesUploadErrors =
        uploads && Object.values(uploads).find(f => f.error);
    const hasFilesUploadInProgress =
        uploads && Object.values(uploads).find(f => f.progress && !f.success);
    const [folderName, setFolderName] = useState(null);

    const toDisableForm =
        isSubmitting ||
        Boolean(
            !hasFormikErrors &&
                !hasFilesUploadErrors &&
                hasFilesUploadInProgress,
        );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: acceptedFiles => {
            if (acceptedFiles && acceptedFiles.length > 0) {
                const fullPath = acceptedFiles[0].path;
                const folder = fullPath.split('/')[0];
                setFieldValue('name', folder);
                setFieldTouched('name', true);
                setFolderName(folder);
            }
            const newFileUploads = {};
            for (let i = 0; i < acceptedFiles.length; i++) {
                newFileUploads[uuid.v4()] = {
                    file: acceptedFiles[i],
                    progress: 0,
                };
            }
            onSetFileUploads(newFileUploads);
            setFieldTouched('files', true);
        },
        disabled: toDisableForm,
        accept: '.txt',
    });

    const removeFileUpload = id => {
        if (!toDisableForm) {
            onSetFileUploads(omit(uploads, [id]));
        }
    };
    const filesFieldTouched = getIn(touched, 'files', false);
    const filesFieldErrors = getIn(errors, 'files', '');

    return (
        <Form className={classNames({ 'is-disabled': toDisableForm }, 'mt-5')}>
            <h3>Sensor data upload</h3>
            <div className="container px-0">
                <div
                    {...getRootProps({ className: 'dropzone' })}
                    style={styles}
                >
                    <input
                        {...getInputProps()}
                        directory=""
                        webkitdirectory=""
                        type="file"
                    />
                    <p className="my-5">
                        Drag and drop a sensor data folder here, or click to
                        select it
                    </p>
                </div>
                {filesFieldTouched && filesFieldErrors && (
                    <FormText color="danger">{filesFieldErrors}</FormText>
                )}
                {folderName !== null && (
                    <p className="mt-3 font-weight-bold">{folderName}</p>
                )}
                {uploads &&
                    Object.keys(uploads).map((id, index) => (
                        <div
                            key={id}
                            className={classNames('mb-3', {
                                'mt-3': index === 0,
                            })}
                        >
                            <div className="d-flex flex-row justify-content-between w-100">
                                <span>{uploads[id].file.name}</span>
                                {uploads[id].error || !uploads[id].progress ? (
                                    <span // eslint-disable-line jsx-a11y/click-events-have-key-events
                                        role="button"
                                        className="btn-remove-upload"
                                        tabIndex={-1}
                                        onClick={() => {
                                            // removes data from formik values and uploads
                                            removeFileUpload(id);
                                        }}
                                    >
                                        Remove a file
                                    </span>
                                ) : null}
                            </div>
                            {/* showing error from server side */}
                            {uploads[id] && uploads[id].error && (
                                <FormText color="danger">
                                    {uploads[id].error}
                                </FormText>
                            )}
                        </div>
                    ))}
            </div>
            <Button
                type="submit"
                disabled={toDisableForm}
                className="mt-4"
                large
                intent={Intent.SUCCESS}
            >
                Submit
            </Button>
        </Form>
    );
};

SensorDataUpload.propTypes = {
    ...getFormPropTypes([]),
};

const SensorDataUploadForm = withFormik({
    mapPropsToValues: () => ({
        name: '',
        files: '',
    }),
    validate: (values, props) => {
        const errors = {};
        if (Object.keys(props.uploads).length === 0) {
            errors.files = 'At least one data file should be uploaded';
        }
        return errors;
    },
    handleSubmit: (values, { props, ...formik }) => {
        props.onSave({ data: values }, formik);
    },
    validateOnChange: true,
    validateOnBlur: true,
    displayName: 'SensorDataUploadForm',
})(SensorDataUpload);

SensorDataUploadForm.propTypes = {
    onSave: PropTypes.func.isRequired,
    onSetFileUploads: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
    onSetFileUploads: files => dispatch(setFileUploads(files)),
});

const mapStateToProps = state => ({
    uploads: fileUploadSelectors.selectFiles(state),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SensorDataUploadForm);
