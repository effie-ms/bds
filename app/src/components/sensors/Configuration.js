import React from 'react';
import PropTypes from 'prop-types';
import {
    Slider,
    H4,
    Button,
    Card,
    Elevation,
    Collapse,
} from '@blueprintjs/core';
import { AnnotationShape } from 'utils/types';
import { AnnotationWindowForm } from 'forms/AnnotationWindowForm';

export const Configuration = ({
    quantization,
    setQuantization,
    annotations,
    minValue,
    maxValue,
    onAddAnnotation,
    onEditAnnotation,
    onRemoveAnnotation,
    sensorFileId,
    selectedStart,
    selectedEnd,
    setSelectedStart,
    setSelectedEnd,
    resetSelection,
    openNewAnnotation,
    setOpenNewAnnotation,
    openedEditAnnotation,
    setOpenedEditAnnotation,
    updatedName,
    setUpdatedName,
}) => {
    const onToggleAnnotationUpdate = (
        isNew,
        stateUpdate,
        isClosing,
        annotationId,
    ) => {
        if (isNew) {
            setOpenedEditAnnotation(null);
        } else {
            setOpenNewAnnotation(false);
        }
        stateUpdate();
        if (isClosing) {
            resetSelection();
        } else if (!isNew && annotationId) {
            const annotation = annotations.find(a => a.id === annotationId);
            if (annotation) {
                setUpdatedName(annotation.title);
                setSelectedStart(annotation.start);
                setSelectedEnd(annotation.end);
            }
        }
    };

    const updateAnnotations = target => {
        const name = target?.name;
        const value = target?.value;

        if (name === 'start') {
            const numValue = parseFloat(value);
            setSelectedStart(numValue);
        } else if (name === 'end') {
            const numValue = parseFloat(value);
            setSelectedEnd(numValue);
        } else if (name === 'title') {
            setUpdatedName(value);
        }
    };

    return (
        <>
            <div className="w-100 mb-5">
                <H4>Sampling</H4>
                <Slider
                    min={100}
                    max={1000}
                    stepSize={10}
                    labelStepSize={100}
                    onChange={val => setQuantization(val)}
                    value={quantization}
                />
            </div>
            <div className="my-5">
                <div className="d-flex flex-row justify-content-between mb-3">
                    <H4 className="mb-0" style={{ lineHeight: '40px' }}>
                        Annotations
                    </H4>
                    <Button
                        icon={openNewAnnotation ? 'undo' : 'add'}
                        minimal
                        large
                        onClick={() =>
                            onToggleAnnotationUpdate(
                                true,
                                () => setOpenNewAnnotation(!openNewAnnotation),
                                openNewAnnotation,
                                null,
                            )
                        }
                    />
                </div>
                <Collapse isOpen={openNewAnnotation}>
                    <Card elevation={Elevation.ZERO} className="my-3">
                        <AnnotationWindowForm
                            formHeading="Create a new window annotation"
                            initialTitle={updatedName}
                            initialStart={selectedStart || minValue}
                            initialEnd={selectedEnd || maxValue}
                            minValue={minValue}
                            maxValue={maxValue}
                            onSave={onAddAnnotation}
                            annotationId={null}
                            sensorFileId={sensorFileId}
                            onSuccessAction={() => {
                                setOpenNewAnnotation(false);
                                resetSelection();
                            }}
                            updateAnnotations={updateAnnotations}
                        />
                    </Card>
                </Collapse>
                {annotations && annotations.length > 0 ? (
                    <div className="list-group">
                        {annotations.map(annotation => (
                            <div
                                className="d-flex flex-column"
                                key={`a-${annotation.id}`}
                            >
                                <div className="d-flex flex-row justify-content-between list-group-item w-100">
                                    <div className="align-self-center">
                                        <p
                                            className="mb-0"
                                            style={{ fontSize: 14 }}
                                        >
                                            {annotation.title}
                                        </p>
                                        <p className="mb-0 bp3-text-small">
                                            {`[${annotation.start}; ${annotation.end}]`}
                                        </p>
                                    </div>
                                    <div className="d-flex flex-row">
                                        <Button
                                            icon={
                                                annotation.id ===
                                                openedEditAnnotation
                                                    ? 'undo'
                                                    : 'edit'
                                            }
                                            minimal
                                            onClick={() =>
                                                onToggleAnnotationUpdate(
                                                    false,
                                                    () =>
                                                        setOpenedEditAnnotation(
                                                            annotation.id ===
                                                                openedEditAnnotation
                                                                ? null
                                                                : annotation.id,
                                                        ),
                                                    annotation.id ===
                                                        openedEditAnnotation,
                                                    annotation.id,
                                                )
                                            }
                                        />
                                        <Button
                                            icon="cross"
                                            minimal
                                            onClick={() =>
                                                onRemoveAnnotation(
                                                    annotation.id,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <Collapse
                                    isOpen={
                                        openedEditAnnotation === annotation.id
                                    }
                                >
                                    <div className="m-3">
                                        <AnnotationWindowForm
                                            formHeading="Edit a window annotation"
                                            initialTitle={updatedName}
                                            initialStart={selectedStart}
                                            initialEnd={selectedEnd}
                                            minValue={minValue}
                                            maxValue={maxValue}
                                            onSave={onEditAnnotation}
                                            annotationId={annotation.id}
                                            sensorFileId={sensorFileId}
                                            onSuccessAction={() => {
                                                setOpenedEditAnnotation(null);
                                                resetSelection();
                                            }}
                                            updateAnnotations={
                                                updateAnnotations
                                            }
                                        />
                                    </div>
                                </Collapse>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No annotations found.</p>
                )}
            </div>
        </>
    );
};

Configuration.propTypes = {
    quantization: PropTypes.number.isRequired,
    setQuantization: PropTypes.func.isRequired,
    annotations: PropTypes.arrayOf(AnnotationShape),
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    onAddAnnotation: PropTypes.func.isRequired,
    onEditAnnotation: PropTypes.func.isRequired,
    onRemoveAnnotation: PropTypes.func.isRequired,
    sensorFileId: PropTypes.number.isRequired,
    selectedStart: PropTypes.number,
    selectedEnd: PropTypes.number,
    resetSelection: PropTypes.func.isRequired,
    openNewAnnotation: PropTypes.bool.isRequired,
    setOpenNewAnnotation: PropTypes.func.isRequired,
    openedEditAnnotation: PropTypes.number,
    setOpenedEditAnnotation: PropTypes.func.isRequired,
    setSelectedStart: PropTypes.func.isRequired,
    setSelectedEnd: PropTypes.func.isRequired,
    updatedName: PropTypes.string.isRequired,
    setUpdatedName: PropTypes.func.isRequired,
};

Configuration.defaultProps = {
    annotations: [],
    selectedStart: null,
    selectedEnd: null,
    openedEditAnnotation: null,
    minValue: 0,
    maxValue: 0,
};
