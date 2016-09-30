import {createEpicMiddleware, combineEpics} from "redux-observable";
import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/map";
import "rxjs/add/observable/fromPromise";
import "rxjs/add/observable/empty";
import {actions, receiveData, rosterAdded, updateRoster, rosterUpdated, rosterRemoved, fileUploaded} from "./actions.jsx";

const makeJsonRequest = (url, body, method = 'GET') => {
    const headers = new Headers();
    headers.set('Accepts', 'application/json');

    const jsonBody = body ? JSON.stringify(body) : undefined;

    if (jsonBody) {
        headers.set('Content-Type', 'application/json');
        headers.set('Content-Length', jsonBody.length);
    }

    const init = {
        method:      method,
        credentials: 'same-origin',
                     headers,
        ...(jsonBody ? {body: jsonBody} : {})
    };

    return Observable.fromPromise(
        fetch(url, init)
            .then(
                res => res.json(),
                error => ({error, data: {}})
            )
    )
};

const makeFileUploadRequest = (url, file, extra_data) => {

    let formData = new FormData();
    formData.append('file', file);

    return Observable.fromPromise(
        fetch(url, {
            method: 'POST',
            body: formData
        })
            .then(
                res => res.json(),
                error => ({error, data: {}})
            )
    ).map(data => ({...data, extra_data}));
};

const requestDataEpic = action$ =>
    action$
        .ofType(actions.REQUEST_DATA)
        .switchMap(() => makeJsonRequest('/api/data'))
        .map(({error, ...data}) => receiveData(error, data));

const addRosterEpic = action$ =>
    action$
        .ofType(actions.ADD_ROSTER)
        .switchMap(({name, event_id, spell_school_id}) => makeJsonRequest('/api/roster', {name, event_id, spell_school_id}, 'post'))
        .map(({error, roster}) => rosterAdded(error, roster));

const updateRosterEpic = action$ =>
    action$
        .ofType(actions.UPDATE_ROSTER)
        .switchMap(({roster_id, key, value}) => makeJsonRequest('/api/roster/' + roster_id, {[key]: value}, 'put'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const removeRosterEpic = action$ =>
    action$
        .ofType(actions.REMOVE_ROSTER)
        .switchMap(({roster_id, key, value}) => makeJsonRequest('/api/roster/' + roster_id, null, 'delete'))
        .map(({error, roster_id}) => rosterRemoved(error, roster_id));

const addItemEpic = action$ =>
    action$
        .ofType(actions.ADD_ITEM)
        .switchMap(({roster_id, target, item}) => makeJsonRequest('/api/roster/' + roster_id + '/item', {target, item}, 'post'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const removeItemEpic = action$ =>
    action$
        .ofType(actions.REMOVE_ITEM)
        .switchMap(({roster_id, target, index}) => makeJsonRequest(['/api/roster', roster_id, 'item', target, index].join('/'), null, 'delete'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const uploadFileEpic = action$ =>
    action$
        .ofType(actions.UPLOAD_FILE)
        .switchMap(({file, extra_data}) => makeFileUploadRequest('/upload', file, extra_data))
        .map(({error, file_url, extra_data}) => fileUploaded(error, file_url, extra_data));

const fileUploadedEpic = action$ =>
    action$
        .ofType(actions.FILE_UPLOADED)
        .map(({error, file_url, extra_data: {roster_id, target}}) => updateRoster(roster_id, target + '.image_url', file_url));

const addApprenticeEpic = action$ =>
    action$
        .ofType(actions.ADD_APPRENTICE)
        .switchMap(({roster_id, target, item}) => makeJsonRequest('/api/roster/' + roster_id + '/apprentice', null, 'post'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const removeApprenticeEpic = action$ =>
    action$
        .ofType(actions.REMOVE_APPRENTICE)
        .switchMap(({roster_id}) => makeJsonRequest(['/api/roster', roster_id, 'apprentice'].join('/'), null, 'delete'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const addSoldierEpic = action$ =>
    action$
        .ofType(actions.ADD_SOLDIER)
        .switchMap(({roster_id, miniature_id}) => makeJsonRequest(['/api/roster', roster_id, 'soldier', miniature_id ].join('/'), null, 'post'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const removeSoldierEpic = action$ =>
    action$
        .ofType(actions.REMOVE_SOLDIER)
        .switchMap(({roster_id, index}) => makeJsonRequest(['/api/roster', roster_id, 'soldier', index ].join('/'), null, 'delete'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const addSpellEpic = action$ =>
    action$
        .ofType(actions.ADD_SPELL)
        .switchMap(({roster_id, spell_school_id, spell_id}) => makeJsonRequest(['/api/roster', roster_id, 'spell', spell_school_id, spell_id ].join('/'), null, 'post'))
        .map(({error, roster}) => rosterUpdated(error, roster));

const removeSpellEpic = action$ =>
    action$
        .ofType(actions.REMOVE_SPELL)
        .switchMap(({roster_id, spell_id}) => makeJsonRequest(['/api/roster', roster_id, 'spell', spell_id ].join('/'), null, 'delete'))
        .map(({error, roster}) => rosterUpdated(error, roster));


const loggingEpic = action$ => {
    action$.subscribe(
        _ => console.log(_),
        _ => console.error(_)
    );
    return Observable.empty()
};

const epics = combineEpics(
    loggingEpic,
    requestDataEpic,
    addRosterEpic,
    updateRosterEpic,
    removeRosterEpic,
    addItemEpic,
    removeItemEpic,
    uploadFileEpic,
    fileUploadedEpic,
    addApprenticeEpic,
    removeApprenticeEpic,
    addSoldierEpic,
    removeSoldierEpic,
    addSpellEpic,
    removeSpellEpic
);

export const epicMiddleware = createEpicMiddleware(epics);