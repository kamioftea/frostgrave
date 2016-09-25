import {createEpicMiddleware, combineEpics} from "redux-observable";
import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/map";
import "rxjs/add/observable/fromPromise";
import "rxjs/add/observable/empty";

import {
    actions, receiveData
} from './actions.jsx';

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

const requestDataEpic = action$ =>
    action$
        .ofType(actions.REQUEST_DATA)
        .switchMap(() => makeJsonRequest('/api/data'))
        .map(({error, ...data}) => receiveData(error, data));

const loggingEpic = action$ => {
    action$.subscribe(
        _ => console.log(_),
        _ => console.error(_)
    );
    return Observable.empty()
};


const epics = combineEpics(
    requestDataEpic,
    loggingEpic,
);

export const epicMiddleware = createEpicMiddleware(epics);