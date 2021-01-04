import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { H4, Button, Tooltip, Position, Intent } from '@blueprintjs/core';
import { AnnotationShape } from 'utils/types';
import { TruncationWindow } from 'components/sensors/TruncationWindow';
import { AnnotationUpdateWindow } from 'components/sensors/AnnotationUpdateWindow';

export const Configuration = ({
    annotations,
    onAddAnnotation,
    onEditAnnotation,
    onRemoveAnnotation,
    minValueTruncated,
    maxValueTruncated,
    minValueAll,
    maxValueAll,
    sensorFileId,
    pressureData,
    yLabelCoordinate,
    allPressureData,
    truncationStart,
    truncationEnd,
    onSaveTruncation,
}) => {
    const [isOpenAnnotationUpdate, setIsOpenAnnotationUpdate] = useState(false);
    const [isOpenTruncation, setIsOpenTruncation] = useState(false);

    const [updatedAnnotation, setUpdatedAnnotation] = useState(null);

    useEffect(() => {
        if (truncationStart === null || truncationEnd === null) {
            setIsOpenTruncation(true);
        }
    });

    useEffect(() => {
        if (truncationStart !== null && truncationEnd !== null) {
            setIsOpenTruncation(false);
        }
    }, [truncationStart, truncationEnd]);

    return (
        <>
            <TruncationWindow
                isOpen={isOpenTruncation}
                onClose={() => setIsOpenTruncation(false)}
                allPressureData={allPressureData}
                minValue={minValueAll}
                maxValue={maxValueAll}
                sensorFileId={sensorFileId}
                truncationStart={truncationStart}
                truncationEnd={truncationEnd}
                onSaveTruncation={onSaveTruncation}
            />
            <AnnotationUpdateWindow
                isOpen={isOpenAnnotationUpdate}
                onClose={() => {
                    setIsOpenAnnotationUpdate(false);
                    setUpdatedAnnotation(null);
                }}
                annotations={annotations}
                updatedAnnotation={updatedAnnotation}
                onCreateAnnotation={onAddAnnotation}
                onEditAnnotation={onEditAnnotation}
                minValue={minValueTruncated}
                maxValue={maxValueTruncated}
                sensorFileId={sensorFileId}
                pressureData={pressureData}
                yLabelCoordinate={yLabelCoordinate}
            />
            <div className="bp3-callout bp3-intent-primary bp3-icon-info-sign">
                <p className="bp3-heading">
                    Crop data to get a higher resolution and improve
                    performance.
                </p>
                <div className="d-flex justify-content-end w-100">
                    <Button
                        onClick={() => setIsOpenTruncation(true)}
                        text="Crop data"
                        intent={Intent.PRIMARY}
                    />
                </div>
            </div>
            <div className="my-3">
                <div className="d-flex flex-row justify-content-start mb-3">
                    <H4 className="mb-0 mr-2" style={{ lineHeight: '40px' }}>
                        Annotations
                    </H4>
                    <Tooltip
                        content="Create"
                        position={Position.TOP_RIGHT}
                        disabled={annotations && annotations?.length >= 5}
                    >
                        <Button
                            icon="add"
                            minimal
                            large
                            onClick={() => setIsOpenAnnotationUpdate(true)}
                            disabled={annotations && annotations?.length >= 5}
                        />
                    </Tooltip>
                </div>
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
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {annotation.title}
                                        </p>
                                        <p className="mb-0 bp3-text-small">
                                            {`[${annotation.start}; ${annotation.end}]`}
                                        </p>
                                    </div>
                                    <div className="d-flex flex-row">
                                        <Tooltip
                                            content="Edit"
                                            position={Position.TOP_RIGHT}
                                        >
                                            <Button
                                                icon="edit"
                                                minimal
                                                onClick={() => {
                                                    setIsOpenAnnotationUpdate(
                                                        true,
                                                    );
                                                    setUpdatedAnnotation(
                                                        annotation,
                                                    );
                                                }}
                                            />
                                        </Tooltip>
                                        <Tooltip
                                            content="Remove"
                                            position={Position.TOP_RIGHT}
                                        >
                                            <Button
                                                icon="cross"
                                                minimal
                                                onClick={() =>
                                                    onRemoveAnnotation(
                                                        annotation.id,
                                                    )
                                                }
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
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
    annotations: PropTypes.arrayOf(AnnotationShape),
    onAddAnnotation: PropTypes.func.isRequired,
    onEditAnnotation: PropTypes.func.isRequired,
    onRemoveAnnotation: PropTypes.func.isRequired,
    minValueTruncated: PropTypes.number,
    maxValueTruncated: PropTypes.number,
    minValueAll: PropTypes.number,
    maxValueAll: PropTypes.number,
    sensorFileId: PropTypes.number.isRequired,
    pressureData: PropTypes.arrayOf(PropTypes.object),
    yLabelCoordinate: PropTypes.number,
    allPressureData: PropTypes.arrayOf(PropTypes.object),
    truncationStart: PropTypes.number,
    truncationEnd: PropTypes.number,
    onSaveTruncation: PropTypes.func.isRequired,
};

Configuration.defaultProps = {
    annotations: [],
    pressureData: [],
    minValueTruncated: null,
    maxValueTruncated: null,
    minValueAll: null,
    maxValueAll: null,
    yLabelCoordinate: 0,
    allPressureData: [],
    truncationStart: null,
    truncationEnd: null,
};
