import ClipboardJS from 'clipboard'
import { editableNode, exportPhrase, hashContext, isDocumentEditable, pathToContext, setSelection } from '../util'
import { exportContext, someDescendants, isPending, simplifyPath } from '../selectors'
import { alert, pull } from '../action-creators'
import { Shortcut } from '../@types'

/** Copies a string directly to the clipboard by simulating a button click with ClipboadJS. */
const copy = (s: string): void => {
  const dummyButton = document.createElement('button')
  const clipboard = new ClipboardJS(dummyButton, { text: () => s })
  dummyButton.click()
  clipboard.destroy()
}

const copyCursorShortcut: Shortcut = {
  id: 'copyCursor',
  label: 'Copy Cursor',
  description: 'Copies the cursor and all descendants.',
  keyboard: { key: 'c', meta: true },
  canExecute: getState =>
    // do not copy cursor if there is a browser selection
    !window.getSelection()?.toString() && !!getState().cursor && isDocumentEditable(),
  exec: async (dispatch, getState) => {
    const state = getState()
    const { cursor } = state
    const simplePath = simplifyPath(state, cursor!)
    const context = pathToContext(simplePath)
    const offset = window.getSelection()?.focusOffset

    // if there are any pending descendants, do a pull
    // otherwise copy whatever is in state
    if (someDescendants(state, context, (child, context) => isPending(state, [...context, child.value]))) {
      dispatch(alert('Loading thoughts...', { alertType: 'clipboard' }))
      await dispatch(pull({ [hashContext(context)]: context }, { maxDepth: Infinity }))
    }

    // get new state after pull
    const stateAfterPull = getState()

    const exported = exportContext(stateAfterPull, context, 'text/plain')
    copy(exported)

    // restore selection
    const el = editableNode(cursor!)
    setSelection(el!, { offset })

    const numDescendants = exported ? exported.split('\n').length - 1 : 0
    const phrase = exportPhrase(stateAfterPull, context, numDescendants)

    dispatch(
      alert(`Copied ${phrase} to the clipboard`, {
        alertType: 'clipboard',
        clearTimeout: 3000,
      }),
    )
  },
}

export default copyCursorShortcut
