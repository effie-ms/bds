import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Overlay,
    H3,
    Callout,
    Classes,
    Spinner,
    Intent,
} from '@blueprintjs/core';
import loadable from '@loadable/component';

import {
    getLayoutTruncation,
    overlayStyles,
    getNewPlotLayoutShapeXAsGlobal,
    getNewGlobalXAsPlotLayoutShapeX,
    getNewPlotLayoutShapeYValidate,
} from 'utils/plots/windows';
import { getConfig } from 'utils/plots/shared';
import { TruncationWindowForm } from 'forms/TruncationWindowForm';

const Plot =
    process.env.BUILD_TARGET === 'client'
        ? loadable(() => import('react-plotly.js'))
        : null;

export const TruncationWindow = ({
    isOpen,
    onClose,
    allPressureData,
    minValue,
    maxValue,
    sensorFileId,
    truncationStart,
    truncationEnd,
    onSaveTruncation,
}) => {
    const [selectionStart, setSelectionStart] = useState(
        truncationStart || minValue,
    );
    const [selectionEnd, setSelectionEnd] = useState(truncationEnd || maxValue);
    const [layout, setLayout] = useState(null);

    useEffect(() => {
        if (isOpen) {
            let startVal = null;
            let endVal = null;
            if (selectionStart === null) {
                if (truncationStart !== null) {
                    setSelectionStart(truncationStart);
                    startVal = truncationStart;
                } else {
                    setSelectionStart(minValue);
                    startVal = minValue;
                }
            }
            if (selectionEnd === null) {
                if (truncationEnd !== null) {
                    setSelectionEnd(truncationEnd);
                    endVal = truncationEnd;
                } else {
                    setSelectionEnd(maxValue);
                    endVal = maxValue;
                }
            }
            if (startVal !== null && endVal !== null) {
                setLayout(getLayoutTruncation(startVal, endVal));
            }
        } else {
            setSelectionStart(null);
            setSelectionEnd(null);
            setLayout(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (truncationStart !== null) {
            setSelectionStart(truncationStart);
        } else {
            setSelectionStart(minValue);
        }
    }, [truncationStart]);

    useEffect(() => {
        if (truncationEnd !== null) {
            setSelectionEnd(truncationEnd);
        } else {
            setSelectionEnd(maxValue);
        }
    }, [truncationEnd]);

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
        let tempLayout;
        if (
            layout === null &&
            selectionStart !== null &&
            selectionEnd !== null
        ) {
            tempLayout = getLayoutTruncation(selectionStart, selectionEnd);
            setLayout(tempLayout);
        } else {
            tempLayout = layout;
        }

        if (tempLayout) {
            const newLayout = getNewPlotLayoutShapeXAsGlobal(
                tempLayout,
                true,
                selectionStart,
                false,
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
            tempLayout = getLayoutTruncation(selectionStart, selectionEnd);
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

            const tempLayout = getNewPlotLayoutShapeYValidate(validatedLayout);
            if (tempLayout !== null) {
                validatedLayout = tempLayout;
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

        if (name === 'truncationStart') {
            const numValue = parseFloat(value);
            setSelectionStart(numValue);
        } else if (name === 'truncationEnd') {
            const numValue = parseFloat(value);
            setSelectionEnd(numValue);
        }
    };

    return (
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
                    <H3>Crop data:</H3>
                    <Button
                        icon="cross"
                        onClick={onClose}
                        large
                        minimal
                        disabled={
                            truncationStart === null || truncationEnd === null
                        }
                    />
                </div>
                {(truncationStart === null || truncationEnd === null) && (
                    <Callout
                        intent={Intent.WARNING}
                        title="Complete truncation to continue"
                    />
                )}
                {(!allPressureData || !Plot || !layout) && (
                    <Spinner
                        intent={Intent.PRIMARY}
                        size={Spinner.SIZE_STANDARD}
                    />
                )}
                {allPressureData && Plot && layout && (
                    <>
                        <Plot
                            data={allPressureData}
                            className="w-100 my-2"
                            divId="pressure-whole-graph"
                            layout={layout}
                            showlegend
                            config={getConfig(true)}
                            useResizeHandler
                            style={{ height: 500 }}
                            onUpdate={data => onGraphDataChange(data)}
                        />
                        <TruncationWindowForm
                            truncationStart={selectionStart}
                            truncationEnd={selectionEnd}
                            minValue={minValue}
                            maxValue={maxValue}
                            onSave={onSaveTruncation}
                            sensorFileId={sensorFileId}
                            onClose={onClose}
                            updateBoundariesOnGraph={
                                setGlobalGraphValuesAsInForm
                            }
                        />
                    </>
                )}
            </div>
        </Overlay>
    );
};

TruncationWindow.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    allPressureData: PropTypes.arrayOf(PropTypes.object),
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    sensorFileId: PropTypes.number.isRequired,
    truncationStart: PropTypes.number,
    truncationEnd: PropTypes.number,
    onSaveTruncation: PropTypes.func.isRequired,
};

TruncationWindow.defaultProps = {
    allPressureData: [],
    truncationStart: null,
    truncationEnd: null,
    minValue: null,
    maxValue: null,
};
