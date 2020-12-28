import { call, takeLatest } from 'redux-saga/effects';
import { saveResult } from '@thorgate/spa-entities';
import api from 'services/api';
import { annotationSchema } from 'schemas/annotations';

export const TRIGGER_PATCH_ANNOTATION = '@@sagas/annotations/TRIGGER_PATCH';
export const patchAnnotation = (pk, data) => ({
    type: TRIGGER_PATCH_ANNOTATION,
    pk,
    data,
});

function* patchAnnotationSaga(payload) {
    try {
        const response = yield api.annotations.detail.patch(
            { pk: payload.pk },
            payload.data,
        );
        yield call(
            saveResult,
            annotationSchema.key,
            response,
            annotationSchema,
        );
    } catch (err) {
        console.error(err);
    }
}

export default function* patchAnnotationWatcherSaga() {
    yield takeLatest(TRIGGER_PATCH_ANNOTATION, patchAnnotationSaga);
}
