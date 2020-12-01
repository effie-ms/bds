import { createFetchAction, createFetchSaga } from '@thorgate/spa-entities';
import { takeLatestWithMatch } from '@thorgate/spa-view-manager';
import { resolvePattern } from 'tg-named-routes';
import SETTINGS from 'settings';
import api from 'services/api';

import { sensorFileSchema } from 'schemas/files';

export const fetchSensorFile = createFetchAction(
    '@@sagas/files/TRIGGER_SENSOR_FILE_FETCH',
);

// Create worker to fetch data
const fetchSensorFileWorker = createFetchSaga({
    resource: api.files.detail,
    key: sensorFileSchema.key,
    listSchema: [sensorFileSchema],
    useDetails: true,
    timeoutMs: SETTINGS.LONG_SAGA_TIMEOUT,
});

// Usage with `@thorgate/spa-view-manager`
export const fetchSensorFileInitialWorker = fetchSensorFileWorker.asInitialWorker(
    ({ params }) =>
        fetchSensorFile({
            kwargs: { pk: params.fileId },
        }),
);

export default function* fetchSensorFileWatcher() {
    yield takeLatestWithMatch(
        fetchSensorFile.getType(),
        resolvePattern('files:details'),
        fetchSensorFileWorker,
    );
}
