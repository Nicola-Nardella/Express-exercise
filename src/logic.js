import _ from 'lodash'
import jsonfile from 'jsonfile'

import SegmentDefinition from './segmentDefinition'

const db = 'src/db.json'

const _getSpace = () => jsonfile.readFileSync(db).space
// check if two array have at least 2 common points, if so they are on the same line
function arrayContainsArray (superset, subset) {
  if (subset.length === 0) {
    return false
  }
  let counter = 0
  _.forEach(superset, s => {
    if (_.includes(subset, s)) {
      counter++
    }
  })
  return counter >= 2
}

function pointExist (point) {
  let exist = false
  _getSpace().forEach(p => {
    if (JSON.stringify(p) === JSON.stringify(point)) {
      exist = true
    }
  })
  return exist
}

function getSegments (space, n) {
  const result = []
  const allGroupSegments = []
  const orderedSpace = _.orderBy(space, ['x', 'y'])
  // get all grouped segments, grouped by angle and first point
  for (let i = 0; i < orderedSpace.length; i++) {
    let arraySegmentDefinition = []
    for (let j = i+1 ; j < orderedSpace.length; j++) {
      const angleRadians = Math.atan2(orderedSpace[i].y - orderedSpace[j].y, orderedSpace[i].x - orderedSpace[j].x)
      arraySegmentDefinition.push(
        new SegmentDefinition({
          p1: orderedSpace[i],
          p2: orderedSpace[j],
          angle: angleRadians
        })
      )
    }
    const groupSameAngleSegment = _.groupBy(arraySegmentDefinition, seg => seg.angle)
    allGroupSegments.push(groupSameAngleSegment)
  }

  allGroupSegments.forEach(group => _.values(group).forEach(seg => {
    if (seg && seg.length) {
      if (seg.length >= n - 1) {
        const segments = seg.map(s => ([s.p1, s.p2]))
        const segment = _.sortBy((_.uniqWith(_.flattenDeep(segments), _.isEqual)), ['x', 'y'])
        return result.push(segment)
      }
    }
  }))
  let sortedResult = _.sortBy(result, r => -r.length)

  const container = []
  for (let i = 0; i < sortedResult.length; i++) {
    for (let j = i+1; j < sortedResult.length; j++) {
      const isSubset = arrayContainsArray(sortedResult[i], sortedResult[j])
      if (isSubset) {
        sortedResult[i] = _.unionWith(sortedResult[i], sortedResult[j], _.isEqual)
        _.remove(sortedResult, s => s === sortedResult[j])
      }
    }
    container.push(sortedResult[i])
  }
  return container
}

export default {
  removeSpace: () => {
    const emptySpace = {space: []}
    jsonfile.writeFileSync(db, emptySpace)
  },

  getSpace: () => {
    let response = _getSpace()
    if (_.isEmpty(response)) {
      response = `The space is empty, add your first point.`
    }
    return response
  },

  getLines: (n) => {
    const space = _getSpace()
    if (n < 2) {
      return 'You need at least 2 points to get lines with collinear points.'
    }
    let response = getSegments(space, n)
    if (_.isEmpty(response)) {
      response = `No line segments passing through ${n} points.`
    }
    return response
  },

  addPoint: (point) => {
    const {space} = jsonfile.readFileSync(db)
    const pointString = JSON.stringify(point)
    // used regex for validate input point
    const isValidPoint = /{"x":\d*\.?\d,"y":\d*\.?\d}/.test(pointString)
    if (pointExist(point)) {
      return `Point ${pointString} already exist. Please add different point.`
    }
    if (isValidPoint) {
      space.push(point)
      jsonfile.writeFileSync(db, {space})
      return `Added point ${pointString} to the space.`
    }
    return 'Wrong point format! Expected {x:num[optional: .num],y:num[optional: .num]}'
  }
}
