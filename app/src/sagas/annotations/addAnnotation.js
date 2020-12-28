import { call, takeLatest } from 'redux-saga/effects';
import { saveResults } from '@thorgate/spa-entities';
import api from 'services/api';
import { annotationSchema } from 'schemas/annotations';

export const TRIGGER_ADD_ANNOTATION = '@@sagas/annotations/TRIGGER_ADD';
export const addAnnotation = data => ({ type: TRIGGER_ADD_ANNOTATION, data });

function* addAnnotationSaga({ data }) {
    try {
        const response = yield api.annotations.list.post(null, { ...data });
        yield call(
            saveResults,
            annotationSchema.key,
            [response],
            [annotationSchema],
            { updateOrder: true },
        );
    } catch (err) {
        console.error(err);
    }
}

export default function* addAnnotationWatcherSaga() {
    yield takeLatest(TRIGGER_ADD_ANNOTATION, addAnnotationSaga);
}
