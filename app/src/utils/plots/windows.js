import {
    getColour,
    getLayout,
    getPlotAnnotationLabel,
    getPlotAnnotationShape,
    getSelectionBox,
} from 'utils/plots/shared';
import { getColourTruncation } from '../sensorData';

export const overlayStyles = {
    left: 'calc(50vw - 40%)',
    margin: '10vh 0',
    top: 0,
    width: '80%',
};

const getSelectionAnnotation = (selectedStart, yLabelCoordinate, title) => ({
    x: selectedStart,
    y: yLabelCoordinate,
    xref: 'x',
    yref: 'y',
    text: title,
    showarrow: true,
    font: {
        size: 16,
        color: '#000000',
    },
    align: 'center',
    arrowhead: 0,
    arrowsize: 1,
    arrowwidth: 2,
    arrowcolor: '#636363',
    ax: 20,
    ay: -30,
    bordercolor: '#0047d3',
    borderwidth: 2,
    borderpad: 4,
    bgcolor: '#ffffff',
    opacity: 0.8,
    name: 'selection-box',
});

export const getLayoutEditableAnnotations = (
    selectionStart,
    selectionEnd,
    yLabelCoordinate,
    selectionTitle,
    editedAnnotationId,
    showAnnotations,
    annotations,
) => {
    const layoutDict = getLayout('P');

    if (showAnnotations) {
        const filteredAnnotations = annotations.filter(
            a => a.id !== editedAnnotationId,
        );

        layoutDict.shapes = filteredAnnotations.map((annotation, idx) =>
            getPlotAnnotationShape(
                annotation.start,
                annotation.end,
                getColour(idx),
            ),
        );
        layoutDict.annotations = filteredAnnotations.map((annotation, idx) =>
            getPlotAnnotationLabel(
                annotation.start,
                annotation.title,
                yLabelCoordinate,
                getColour(idx),
                'P',
            ),
        );
    }

    if (selectionStart !== null && selectionEnd !== null) {
        const selectionBox = getSelectionBox(selectionStart, selectionEnd);
        layoutDict.shapes.push(selectionBox);
        const selectionAnnotation = getSelectionAnnotation(
            selectionStart,
            yLabelCoordinate,
            selectionTitle,
        );
        layoutDict.annotations.push(selectionAnnotation);
    }

    return layoutDict;
};

export const getLayoutTruncation = (selectionStart, selectionEnd) => {
    const layoutDict = getLayout('P');

    if (selectionStart !== null && selectionEnd !== null) {
        const selectionBox = getSelectionBox(selectionStart, selectionEnd);
        layoutDict.shapes.push(selectionBox);
    }

    return layoutDict;
};

export const getNewPlotLayoutShapeXAsGlobal = (
    layout,
    isStart,
    xFormValue,
    withAnnotation,
) => {
    const validatedLayout = { ...layout };
    const shapes = layout?.shapes;
    if (shapes && shapes?.length > 0) {
        const selectionShape = shapes.find(s => s?.name === 'selection-box');
        if (selectionShape) {
            const shapeValue = isStart
                ? selectionShape?.x0
                : selectionShape?.x1;
            const changed =
                xFormValue && shapeValue && xFormValue !== shapeValue;
            if (changed) {
                const selectionShapeId = validatedLayout.shapes.indexOf(
                    selectionShape,
                );
                if (isStart) {
                    validatedLayout.shapes[selectionShapeId].x0 = xFormValue;
                } else {
                    validatedLayout.shapes[selectionShapeId].x1 = xFormValue;
                }

                if (isStart && withAnnotation) {
                    const layoutAnnotations = layout?.annotations;
                    if (layoutAnnotations && layoutAnnotations?.length > 0) {
                        const selectionAnnotation = layoutAnnotations.find(
                            a => a?.name === 'selection-box',
                        );
                        if (selectionAnnotation) {
                            const selectionAnnotationId = validatedLayout.annotations.indexOf(
                                selectionAnnotation,
                            );
                            validatedLayout.annotations[
                                selectionAnnotationId
                            ].x = xFormValue;
                        }
                    }
                }

                return validatedLayout;
            }
        }
    }

    return null;
};

