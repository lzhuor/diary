import _ from 'lodash';

const INITIAL_STATE = {
  user: null,
  entriesDateMap: {},
};
export default (state = INITIAL_STATE, action) => {
  if (action.type === 'LOGIN') {
    return { ...state, user: action.payload.user };
  } else if (action.type === 'VERSION') {
    return {
      ...state,
      backendVersion: action.payload.backendVersion ||
        state.backendVersion,
      frontendVersion: action.payload.frontendVersion ||
        state.frontendVersion,
    };
  } else if (action.type === 'ENTRIES_FOR_DATE') {
    return {
      ...state,
      entriesDateMap: { ...state.entriesDateMap, ...action.payload },
    };
  } else if (action.type === 'POST_ENTRY') {
    const date = action.payload.entry.date;
    const newEntriesArr = _.isArray(state.entriesDateMap[date]) ?
      state.entriesDateMap[date].slice() : [];
    newEntriesArr.push(action.payload.entry);
    return {
      ...state,
      entriesDateMap: {
        ...state.entriesDateMap,
        [date]: newEntriesArr
      },
    };
  } else if (action.type === 'UPDATE_ENTRY') {
    const date = action.payload.entry.date;
    let newEntriesArr = _.isArray(state.entriesDateMap[date]) ?
      state.entriesDateMap[date].slice() : [];
    const findIndex = newEntriesArr.findIndex(entry => entry._id == action.payload.entry._id);
    newEntriesArr = [...newEntriesArr.slice(0, findIndex), action.payload.entry, ...newEntriesArr.slice(findIndex + 1)];
    return {
      ...state,
      entriesDateMap: {
        ...state.entriesDateMap,
        [date]: newEntriesArr
      },
    };
  } else if (action.type === 'DELETE_ENTRY') {
    const date = action.payload.entry.date;
    let newEntriesArr = _.isArray(state.entriesDateMap[date]) ?
      state.entriesDateMap[date].slice() : [];
    const findIndex = newEntriesArr.findIndex(entry => entry._id == action.payload.entry._id);
    newEntriesArr = [...newEntriesArr.slice(0, findIndex), ...newEntriesArr.slice(findIndex + 1)];
    return {
      ...state,
      entriesDateMap: {
        ...state.entriesDateMap,
        [date]: newEntriesArr
      },
    };
  } else if (action.type === 'TODOS') {
    return {
      ...state,
      ...action.payload,
    };
  } else if (action.type === 'POST_TODO') {
    return {
      ...state,
      todos: [...state.todos, action.payload.todo],
    };
  } else {
    return state;
  }
};
