import React from 'react';
import PropTypes from 'prop-types';
import { withFormik, Form } from 'formik';
import { Button, InputGroup, Intent, Text } from '@blueprintjs/core';
import { FormText } from 'reactstrap';
import { getFormPropTypes } from 'utils/types';

const TruncationWindow = ({
    updateBoundariesOnGraph,
    minValue,
    maxValue,
    truncationStart,
    truncationEnd,
    errors,
    handleChange,
    handleSubmit,
}) => (
    <Form
        onSubmit={handleSubmit}
        onChange={e => updateBoundariesOnGraph(e.target)}
        className="d-flex flex-column my-3 w-100"
    >
        <div className="d-flex flex-row flex-wrap justify-content-center w-100">
            <div className="d-flex flex-column mx-1">
                <Text className="mb-0">Start</Text>
                <InputGroup
                    className="bp3-control-group bp3-numeric-input"
                    type="number"
                    id="truncationStart"
                    name="truncationStart"
                    value={truncationStart || 0}
                    onChange={handleChange}
                    step={0.001}
                    min={minValue}
                    max={maxValue}
                />
                {errors.truncationStart ? (
                    <FormText color="danger">{errors.truncationStart}</FormText>
                ) : null}
            </div>
            <div className="d-flex flex-column mx-1">
                <Text className="mb-0">End</Text>
                <InputGroup
                    className="bp3-control-group bp3-numeric-input"
                    type="number"
                    id="truncationEnd"
                    name="truncationEnd"
                    value={truncationEnd || 0}
                    onChange={handleChange}
                    step={0.001}
                    min={minValue}
                    max={maxValue}
                />
                {errors.truncationEnd ? (
                    <FormText color="danger">{errors.truncationEnd}</FormText>
                ) : null}
            </div>
        </div>
        <div className="d-flex flex-row justify-content-center mt-3">
            <Button
                type="submit"
                icon="confirm"
                text="Truncate"
                intent={Intent.SUCCESS}
                style={{ width: 100 }}
                className="mx-1"
            />
        </div>
    </Form>
);

TruncationWindow.propTypes = {
    ...getFormPropTypes([]),
};

export const TruncationWindowForm = withFormik({
    mapPropsToValues: props => ({
        truncationStart: props.truncationStart,
        truncationEnd: props.truncationEnd,
    }),
    validate: (values, props) => {
        const errors = {};

        if (Number.isNaN(props.truncationStart)) {
            errors.truncationStart = `Must be a number.`;
        } else if (props.truncationStart < props.minValue) {
            errors.truncationStart = `Must be larger or equal to ${props.minValue}. `;
        } else if (props.truncationStart > props.maxValue) {
            errors.truncationStart = `Must be less or equal to ${props.maxValue}. `;
        } else if (props.truncationStart >= props.truncationEnd) {
            errors.truncationStart = `Start must be less than the end.`;
        }

        if (Number.isNaN(props.truncationEnd)) {
            errors.truncationEnd = `Must be a number.`;
        } else if (props.truncationEnd < props.minValue) {
            errors.truncationEnd = `Must be larger or equal to ${props.minValue}. `;
        } else if (props.truncationEnd > props.maxValue) {
            errors.truncationEnd = `Must be less or equal to ${props.maxValue}. `;
        }

        return errors;
    },
    handleSubmit: (values, { props }) => {
        props.onSave(props.sensorFileId, {
            truncation_start: props.truncationStart,
            truncation_end: props.truncationEnd,
        });
        props.onClose();
    },
    validateOnChange: true,
    validateOnBlur: true,
    displayName: 'TruncationWindowForm',
})(TruncationWindow);

TruncationWindowForm.propTypes = {
    truncationStart: PropTypes.number,
    truncationEnd: PropTypes.number,
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    onSave: PropTypes.func.isRequired,
    sensorFileId: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    updateBoundariesOnGraph: PropTypes.func.isRequired,
};

TruncationWindowForm.defaultProps = {
    truncationStart: null,
    truncationEnd: null,
    minValue: null,
    maxValue: null,
};
