export const STATE_KEY = 'uploads';
const SET_CREATED_UPLOAD = `${STATE_KEY}/SET_CREATED_UPLOAD`;

const initialState = {};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case SET_CREATED_UPLOAD: {
            return {
                ...state,
                createdUploadId: action.id,
            };
        }

        default:
            return state;
    }
}

export const setCreatedUploadId = id => ({ type: SET_CREATED_UPLOAD, id });

export const selectors = {
    selectCreatedUploadId: state => state[STATE_KEY].createdUploadId,
};
