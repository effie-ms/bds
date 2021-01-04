import React from 'react';
import PropTypes from 'prop-types';
import { withFormik, Form } from 'formik';
import { Button, InputGroup, Intent, Text } from '@blueprintjs/core';
import { FormText } from 'reactstrap';
import { getFormPropTypes } from 'utils/types';

const AnnotationWindow = ({
    updateAnnotations,
    onCancel,
    minValue,
    maxValue,
    title,
    start,
    end,
    touched,
    errors,
    handleChange,
    handleSubmit,
}) => (
    <Form
        onSubmit={handleSubmit}
        onChange={e => updateAnnotations(e.target)}
        className="d-flex flex-column my-3 w-100"
    >
        <div className="d-flex flex-row flex-wrap justify-content-center w-100">
            <div className="d-flex flex-column mx-3">
                <Text className="mb-0">Window title</Text>
                <InputGroup
                    placeholder="Enter your title..."
                    type="text"
                    id="title"
                    name="title"
                    value={title}
                    onChange={handleChange}
                    style={{ width: 225 }}
                />
                <p className="bp3-text-small mb-1">Maximum 20 characters</p>
                {touched.title && errors.title ? (
                    <FormText color="danger">{errors.title}</FormText>
                ) : null}
            </div>
            <div className="d-flex flex-column mx-1">
                <Text className="mb-0">Start</Text>
                <InputGroup
                    className="bp3-control-group bp3-numeric-input"
                    type="number"
                    id="start"
                    name="start"
                    value={start || 0}
                    onChange={handleChange}
                    step={0.001}
                    min={minValue}
                    max={maxValue}
                />
                {errors.start ? (
                    <FormText color="danger">{errors.start}</FormText>
                ) : null}
            </div>
            <div className="d-flex flex-column mx-1">
                <Text className="mb-0">End</Text>
                <InputGroup
                    className="bp3-control-group bp3-numeric-input"
                    type="number"
                    id="end"
                    name="end"
                    value={end || 0}
                    onChange={handleChange}
                    step={0.001}
                    min={minValue}
                    max={maxValue}
                />
                {errors.end ? (
                    <FormText color="danger">{errors.end}</FormText>
                ) : null}
            </div>
        </div>
        <div className="d-flex flex-row justify-content-center mt-3">
            <Button
                type="submit"
                icon="confirm"
                text="Save"
                intent={Intent.SUCCESS}
                style={{ width: 100 }}
                className="mx-1"
            />
            <Button
                intent={Intent.DANGER}
                onClick={onCancel}
                text="Cancel"
                icon="trash"
                style={{ width: 100 }}
                className="mx-1"
            />
        </div>
    </Form>
);

AnnotationWindow.propTypes = {
    ...getFormPropTypes([]),
};

export const AnnotationWindowForm = withFormik({
    mapPropsToValues: props => ({
        title: props.title,
        start: props.start,
        end: props.end,
    }),
    validate: (values, props) => {
        const errors = {};

        if (props.title.length === 0) {
            errors.title = 'Required.';
        } else if (props.title.length > 20) {
            errors.title = 'Must be 20 characters or less';
        }

        if (Number.isNaN(props.start)) {
            errors.start = `Must be a number.`;
        } else if (props.start < props.minValue) {
            errors.start = `Must be larger or equal to ${props.minValue}. `;
        } else if (props.start > props.maxValue) {
            errors.start = `Must be less or equal to ${props.maxValue}. `;
        } else if (props.start >= props.end) {
            errors.start = `Start must be less than the end.`;
        }

        if (Number.isNaN(props.end)) {
            errors.end = `Must be a number.`;
        } else if (props.end < props.minValue) {
            errors.end = `Must be larger or equal to ${props.minValue}. `;
        } else if (props.end > props.maxValue) {
            errors.end = `Must be less or equal to ${props.maxValue}. `;
        }

        return errors;
    },
    handleSubmit: (values, { props }) => {
        if (props.annotationId) {
            props.onSave(props.annotationId, {
                title: props.title,
                sensor_file: props.sensorFileId,
                start: props.start,
                end: props.end,
            });
        } else {
            props.onSave({
                title: props.title,
                sensor_file: props.sensorFileId,
                start: props.start,
                end: props.end,
            });
        }
        props.onCancel(); // same as on close
    },
    validateOnChange: true,
    validateOnBlur: true,
    displayName: 'AnnotationWindowForm',
})(AnnotationWindow);

AnnotationWindowForm.propTypes = {
    annotationId: PropTypes.number,
    title: PropTypes.string.isRequired,
    start: PropTypes.number,
    end: PropTypes.number,
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    onSave: PropTypes.func.isRequired,
    sensorFileId: PropTypes.number.isRequired,
    onCancel: PropTypes.func.isRequired,
    updateAnnotations: PropTypes.func.isRequired,
};

AnnotationWindowForm.defaultProps = {
    annotationId: null,
    start: null,
    end: null,
    minValue: null,
    maxValue: null,
};
