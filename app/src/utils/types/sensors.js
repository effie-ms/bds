import PropTypes from 'prop-types';

export const UploadShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
});

export const SensorFileDataShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    data: PropTypes.string,
    upload: PropTypes.number.isRequired,
    min_time: PropTypes.number,
    max_time: PropTypes.number,
    max_pressure: PropTypes.number,
    points_number: PropTypes.number,
    annotations_count: PropTypes.number.isRequired,
    truncation_start: PropTypes.number,
    truncation_end: PropTypes.number,
    updated_at: PropTypes.string.isRequired,
});

export const SensorFileShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    upload: PropTypes.number.isRequired,
    annotations_count: PropTypes.number.isRequired,
    truncation_start: PropTypes.number,
    truncation_end: PropTypes.number,
});

export const AnnotationShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
});
