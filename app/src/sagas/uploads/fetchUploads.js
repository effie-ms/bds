import { call } from 'redux-saga/effects';
import { createFetchAction, createFetchSaga } from '@thorgate/spa-entities';
import { takeLatestWithMatch } from '@thorgate/spa-view-manager';
import { resolvePattern } from 'tg-named-routes';
import api from 'services/api';
import { createPaginationSuccessHook } from '@thorgate/spa-pagination';

import { serializeData } from 'utils/serializeData';
import { uploadSchema } from 'schemas/uploads';

export const fetchUploads = createFetchAction('@@sagas/uploads/TRIGGER_FETCH');

function* successHook(result, ...args) {
    const hook = createPaginationSuccessHook(uploadSchema.key, true);
    const pagination = yield call(hook, result, ...args);
    return pagination;
}

// Create worker to fetch data
const fetchUploadsWorker = createFetchSaga({
    resource: api.uploads.list,
    key: uploadSchema.key,
    successHook,
    serializeData,
    listSchema: [uploadSchema],
});

export const fetchUploadsInitialWorker = fetchUploadsWorker.asInitialWorker(
    () => fetchUploads(),
);

export default function* fetchUploadsWatcher() {
    yield takeLatestWithMatch(
        fetchUploads.getType(),
        resolvePattern('landing'),
        fetchUploadsWorker,
    );
}
