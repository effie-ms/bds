import { put, takeLatest } from 'redux-saga/effects';
import api from 'services/api';
import { annotationSchema } from 'schemas/annotations';
import { entitiesActions } from '@thorgate/spa-entities';

const TRIGGER_DELETE_ANNOTATION = '@@sagas/annotations/TRIGGER_DELETE';
export const deleteAnnotation = pk => ({ type: TRIGGER_DELETE_ANNOTATION, pk });

export function* deleteAnnotationSaga({ pk }) {
    try {
        yield api.annotations.detail.del({ pk });
        yield put(
            entitiesActions.purgeEntities({
                key: annotationSchema.key,
                ids: [pk],
            }),
        );
    } catch (err) {
        console.error(err);
    }
}

export default function* deleteAnnotationWatcherSaga() {
    yield takeLatest(TRIGGER_DELETE_ANNOTATION, deleteAnnotationSaga);
}
