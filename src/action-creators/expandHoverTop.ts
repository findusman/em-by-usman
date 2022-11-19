import DropThoughtZone from '../@types/DropThoughtZone'
import Path from '../@types/Path'
import State from '../@types/State'
import Thunk from '../@types/Thunk'
import Timer from '../@types/Timer'
import { AlertType, EXPAND_HOVER_DELAY } from '../constants'
import rootedParentOf from '../selectors/rootedParentOf'
import visibleDistanceAboveCursor from '../selectors/visibleDistanceAboveCursor'
import equalPath from '../util/equalPath'
import isDescendantPath from '../util/isDescendantPath'
import parentOf from '../util/parentOf'

// eslint-disable-next-line prefer-const
let expandTopTimer: Timer | null = null

/** Clears an active delayed dispatch. */
const clearTimer = () => {
  if (expandTopTimer) {
    clearTimeout(expandTopTimer)
    expandTopTimer = null
  }
}

/** Delays dispatch of expandHoverTop. */
const expandHoverTopDebounced =
  (path: Path): Thunk =>
  (dispatch, getState) => {
    clearTimer()
    expandTopTimer = setTimeout(() => {
      const state = getState()
      // abort if dragging over quick drop components
      if (state.alert?.alertType === AlertType.DeleteDropHint || state.alert?.alertType === AlertType.CopyOneDropHint)
        return
      dispatch({ type: 'expandHoverTop', path })
      expandTopTimer = null
    }, EXPAND_HOVER_DELAY)
  }

/** Checks if the current hovering thought's parent should expand its context. */
const shouldAllowActiveHoverTop = (state: State) => {
  const { cursor, expandHoverTopPath, hoveringPath } = state

  if (!hoveringPath || state.hoverZone !== DropThoughtZone.ThoughtDrop) return false

  const parentOfHoveringThought = hoveringPath && parentOf(hoveringPath)

  // prevent setting expand hover path deeper than the current
  if (expandHoverTopPath && parentOfHoveringThought.length >= expandHoverTopPath.length) return false

  const depth = parentOfHoveringThought.length

  const distanceFromCusor = cursor ? cursor.length - depth : 0

  // Note: Hover expand top is activated when hovered over one the context's children thought drop target.

  // Check if the current thought is the parent of first visible thought nearest to the root.
  const isParentOfFirstVisibleThought =
    cursor &&
    distanceFromCusor - 1 === visibleDistanceAboveCursor(state) &&
    isDescendantPath(cursor, parentOfHoveringThought)

  /** Check if current hovering thought is actually the current expanded hover top path and the given path is its parent. */
  const isParentOfCurrentExpandedTop = () => expandHoverTopPath && equalPath(hoveringPath, expandHoverTopPath)

  const newExpandHoverPath = rootedParentOf(state, hoveringPath)

  /** Check if current expand hover top is same as the hovering path. */
  const isSameExpandHoverTopPath = (newExpandTopPath: Path) =>
    expandHoverTopPath && equalPath(expandHoverTopPath, newExpandTopPath)

  return (
    newExpandHoverPath &&
    !isSameExpandHoverTopPath(newExpandHoverPath) &&
    (isParentOfFirstVisibleThought || isParentOfCurrentExpandedTop())
  )
}

/**
 * Handles expansion due to hover on one of its children thought drop.
 * On expand the context and its hidden children should be visible.
 */
const expandOnHoverTop = (): Thunk => (dispatch, getState) => {
  const state = getState()

  const { hoveringPath, expandHoverTopPath, dragInProgress } = state
  const shouldExpand = shouldAllowActiveHoverTop(state)

  // Cancel only when drag is not in progress and there is no active expandHoverTopPath
  if (!dragInProgress && expandHoverTopPath) {
    clearTimer()
    dispatch({ type: 'expandHoverTop', path: null })
    return
  } else if (!shouldExpand) {
    clearTimer()
    return
  }

  // Note: expandHoverPath is the parent of the hovering path (thought drop)
  // hoveringPath already checked in shouldAllowActiveHoverTop
  dispatch(expandHoverTopDebounced(rootedParentOf(state, hoveringPath!)))
}

export default expandOnHoverTop
