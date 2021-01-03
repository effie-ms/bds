import { createFetchAction, createFetchSaga } from '@thorgate/spa-entities';
import { takeLatestWithMatch } from '@thorgate/spa-view-manager';
import { resolvePattern } from 'tg-named-routes';
import SETTINGS from 'settings';
import api from 'services/api';

import { sensorFileDataSchema } from 'schemas/files';

export const fetchSensorFileData = createFetchAction(
    '@@sagas/files/TRIGGER_SENSOR_FILE_FETCH_DATA',
);

// Create worker to fetch data
const fetchSensorFileDataWorker = createFetchSaga({
    resource: api.files.data,
    key: sensorFileDataSchema.key,
    listSchema: [sensorFileDataSchema],
    useDetails: true,
    timeoutMs: SETTINGS.LONG_SAGA_TIMEOUT,
    mutateQuery(match, _action) {
        // Filter the annotations list by the selected analysis
        return { sensor_file: match.params.fileId };
    },
});

// Usage with `@thorgate/spa-view-manager`
export const fetchSensorFileDataInitialWorker = fetchSensorFileDataWorker.asInitialWorker(
    ({ params }) =>
        fetchSensorFileData({
            kwargs: { pk: params.fileId },
        }),
);

export default function* fetchSensorFilePressureDataWatcher() {
    yield takeLatestWithMatch(
        fetchSensorFileData.getType(),
        resolvePattern('files:details'),
        fetchSensorFileDataWorker,
    );
}
