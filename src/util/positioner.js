/* eslint-disable no-mixed-operators */

const oppositeDockMap = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right'
};

export function oppositeDock(dock) {
  return oppositeDockMap[dock];
}

export function createRect(top = 0, left = 0, width = 0, height = 0) {
  return {
    top,
    right: left + width,
    bottom: top + height,
    left,
    width,
    height
  };
}

export function getDockCenterPoint(rect, dock) {
  let top;
  let left;
  if (dock === 'top') {
    top = rect.top;
    left = rect.left + rect.width / 2;
  } else if (dock === 'right') {
    top = rect.top + rect.height / 2;
    left = rect.right;
  } else if (dock === 'left') {
    top = rect.top + rect.height / 2;
    left = rect.left;
  } else {
    top = rect.bottom;
    left = rect.left + rect.width / 2;
  }
  return {
    top,
    left
  };
}

export function tryPosition(rect, withinRect) {
  const left = rect.left >= withinRect.left;
  const right = rect.right <= withinRect.right;
  const top = rect.top >= withinRect.top;
  const bottom = rect.bottom <= withinRect.bottom;

  return {
    left,
    right,
    top,
    bottom
  };
}

export function createTryRect(elemRect, toPosition, dock, offset) {
  let top;
  let left;
  if (dock === 'top') {
    top = toPosition.top - elemRect.height - offset;
    left = toPosition.left - elemRect.width / 2;
  } else if (dock === 'right') {
    top = toPosition.top - elemRect.height / 2;
    left = toPosition.left + offset;
  } else if (dock === 'left') {
    top = toPosition.top - elemRect.height / 2;
    left = toPosition.left - elemRect.width - offset;
  } else {
    top = toPosition.top + offset;
    left = toPosition.left - elemRect.width / 2;
  }

  return createRect(top, left, elemRect.width, elemRect.height);
}

export function tryDock(elemRect, alignToRect, windowRect, dock, options = {}) {
  const {
    offset = 0,
    minWindowOffset = 0,
    minEdgeOffset = 0
  } = options;

  const windowOffsetRect = createRect(
    windowRect.top + minWindowOffset,
    windowRect.left + minWindowOffset,
    windowRect.width - minWindowOffset * 2,
    windowRect.height - minWindowOffset * 2
  );

  const toPosition = getDockCenterPoint(alignToRect, dock);
  const tryRect = createTryRect(elemRect, toPosition, dock, offset);
  let fitResult = tryPosition(tryRect, windowOffsetRect);
  if (dock === 'top' || dock === 'bottom') {
    if (!fitResult.left) {
      tryRect.left = Math.min(windowOffsetRect.left, toPosition.left - minEdgeOffset);
      tryRect.right = tryRect.left + tryRect.width;
      fitResult = tryPosition(tryRect, windowOffsetRect);
    }
    if (!fitResult.right) {
      tryRect.right = Math.max(windowOffsetRect.right, toPosition.left + minEdgeOffset);
      tryRect.left = tryRect.right - tryRect.width;
      fitResult = tryPosition(tryRect, windowOffsetRect);
    }
  } else {
    if (!fitResult.top) {
      tryRect.top = Math.min(windowOffsetRect.top, toPosition.top - minEdgeOffset);
      tryRect.bottom = tryRect.top + tryRect.height;
      fitResult = tryPosition(tryRect, windowOffsetRect);
    }
    if (!fitResult.bottom) {
      tryRect.bottom = Math.max(windowOffsetRect.bottom, toPosition.top + minWindowOffset);
      tryRect.top = tryRect.bottom - tryRect.height;
      fitResult = tryPosition(tryRect, windowOffsetRect);
    }
  }

  return {
    fits: fitResult.top && fitResult.right && fitResult.bottom && fitResult.left,
    dock,
    position: {
      left: tryRect.left,
      top: tryRect.top
    },
    toPosition: getDockCenterPoint(alignToRect, dock)
  };
}

export function positionToRect(element, rect, dock = 'bottom', options = {}) {
  const elemRect = element.getBoundingClientRect();
  const scrollTop = document.body.scrollTop;
  const scrollLeft = document.body.scrollLeft;
  const windowRect = createRect(
    -scrollTop,
    -scrollLeft,
    document.body.scrollWidth,
    document.body.scrollHeight
  );

  const docks = Array.isArray(dock) ? dock : [dock];
  let firstResult = null;
  for (let i = 0; i < docks.length; i++) {
    const result = tryDock(elemRect, rect, windowRect, docks[i], options);
    result.position.top += scrollTop;
    result.toPosition.top += scrollTop;
    result.position.left += scrollLeft;
    result.toPosition.left += scrollLeft;
    if (result.fits) {
      return result;
    }
    if (i === 0) {
      firstResult = result;
    }
  }
  // If no fit is found - return the first position
  return firstResult;
}

export function positionToElement(element, alignToElement, dock = 'bottom', options = {}) {
  const rect = alignToElement.getBoundingClientRect();
  return positionToRect(element, rect, dock, options);
}

export function positionToCoordinate(element, x, y, dock = 'bottom', options = {}) {
  const rect = {
    top: y,
    bottom: y,
    left: x,
    right: x,
    width: 0,
    height: 0
  };
  return positionToRect(element, rect, dock, options);
}
