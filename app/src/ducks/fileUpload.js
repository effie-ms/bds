export const STATE_KEY = 'fileUpload';
export const SET_FILE_UPLOADS = `${STATE_KEY}/SET_FILE_UPLOADS`;
export const SET_FILE_UPLOAD_REQUEST = `${STATE_KEY}/SET_FILE_UPLOAD_REQUEST`;
export const SET_FILE_UPLOAD_PROGRESS = `${STATE_KEY}/SET_FILE_UPLOAD_PROGRESS`;
export const SET_FILE_UPLOAD_SUCCESS = `${STATE_KEY}/SET_FILE_UPLOAD_SUCCESS`;
export const SET_FILE_UPLOAD_FAILURE = `${STATE_KEY}/SET_FILE_UPLOAD_FAILURE`;

const initialState = {
    files: {},
};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case SET_FILE_UPLOADS: {
            return {
                ...state,
                files: action.files,
            };
        }
        case SET_FILE_UPLOAD_REQUEST: {
            const { file } = state.files[action.id];
            return {
                ...state,
                files: {
                    ...state.files,
                    [action.id]: { file, progress: 0 },
                },
            };
        }
        case SET_FILE_UPLOAD_PROGRESS: {
            const fileUpload = state.files[action.id];
            const { error, file } = fileUpload;
            return {
                ...state,
                files: {
                    ...state.files,
                    [action.id]: { error, file, progress: action.progress },
                },
            };
        }
        case SET_FILE_UPLOAD_SUCCESS: {
            const { file } = state.files[action.id];
            return {
                ...state,
                files: {
                    ...state.files,
                    [action.id]: { file, progress: 1, success: true },
                },
            };
        }
        case SET_FILE_UPLOAD_FAILURE: {
            const fileUpload = state.files[action.id];
            const { progress, file } = fileUpload;
            return {
                ...state,
                files: {
                    ...state.files,
                    [action.id]: { progress, file, error: action.error },
                },
            };
        }

        default:
            return state;
    }
}

export const setFileUploads = files => ({ type: SET_FILE_UPLOADS, files });

export const setFileUploadRequest = (id, file, uploadId) => ({
    type: SET_FILE_UPLOAD_REQUEST,
    id,
    file,
    uploadId,
});

export const setFileUploadProgress = (id, progress) => ({
    type: SET_FILE_UPLOAD_PROGRESS,
    id,
    progress,
});

export const setFileUploadSuccess = id => ({
    type: SET_FILE_UPLOAD_SUCCESS,
    id,
});

export const setFileUploadFailure = (id, error) => ({
    type: SET_FILE_UPLOAD_FAILURE,
    id,
    error,
});

export const selectors = {
    selectFiles: state => state[STATE_KEY].files,
};
