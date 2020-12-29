import React from 'react';
import PropTypes from 'prop-types';
import { withFormik, Form } from 'formik';
import * as Yup from 'yup';
import { Button, InputGroup, Intent, Text, H5 } from '@blueprintjs/core';
import { FormText } from 'reactstrap';
import { getFormPropTypes } from 'utils/types';

const AnnotationWindow = ({
    formHeading,
    minValue,
    maxValue,
    initialTitle,
    initialStart,
    initialEnd,
    touched,
    errors,
    handleChange,
    handleSubmit,
    updateAnnotations,
    isStartedCreate,
}) => {
    const isDisabled = !isStartedCreate;

    return (
        <Form
            onSubmit={handleSubmit}
            style={{ width: 200 }}
            onChange={e => updateAnnotations(e.target)}
        >
            <H5>{formHeading}</H5>
            {isDisabled && (
                <FormText color="primary">
                    Select a window on one of the graph areas
                </FormText>
            )}
            <div className="my-3">
                <Text className="mb-0">Window title</Text>
                <InputGroup
                    placeholder="Enter your title..."
                    type="text"
                    id="title"
                    name="title"
                    value={initialTitle || ''}
                    onChange={handleChange}
                    disabled={isDisabled}
                />
                <p className="bp3-text-small">Maximum 20 characters</p>
                {touched.title && errors.title ? (
                    <FormText color="danger">{errors.title}</FormText>
                ) : null}
            </div>
            <div className="d-flex flex-row justify-content-between my-3">
                <div className="d-flex flex-column">
                    <Text className="mb-0">Start</Text>
                    <InputGroup
                        className="bp3-control-group bp3-numeric-input"
                        type="number"
                        id="start"
                        name="start"
                        value={initialStart || 0}
                        onChange={handleChange}
                        step={0.001}
                        min={minValue}
                        max={maxValue}
                        disabled={isDisabled}
                    />
                    {errors.start ? (
                        <FormText color="danger">{errors.start}</FormText>
                    ) : null}
                </div>
                <div className="d-flex flex-column">
                    <Text className="mb-0">End</Text>
                    <InputGroup
                        className="bp3-control-group bp3-numeric-input"
                        type="number"
                        id="end"
                        name="end"
                        value={initialEnd || 0}
                        onChange={handleChange}
                        step={0.001}
                        min={minValue}
                        max={maxValue}
                        disabled={isDisabled}
                    />
                    {errors.end ? (
                        <FormText color="danger">{errors.end}</FormText>
                    ) : null}
                </div>
            </div>
            <div className="d-flex flex-row justify-content-between my-3">
                <Button
                    type="submit"
                    icon="confirm"
                    text="Save"
                    intent={Intent.SUCCESS}
                    style={{ width: 100 }}
                    disabled={isDisabled}
                />
            </div>
        </Form>
    );
};

AnnotationWindow.propTypes = {
    ...getFormPropTypes([]),
};

export const AnnotationWindowForm = withFormik({
    mapPropsToValues: props => ({
        title: props.initialTitle,
        start: props.initialStart,
        end: props.initialEnd,
    }),
    validationSchema: props =>
        Yup.object({
            title: Yup.string()
                .max(20, 'Must be 20 characters or less')
                .required('Window title is required'),
            start: Yup.number()
                .min(
                    props.minValue,
                    `Must be more than or equal to ${props.minValue}`,
                )
                .max(
                    props.maxValue,
                    `Must be less than or equal to ${props.maxValue}`,
                )
                .required('Required'),
            end: Yup.number()
                .min(
                    props.minValue,
                    `Must be more than or equal to ${props.minValue}`,
                )
                .max(
                    props.maxValue,
                    `Must be less than or equal to ${props.maxValue}`,
                )
                .required('Required'),
        }),
    handleSubmit: (values, { props }) => {
        if (props.annotationId) {
            props.onSave(props.annotationId, {
                title: props.initialTitle,
                sensor_file: props.sensorFileId,
                start: props.initialStart,
                end: props.initialEnd,
            });
        } else {
            props.onSave({
                title: props.initialTitle,
                sensor_file: props.sensorFileId,
                start: props.initialStart,
                end: props.initialEnd,
            });
        }
        props.onSuccessAction();
    },
    validateOnChange: true,
    validateOnBlur: true,
    displayName: 'AnnotationWindowForm',
})(AnnotationWindow);

AnnotationWindowForm.propTypes = {
    formHeading: PropTypes.string.isRequired,
    annotationId: PropTypes.number,
    initialTitle: PropTypes.string.isRequired,
    initialStart: PropTypes.number,
    initialEnd: PropTypes.number,
    minValue: PropTypes.number.isRequired,
    maxValue: PropTypes.number.isRequired,
    onSave: PropTypes.func.isRequired,
    sensorFileId: PropTypes.number.isRequired,
    onSuccessAction: PropTypes.func.isRequired,
    updateAnnotations: PropTypes.func.isRequired,
    isStartedCreate: PropTypes.bool.isRequired,
};

AnnotationWindowForm.defaultProps = {
    annotationId: null,
    initialStart: 0,
    initialEnd: 0,
};
