import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Overlay,
    H3,
    Classes,
    Switch,
    Button,
    Intent,
    Spinner,
} from '@blueprintjs/core';
import loadable from '@loadable/component';

import { AnnotationShape } from 'utils/types';
import {
    getLayoutEditableAnnotations,
    getNewGlobalXAsPlotLayoutShapeX,
    getNewPlotLayoutAnnotationTitleAsGlobal,
    getNewPlotLayoutAnnotationXAsShapeX,
    getNewPlotLayoutShapeXAsGlobal,
    getNewPlotLayoutShapeYValidate,
    overlayStyles,
} from 'utils/plots/windows';
import { getConfig } from 'utils/plots/shared';
import { AnnotationWindowForm } from 'forms/AnnotationWindowForm';

const Plot =
    process.env.BUILD_TARGET === 'client'
        ? loadable(() => import('react-plotly.js'))
        : null;

export const AnnotationUpdateWindow = ({
    isOpen,
    onClose,
    annotations,
    updatedAnnotation,
    onCreateAnnotation,
    onEditAnnotation,
    minValue,
    maxValue,
    sensorFileId,
    pressureData,
    yLabelCoordinate,
}) => {
    const [selectionStart, setSelectionStart] = useState(
        updatedAnnotation ? updatedAnnotation.start : minValue,
    );
    const [selectionEnd, setSelectionEnd] = useState(
        updatedAnnotation ? updatedAnnotation.end : maxValue,
    );
    const [selectionTitle, setSelectionTitle] = useState(
        updatedAnnotation ? updatedAnnotation.title : '',
    );

    const [showAnnotations, setShowAnnotations] = useState(false);

    const [layout, setLayout] = useState(null);

    const formHeading = updatedAnnotation
        ? 'Edit a window annotation:'
        : 'Create a new window annotation:';

    useEffect(() => {
        if (isOpen) {
            let startVal = null;
            let endVal = null;
            if (selectionStart === null) {
                if (updatedAnnotation !== null) {
                    setSelectionStart(updatedAnnotation?.start);
                    startVal = updatedAnnotation?.start;
                } else {
                    setSelectionStart(minValue);
                    startVal = minValue;
                }
            }
            if (selectionEnd === null) {
                if (updatedAnnotation !== null) {
                    setSelectionEnd(updatedAnnotation?.end);
                    endVal = updatedAnnotation?.end;
                } else {
                    setSelectionEnd(maxValue);
                    endVal = maxValue;
                }
            }
            if (startVal !== null && endVal !== null) {
                setLayout(
                    getLayoutEditableAnnotations(
                        startVal,
                        endVal,
                        yLabelCoordinate,
                        selectionTitle,
                        updatedAnnotation?.id,
                        showAnnotations,
                        annotations,
                    ),
                );
            }
        } else {
            setSelectionStart(null);
            setSelectionEnd(null);
            setSelectionTitle('');
            setLayout(null);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectionStart(
            updatedAnnotation ? updatedAnnotation.start : minValue,
        );
        setSelectionEnd(updatedAnnotation ? updatedAnnotation.end : maxValue);
        setSelectionTitle(updatedAnnotation ? updatedAnnotation.title : '');
        setLayout(
            getLayoutEditableAnnotations(
                updatedAnnotation?.start || minValue,
                updatedAnnotation?.end || maxValue,
                yLabelCoordinate,
                updatedAnnotation?.title || '',
                updatedAnnotation?.id,
                showAnnotations,
                annotations,
            ),
        );
    }, [updatedAnnotation?.id]);

    useEffect(() => {
        if (selectionStart === null) {
            setSelectionStart(minValue);
        }
    }, [minValue]);

    useEffect(() => {
        if (selectionEnd === null) {
            setSelectionEnd(maxValue);
        }
    }, [maxValue]);

    useEffect(() => {
        if (selectionStart !== null && selectionEnd !== null) {
            setLayout(
                getLayoutEditableAnnotations(
                    selectionStart,
                    selectionEnd,
                    yLabelCoordinate,
                    selectionTitle,
                    updatedAnnotation?.id,
                    showAnnotations,
                    annotations,
                ),
            );
        }
    }, [showAnnotations]);

    useEffect(() => {
        const newLayout = getNewPlotLayoutAnnotationTitleAsGlobal(
            layout,
            selectionTitle,
        );
        if (newLayout !== null) {
            setLayout(newLayout);
        }
    }, [selectionTitle]);

    useEffect(() => {
        let tempLayout;
        if (
            layout === null &&
            selectionStart !== null &&
            selectionEnd !== null
        ) {
            tempLayout = getLayoutEditableAnnotations(
                selectionStart,
                selectionEnd,
                yLabelCoordinate,
                selectionTitle,
                updatedAnnotation?.id,
                showAnnotations,
                annotations,
            );
            setLayout(tempLayout);
        } else {
            tempLayout = layout;
        }

        if (tempLayout) {
            const newLayout = getNewPlotLayoutShapeXAsGlobal(
                tempLayout,
                true,
                selectionStart,
                true,
            );
            if (newLayout !== null) {
                setLayout(newLayout);
            }
        }
    }, [selectionStart]);

    useEffect(() => {
        let tempLayout;
        if (
            layout === null &&
            selectionStart !== null &&
            selectionEnd !== null
        ) {
            tempLayout = getLayoutEditableAnnotations(
                selectionStart,
                selectionEnd,
                yLabelCoordinate,
                selectionTitle,
                updatedAnnotation?.id,
                showAnnotations,
                annotations,
            );
            setLayout(tempLayout);
        } else {
            tempLayout = layout;
        }

        if (tempLayout) {
            const newLayout = getNewPlotLayoutShapeXAsGlobal(
                tempLayout,
                false,
                selectionEnd,
                false,
            );
            if (newLayout !== null) {
                setLayout(newLayout);
            }
        }
    }, [selectionEnd]);

    const onGraphDataChange = data => {
        if (data?.layout) {
            let validatedLayout = { ...data?.layout };
            let doRelayout = false;

            const tempLayout1 = getNewPlotLayoutShapeYValidate(validatedLayout);
            if (tempLayout1 !== null) {
                validatedLayout = tempLayout1;
                doRelayout = true;
            }

            const tempLayout2 = getNewPlotLayoutAnnotationXAsShapeX(
                validatedLayout,
            );
            if (tempLayout2 !== null) {
                validatedLayout = tempLayout2;
                doRelayout = true;
            }

            const roundedStart = getNewGlobalXAsPlotLayoutShapeX(
                validatedLayout,
                true,
                selectionStart,
            );
            if (roundedStart !== null) {
                setSelectionStart(roundedStart);
            }

            const roundedEnd = getNewGlobalXAsPlotLayoutShapeX(
                validatedLayout,
                false,
                selectionEnd,
            );
            if (roundedEnd !== null) {
                setSelectionEnd(roundedEnd);
            }

            if (doRelayout) {
                setLayout(validatedLayout);
            }
        }
    };

    const setGlobalGraphValuesAsInForm = target => {
        const name = target?.name;
        const value = target?.value;

        if (name === 'start') {
            const numValue = parseFloat(value);
            setSelectionStart(numValue);
        } else if (name === 'end') {
            const numValue = parseFloat(value);
            setSelectionEnd(numValue);
        } else if (name === 'title') {
            setSelectionTitle(value);
        }
    };

    return (
        <>
            <Overlay
                className={Classes.OVERLAY_SCROLL_CONTAINER}
                isOpen={isOpen}
                onClose={onClose}
            >
                <div
                    className="bp3-card bp3-elevation-4 bp3-overlay-content bp3-overlay-enter-done"
                    style={overlayStyles}
                >
                    <div className="d-flex flex-row justify-content-between w-100">
                        <H3>{formHeading}</H3>
                        <Button icon="cross" onClick={onClose} large minimal />
                    </div>
                    {annotations && annotations?.length > 0 && (
                        <Switch
                            checked={showAnnotations}
                            onChange={() =>
                                setShowAnnotations(!showAnnotations)
                            }
                            label="Show other annotations"
                            className="mb-0"
                        />
                    )}
                    {(!pressureData || !Plot || !layout) && (
                        <Spinner
                            intent={Intent.PRIMARY}
                            size={Spinner.SIZE_STANDARD}
                        />
                    )}
                    {pressureData && Plot && layout && (
                        <>
                            <Plot
                                data={pressureData}
                                className="w-100 my-2"
                                divId="pressure-annotating"
                                layout={layout}
                                showlegend
                                config={getConfig(true)}
                                useResizeHandler
                                style={{ height: '500px' }}
                                onUpdate={data => onGraphDataChange(data)}
                            />
                            <AnnotationWindowForm
                                title={selectionTitle}
                                start={selectionStart}
                                end={selectionEnd}
                                minValue={minValue}
                                maxValue={maxValue}
                                onSave={
                                    updatedAnnotation
                                        ? onEditAnnotation
                                        : onCreateAnnotation
                                }
                                onCancel={onClose}
                                annotationId={updatedAnnotation?.id}
                                sensorFileId={sensorFileId}
                                updateAnnotations={setGlobalGraphValuesAsInForm}
                            />
                        </>
                    )}
                </div>
            </Overlay>
        </>
    );
};

AnnotationUpdateWindow.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    annotations: PropTypes.arrayOf(AnnotationShape),
    updatedAnnotation: AnnotationShape,
    onCreateAnnotation: PropTypes.func.isRequired,
    onEditAnnotation: PropTypes.func.isRequired,
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    sensorFileId: PropTypes.number.isRequired,
    pressureData: PropTypes.arrayOf(PropTypes.object),
    yLabelCoordinate: PropTypes.number.isRequired,
};

AnnotationUpdateWindow.defaultProps = {
    annotations: [],
    updatedAnnotation: null,
    pressureData: [],
    minValue: null,
    maxValue: null,
};
