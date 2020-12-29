import PropTypes from 'prop-types';

export const UploadShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
});

export const SensorFileShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    data: PropTypes.string,
    upload: PropTypes.number.isRequired,
    min_time: PropTypes.number,
    max_time: PropTypes.number,
    max_pressure: PropTypes.number,
});

export const AnnotationShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
});