export const getNewPlotLayoutAnnotationTitleAsGlobal = (layout, formTitle) => {
    const validatedLayout = { ...layout };
    const layoutAnnotations = layout?.annotations;
    if (layoutAnnotations && layoutAnnotations?.length > 0) {
        const selectionAnnotation = layoutAnnotations.find(
            a => a?.name === 'selection-box',
        );
        if (selectionAnnotation && selectionAnnotation?.text !== formTitle) {
            const selectionAnnotationId = validatedLayout.annotations.indexOf(
                selectionAnnotation,
            );
            validatedLayout.annotations[selectionAnnotationId].text = formTitle;
            return validatedLayout;
        }
    }

    return null;
};

export const getNewPlotLayoutShapeYValidate = layout => {
    const validatedLayout = { ...layout };
    const shapes = layout?.shapes;
    if (shapes && shapes?.length > 0) {
        const selectionShape = shapes.find(s => s?.name === 'selection-box');
        if (
            selectionShape &&
            ((selectionShape?.y0 && selectionShape?.y0 !== 0) ||
                (selectionShape?.y1 && selectionShape?.y1 !== 1))
        ) {
            const selectionShapeId = validatedLayout.shapes.indexOf(
                selectionShape,
            );
            validatedLayout.shapes[selectionShapeId].y0 = 0;
            validatedLayout.shapes[selectionShapeId].y1 = 1;
            return validatedLayout;
        }
    }

    return null;
};

export const getNewPlotLayoutAnnotationXAsShapeX = layout => {
    const validatedLayout = { ...layout };
    const shapes = layout?.shapes;
    if (shapes && shapes?.length > 0) {
        const selectionShape = shapes.find(s => s?.name === 'selection-box');
        if (selectionShape) {
            const layoutAnnotations = layout?.annotations;
            if (layoutAnnotations && layoutAnnotations?.length > 0) {
                const selectionAnnotation = layoutAnnotations.find(
                    a => a?.name === 'selection-box',
                );
                if (
                    selectionAnnotation &&
                    selectionAnnotation?.x !== selectionShape?.x0
                ) {
                    const selectionAnnotationId = validatedLayout.annotations.indexOf(
                        selectionAnnotation,
                    );
                    validatedLayout.annotations[selectionAnnotationId].x =
                        selectionShape.x0;
                    return validatedLayout;
                }
            }
        }
    }

    return null;
};

export const getNewGlobalXAsPlotLayoutShapeX = (layout, isStart, globalVal) => {
    const shapes = layout?.shapes;
    if (shapes && shapes?.length > 0) {
        const selectionShape = shapes.find(s => s?.name === 'selection-box');
        if (selectionShape) {
            if (isStart) {
                if (selectionShape?.x0 && globalVal !== selectionShape?.x0) {
                    const roundedStart = parseFloat(
                        selectionShape.x0.toFixed(3),
                    );
                    return roundedStart;
                }
            } else if (selectionShape?.x1 && globalVal !== selectionShape?.x1) {
                const roundedEnd = parseFloat(selectionShape.x1.toFixed(3));
                return roundedEnd;
            }
        }
    }

    return null;
};

export const getNewColourTruncationSelection = (
    start,
    end,
    minValue,
    maxValue,
    minMaxPointsNumber,
) => {
    if (
        start !== null &&
        end !== null &&
        minValue !== null &&
        maxValue !== null &&
        minMaxPointsNumber !== null
    ) {
        return getColourTruncation(
            start,
            end,
            minValue,
            maxValue,
            minMaxPointsNumber,
        );
    }

    return null;
};
