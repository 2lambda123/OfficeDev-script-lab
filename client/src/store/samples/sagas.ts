import { put, takeEvery, call, select } from 'redux-saga/effects'
import { getType, ActionType } from 'typesafe-actions'

import selectors from '../selectors'
import { samples } from '../actions'
import { fetchYaml } from '../../services/general'
import { convertSnippetToSolution } from '../../utils'
import { createSolutionSaga } from '../solutions/sagas'

function* fetchAllSamplesMetadetaSaga() {
  const host: string = yield select(selectors.host.get)
  const { content, error } = yield call(
    fetchYaml,
    `https://raw.githubusercontent.com/OfficeDev/office-js-snippets/master/playlists/${host.toLowerCase()}.yaml`,
  )
  if (content) {
    yield put(samples.fetchMetadata.success(content.map(sample => ({ ...sample, host }))))
  } else {
    yield put(samples.fetchMetadata.failure(error))
  }
}

function* openSampleSaga(action: ActionType<typeof samples.get.request>) {
  let url = action.payload.rawUrl
  url = url.replace('<ACCOUNT>', 'OfficeDev')
  url = url.replace('<REPO>', 'office-js-snippets')
  url = url.replace('<BRANCH>', 'master')

  const { content, error } = yield call(fetchYaml, url)
  if (content) {
    const solution = convertSnippetToSolution(content)
    yield put(samples.get.success({ solution }))
  } else {
    yield put(samples.get.failure(error))
  }
}

function* handleOpenSampleSuccessSaga(action: ActionType<typeof samples.get.success>) {
  yield call(createSolutionSaga, action.payload.solution)
}

export default function* samplesWatcher() {
  yield takeEvery(getType(samples.fetchMetadata.request), fetchAllSamplesMetadetaSaga)

  yield takeEvery(getType(samples.get.request), openSampleSaga)
  yield takeEvery(getType(samples.get.success), handleOpenSampleSuccessSaga)
}