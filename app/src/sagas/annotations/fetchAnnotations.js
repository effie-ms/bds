import { createFetchAction, createFetchSaga } from '@thorgate/spa-entities';
import { takeLatestWithMatch } from '@thorgate/spa-view-manager';
import { resolvePattern } from 'tg-named-routes';
import SETTINGS from 'settings';
import api from 'services/api';
import { annotationSchema } from 'schemas/annotations';

export const fetchAnnotations = createFetchAction(
    '@@sagas/annotations/TRIGGER_FETCH',
);

const fetchAnnotationsWorker = createFetchSaga({
    resource: api.annotations.list,
    key: annotationSchema.key,
    listSchema: [annotationSchema],
    mutateQuery(match, _action) {
        return { sensor_file: match.params.fileId };
    },
    timeoutMs: SETTINGS.LONG_SAGA_TIMEOUT,
});

export const fetchAnnotationsInitialWorker = fetchAnnotationsWorker.asInitialWorker(
    () => fetchAnnotations(),
);

export default function* fetchAnnotationsWatcher() {
    yield takeLatestWithMatch(
        fetchAnnotations.getType(),
        resolvePattern('files:details'),
        fetchAnnotationsWorker,
    );
}
