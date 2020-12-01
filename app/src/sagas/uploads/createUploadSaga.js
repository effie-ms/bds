import { createSaveAction, createFormSaveSaga } from '@thorgate/spa-forms';
import { put, takeLatest, select } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { resolvePath as urlResolve } from 'tg-named-routes';
import api from 'services/api';

import {
    setCreatedUploadId,
    selectors as uploadsSelectors,
} from 'ducks/uploads';
import {
    setFileUploadRequest,
    selectors as fileUploadSelectors,
} from 'ducks/fileUpload';

export const createUpload = createSaveAction('sagas/uploads/CREATE_UPLOAD');

function* apiSaveHook(match, { payload: { data } }) {
    const id = yield select(uploadsSelectors.selectCreatedUploadId);
    if (id) {
        // handling situation when user submits upload creation view multiple times
        return yield api.uploads.detail.patch({ pk: String(id) }, data);
    }
    return yield api.uploads.list.post(null, data);
}

function* successHook(result, _1, _2) {
    const uploadId = result.id;
    // after successfully created upload object upload video files
    yield put(setCreatedUploadId(result.id));
    const files = yield select(fileUploadSelectors.selectFiles);
    const filesIds = Object.keys(files);
    for (let i = 0; i < filesIds.length; i++) {
        const fileId = filesIds[i];
        const fileUpload = files[fileId];
        if (fileId && fileUpload.file && !fileUpload.success) {
            yield put(setFileUploadRequest(fileId, fileUpload.file, uploadId));
        }
    }
    // handling situation then request comes for an upload with already uploaded files
    // for example user deleted a file with a server error and presses submit button on the session form which contains
    // created upload
    // redirect happens after all files have been uploaded successfully
    if (!Object.values(files).find(f => !f.success)) {
        yield put(push(urlResolve('files:list', { uploadId })));
    }
}

const handleFormSave = createFormSaveSaga({ apiSaveHook, successHook });

export default function* createUploadWatcherSaga() {
    yield takeLatest(createUpload.getType(), handleFormSave, null);
}
