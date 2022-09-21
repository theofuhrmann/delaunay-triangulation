class DCELDelaunay extends DCEL {
    constructor(points, boundaries) {
        // we enable access and call functions from the DCEL class
        super(points);
        /* we initialize the tables with the information we have available with
        the enclosing triangle */
        let tPoints = 3;
        // initialisation the vertexTable
        for (i = 0; i < tPoints; i++) {
            this.vertexTable[i] = { edgeIndex: i, coordinates: points[i] };
        }
        // initialisation the faceTable
        this.faceTable[0] = 0;
        this.faceTable[-1] = 0; // the infinite face
        // initialisation the DCEL
        for (i = 0; i < tPoints; i++) {
            let j = (i+1) % tPoints;
            let k = this.mod((i-1), tPoints);
            this.edgeTable[i] = {
                beginningVertexIndex: i,
                endVertexIndex: j,
                leftFaceIndex: -1,
                rightFaceIndex: 0,
                nextEdgeIndex: j,
                previousEdgeIndex: k,
            };
        }
        // we update the counters
        this.faceCount += 1;
        this.edgeCount += 3;
        // we will choose the first original point as the fixedPoint
        this.fixedPoint = 3;
        this.fixedPointCoords = this.getVertexCoordinates(4);
    }

    // FIXED POINT -----------------------------------------------------------

    findContainingFace(index) {
        let faces = [];
        // we first compute the faces surrounding the fixedPoint
        let surroundingFaces = this.findSurroungingFaces(this.fixedPoint);
        // we declare the segment going from the fixedPoint to the new vertex
        let segment = [this.fixedPoint, index];
        /* we first check if the new vertex is inside any of the surrounding
        faces from the fixedPoint, during the process, if we find an
        intersection between the segment and the face edge opposite to the
        fixedPoint, it means we have to keep walking towards that direction */
        let nextFace = 0;
        let oppositeEdge;
        for (var i = 0; i < surroundingFaces.length; i++) {
            let face = surroundingFaces[i];
            let faceVertices = this.getVerticesFromFace(face);
            // is it in one of the surrounding faces?
            let pointInFace = this.pointInFace(index, faceVertices);
            if (pointInFace == 1 || pointInFace == 2) {
                return [face, faceVertices];
            }
            else {
                /* if the point isn't in the surrounding face, we look if the
                segment intersects with the opposite edge in the face of the
                fixedPoint */
                let edgeSegment = faceVertices.filter(v => v != this.fixedPoint);
                let intersection = this.intersection(edgeSegment, segment);
                if (intersection == 1) {
                    /* there is an intersection, we find the next face we have
                    to check and we keep the search out of the loop */
                    let faceEdges = this.getEdgesFromFace(face);
                    for (i = 0; i < faceEdges.length; i++) {
                        oppositeEdge = faceEdges[i];
                        if (this.getBeginningVertexFromDCEL(oppositeEdge) != this.fixedPoint
                        && this.getEndVertexFromDCEL(oppositeEdge) != this.fixedPoint) break;
                    }
                    nextFace = this.getOtherFaceFromDCEL(oppositeEdge, face);
                    break;
                }
            }
        }
        // we have found the next face to go to, so we keep walking down the line
        return this.recursiveLineWalk(oppositeEdge, nextFace, index);
    }

    recursiveLineWalk(intersectingEdge, face, index, segment) {
        /* we walk through the line by checking all the faces contained in its
        zone and return the one that has the point */
        let faceVertices = this.getVerticesFromFace(face);
        let pointInFace = this.pointInFace(index, faceVertices);
        if (pointInFace == 1 || pointInFace == 2) return [face, faceVertices];
        else {
            // we find the edges we need to check for intersections
            let oppositeEdges = this.getEdgesFromFace(face).filter(
                e => e != intersectingEdge);
            /* we define the segments of the edges with their corresponding
            vertices */
            let oppositeEdgeSegments = [
                [this.getBeginningVertexFromDCEL(oppositeEdges[0]),
                this.getEndVertexFromDCEL(oppositeEdges[0])],
                [this.getBeginningVertexFromDCEL(oppositeEdges[1]),
                this.getEndVertexFromDCEL(oppositeEdges[1])]];
            /* we define the segment of the intersectingEdge with its
            corresponding vertices */
            let intersectingVertices = [
                this.getBeginningVertexFromDCEL(intersectingEdge),
                this.getEndVertexFromDCEL(intersectingEdge)];
            // we check the intersections between the edges and the segment line
            let segment = [this.fixedPoint, index];
            let intersection = this.intersection(oppositeEdgeSegments[0], segment);
            if (intersection == 1 || intersection == 2) {
                let nextFace = this.getOtherFaceFromDCEL(oppositeEdges[0], face);
                return this.recursiveLineWalk(oppositeEdges[0], nextFace, index);
            } else { // it intersects with the other edge
                let nextFace = this.getOtherFaceFromDCEL(oppositeEdges[1], face);
                return this.recursiveLineWalk(oppositeEdges[1], nextFace, index);
            }
        }
    }

    checkIfDelaunay(index) {
        // we gather the incident faces of the newly added vertex
        let incidentFaces = this.findSurroungingFaces(index);
        while (incidentFaces.length != 0) {
            let incidentFace = incidentFaces.shift();
            let incidentFaceEdges = this.getEdgesFromFace(incidentFace);
            /* we select the edge connecting the incident face and the adjacent
            face */
            let sharedEdge = incidentFaceEdges.filter(e =>
                this.edgeTable[e].beginningVertexIndex != index &&
                this.edgeTable[e].endVertexIndex != index)[0];
            let adjFace = this.getOtherFaceFromDCEL(sharedEdge, incidentFace);
            // if that face isn't the infinite face
            if (adjFace != -1) {
                let adjFaceVertices = this.getVerticesFromFace(adjFace);
                // we check if the Delaunay condition holds
                if (this.pointInCircle(index, adjFaceVertices)) {
                    /* if it doesn't we shift the shared edge and we add the
                    resulting modified faces to the checking list */
                    let shifted = this.shiftEdge(incidentFace, adjFace, sharedEdge);
                    if (shifted) incidentFaces.unshift(incidentFace, adjFace);
                }
            }
        }
    }

    // ADDING VERTICES -------------------------------------------------------

    addVertex(index) {
        // we find the face containing the new vertex
        const [face, vertices] = this.findContainingFace(index);
        //let [incidentFaces, edges] = this.findIncidentFaces(face);
        this.updateTables(index, face, vertices);
        // once we update the tables with the new added vertex we check if the
        // Delaunay rules still hold in the graph
        this.checkIfDelaunay(index);
    }

    // PRUNE BOUNDARIES

    pruneBoundaries() {
        for (var i = 0; i < boundaries.length; i++) {
            let boundary = boundaries[i];
            let boundaryLength = boundary.length;
            if (boundaryLength == 1) {
                // if the connected component has one single point
                this.removeSingleCC(boundary[0]);
            } else {
                // NOT WORKING PROPERLY
                //this.removeMultipleCC(boundary);
            }
        }
    }

    removeSingleCC(index) {
        let ccFaces = this.findSurroungingFaces(index);
        for (var i = 0; i < ccFaces.length; i++) {
            let face = ccFaces[i];
            if (face != -1) {
                this.faceTable[face] = undefined;
                /*let edges = this.getEdgesFromFace(face);
                for (var e = 0; e < edges.length; e++) {
                    let edge = edges[e];
                    if (edge.beginningVertexIndex == index ||
                        edge.endVertexIndex == index) {
                            this.edgeTable[edge] = undefined;
                        }
                }*/
            }
        }
    }

    removeMultipleCC(boundary) {

        for (var i = 0; i < boundary.length; i++) {
            // FIX BUG
            if (i != 250 && i != 249) {
                let currVertex = boundary[i];
                let nextVertex = boundary[this.mod((i+1), boundary.length)];
                // we find the edge corresponding to the vertex in the DCEL
                let currEdge = this.getEdgeFromVertex(currVertex);
                // we find the edge corresponding to the boundary edge between
                // the current vertex and the next boundary vertex
                while((this.getEndVertexFromDCEL(currEdge) != nextVertex)
                        && (this.getBeginningVertexFromDCEL(currEdge) != nextVertex)) {
                    // if the edge points towards other vertex
                    if (this.getBeginningVertexFromDCEL(currEdge) == currVertex) {
                        currEdge = this.getPreviousEdgeFromDCEL(currEdge);
                    } else {
                        currEdge = this.getNextEdgeFromDCEL(currEdge);
                    }
                }
                // we find the next edge, that should be removed
                let nextEdge;
                // if the edge is properly oriented
                if (this.getBeginningVertexFromDCEL(currEdge) == nextVertex) {
                    nextEdge = this.getPreviousEdgeFromDCEL(currEdge);
                    this.faceTable[this.getLeftFaceFromDCEL(nextEdge)] = undefined;
                } else {
                    nextEdge = this.getNextEdgeFromDCEL(currEdge);
                    this.faceTable[this.getRightFaceFromDCEL(nextEdge)] = undefined;
                }
                // we remove both faces of the vertex

                currVertex = nextVertex;
                nextVertex = boundary[this.mod((i+2), boundary.length)];
                // while the next edge we try to remove isn't the next boundary
                // edge we keep removing them
                while (true) {
                    if (this.getBeginningVertexFromDCEL(nextEdge) == currVertex) {
                        nextEdge = this.getPreviousEdgeFromDCEL(nextEdge);
                    } else {
                        nextEdge = this.getNextEdgeFromDCEL(nextEdge);
                    }
                    if ((this.getBeginningVertexFromDCEL(nextEdge) != nextVertex)
                        && (this.getEndVertexFromDCEL(nextEdge) != nextVertex)) {
                            if (this.getBeginningVertexFromDCEL(nextEdge) == currVertex) {
                                this.faceTable[this.getRightFaceFromDCEL(nextEdge)] = undefined;
                            } else {
                                this.faceTable[this.getRightFaceFromDCEL(nextEdge)] = undefined;
                            }
                    } else break;
                }
            }
        }
    }

    // OUTPUT ----------------------------------------------------------------

    outputTriangles() {
        let outputTriangles = [];
        for (var i = 0; i < this.faceTable.length - 1; i++) {
            if(this.faceTable[i] == -1) break;
            if(this.faceTable[i] !== undefined) {
                outputTriangles.push(this.getVerticesFromFace(i));
            }
        }
        return outputTriangles;
    }

    outputTrianglesWithoutBoundaries() {
        this.pruneBoundaries();
        return this.outputTriangles();
    }
}
