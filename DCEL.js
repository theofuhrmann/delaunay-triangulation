class DCEL {
    constructor(points) {

        let nPoints = points.length;

        this.vertexTable = new Array(nPoints); // num of vertices
        this.faceTable = new Array(nPoints - 2); // max num of faces
        this.edgeTable = new Array(3*nPoints - 6); // upperbound of # edges

        // initialisation the vertexTable
        for (i = 0; i < nPoints; i++) {
            this.vertexTable[i] = { coordinates: points[i] }
        }

        /* we will use these counters to keep track of the indexes when updating
        the tables */
        this.faceCount = 0;
        this.edgeCount = 0;
    }

    // GETTERS ---------------------------------------------------------------

    // vertex
    getVertexCoordinates(index) {
        return this.vertexTable[index].coordinates;
    }

    getEdgeFromVertex(index) {
        return this.vertexTable[index].edgeIndex;
    }

    // face
    getEdgeFromFace(index) {
        return this.faceTable[index];
    }

    getVerticesFromFace(index) {
        let vertices = new Set();
        // we obtain the edge associated to the face
        let faceEdge = this.getEdgeFromFace(index);
        // we add the two vertices from that edge in clockwise order
        let clockwise = this.isClockwise(faceEdge, index);
        if (clockwise) {
            vertices.add(this.getBeginningVertexFromDCEL(faceEdge));
            vertices.add(this.getEndVertexFromDCEL(faceEdge));
        } else {
            vertices.add(this.getEndVertexFromDCEL(faceEdge));
            vertices.add(this.getBeginningVertexFromDCEL(faceEdge));
        }
        /* to find the remaining vertex, we look if the face is to the left or
        right of faceEdge, this allows us to look at the previous and next edge
        of faceEdge and add the vertex from whichever shares the same face with
        faceEdge */
        let sharedEdge;
        if (clockwise) {
            sharedEdge = this.getNextEdgeFromDCEL(faceEdge);
        } else {
            sharedEdge = this.getPreviousEdgeFromDCEL(faceEdge);
        }
        /* finally we can add both vertices of the shared edge because of the
        set property */
        vertices.add(this.getBeginningVertexFromDCEL(sharedEdge));
        vertices.add(this.getEndVertexFromDCEL(sharedEdge));

        return Array.from(vertices);
    }

    getEdgesFromFace(index) {
        let edges = new Array(3);
        // we start with the edge associated to the face
        edges[0] = this.getEdgeFromFace(index);
        // we proceed to retrieve the remaining edges in clockwise order
        // if the first edge has the face to its left
        if (this.getRightFaceFromDCEL(edges[0]) == index) {
            edges[1] = this.getNextEdgeFromDCEL(edges[0]);
            // if the second edge starts where the first one ends
            if (this.getEndVertexFromDCEL(edges[0]) ==
            this.getBeginningVertexFromDCEL(edges[1])) {
                // the remaining edge is the next one
                edges[2] = this.getNextEdgeFromDCEL(edges[1]);
            } else {
                edges[2] = this.getPreviousEdgeFromDCEL(edges[1]);
            }
        } else {
            // we find them the other way around
            edges[1] = this.getPreviousEdgeFromDCEL(edges[0]);
            if (this.getEndVertexFromDCEL(edges[1]) ==
            this.getBeginningVertexFromDCEL(edges[0])) {
                edges[2] = this.getPreviousEdgeFromDCEL(edges[1]);
            } else {
                edges[2] = this.getNextEdgeFromDCEL(edges[1]);
            }
        }
        return edges;
    }

    // edges
    getBeginningVertexFromDCEL(index) {
        return this.edgeTable[index].beginningVertexIndex;
    }

    getEndVertexFromDCEL(index) {
        return this.edgeTable[index].endVertexIndex;
    }

    getLeftFaceFromDCEL(index) {
        return this.edgeTable[index].leftFaceIndex;
    }

    getRightFaceFromDCEL(index) {
        return this.edgeTable[index].rightFaceIndex;
    }

    getPreviousEdgeFromDCEL(index) {
        return this.edgeTable[index].previousEdgeIndex;
    }

    getNextEdgeFromDCEL(index) {
        return this.edgeTable[index].nextEdgeIndex;
    }

    getOtherFaceFromDCEL(edgeIndex, faceIndex) {
        let face = this.getRightFaceFromDCEL(edgeIndex);
        if (face == faceIndex) face = this.getLeftFaceFromDCEL(edgeIndex);
        return face;
    }

    // UPDATES -----------------------------------------------------

    updateTables(vertexIndex, faceIndex, vertices) {
        // we add the new vertex to the vertexTable
        this.vertexTable[vertexIndex].edgeIndex = this.edgeCount;
        // we obtain the edges surrounding the face
        let faceEdges = this.getEdgesFromFace(faceIndex);
        // we add the edges and faces to the edgeTable and faceTable
        let originalEdgeCount = this.edgeCount;
        for (i = 0; i < 3; i++) {
            this.edgeTable[this.edgeCount] = {
                beginningVertexIndex: vertexIndex,
                endVertexIndex: vertices[i],
                previousEdgeIndex: originalEdgeCount + this.mod((i-1), 3),
                nextEdgeIndex: faceEdges[i],
            }
            this.edgeCount += 1;
            // we also update the edges of the original face
            let newEdge = originalEdgeCount + this.mod((i+1), 3);
            let clockwise = this.isClockwise(faceEdges[i], faceIndex);
            if (clockwise) {
                this.edgeTable[faceEdges[i]].nextEdgeIndex = newEdge;
            } else {
                this.edgeTable[faceEdges[i]].previousEdgeIndex = newEdge;
            }
            // we avoid the face update of the original faceEdge
            if (i != 0) {
                this.faceTable[this.faceCount] = originalEdgeCount + 2;
                if (clockwise) {
                    this.edgeTable[faceEdges[i]].rightFaceIndex = this.faceCount;
                } else {
                    this.edgeTable[faceEdges[i]].leftFaceIndex = this.faceCount;
                }
                this.faceCount += 1;
            }
        }
        // we update the edges containing the original face
        this.edgeTable[this.edgeCount - 3].leftFaceIndex = this.faceCount - 1;
        this.edgeTable[this.edgeCount - 3].rightFaceIndex = faceIndex;

        this.edgeTable[this.edgeCount - 2].leftFaceIndex = faceIndex;
        this.edgeTable[this.edgeCount - 2].rightFaceIndex = this.faceCount - 2;

        this.edgeTable[this.edgeCount - 1].leftFaceIndex = this.faceCount - 2;
        this.edgeTable[this.edgeCount - 1].rightFaceIndex = this.faceCount - 1;
    }


    shiftEdge(face1, face2, edge) {
        // we find the vertices corresponding to the shared edge
        let beginningVertex = this.getBeginningVertexFromDCEL(edge);
        let endingVertex = this.getEndVertexFromDCEL(edge);
        // we find the vertex opposite to the shared edge of both faces
        let faceVertices1 = this.getVerticesFromFace(face1);
        let oppositeVertex1 = faceVertices1.filter(v => v != beginningVertex
        && v != endingVertex)[0];

        let faceVertices2 = this.getVerticesFromFace(face2);
        let oppositeVertex2 = faceVertices2.filter(v => v != beginningVertex
        && v != endingVertex)[0];

        // TODO: fix this
        if (faceVertices1.sort().join(',') === faceVertices2.sort().join(',')) return false;

        /* in order to find the new previous and next edges of the swapped
        edge we select the edges that weren't the previous/next of the original
        shared edge nor shared edge itself */
        let upperEdge;
        let lowerEdge;
        let edgeClockwise = this.isClockwise(edge, face1);
        if (edgeClockwise) {
            upperEdge = this.getNextEdgeFromDCEL(edge);
            lowerEdge = this.getPreviousEdgeFromDCEL(edge);
        } else {
            lowerEdge = this.getNextEdgeFromDCEL(edge);
            upperEdge = this.getPreviousEdgeFromDCEL(edge);
        }
        let otherEdges = [edge, lowerEdge, upperEdge];

        let face1Edges = this.getEdgesFromFace(face1);

        let previousEdge = face1Edges.filter(e => !otherEdges.includes(e))[0];
        let face2Edges = this.getEdgesFromFace(face2);
        let nextEdge = face2Edges.filter(e => !otherEdges.includes(e))[0];

        /* now we update the tables by swaping the shared edge bewteen the two
        faces and updating the rest of the affected faces' edges */

        // we first update the vertices of the shifted edge
        if (edgeClockwise) {
            this.vertexTable[beginningVertex].edgeIndex = lowerEdge;
            this.vertexTable[endingVertex].edgeIndex = upperEdge;
        } else {
            this.vertexTable[beginningVertex].edgeIndex = upperEdge;
            this.vertexTable[endingVertex].edgeIndex = lowerEdge;
        }
        // we then update the rest of edges of both faces
        if (this.isClockwise(upperEdge, face1)) {
            this.edgeTable[upperEdge].nextEdgeIndex = edge;
        } else this.edgeTable[upperEdge].previousEdgeIndex = edge;

        if (this.isClockwise(lowerEdge, face2)) {
            this.edgeTable[lowerEdge].nextEdgeIndex = edge;
        } else this.edgeTable[lowerEdge].previousEdgeIndex = edge;

        if (this.isClockwise(previousEdge, face1)) {
            this.edgeTable[previousEdge].nextEdgeIndex = lowerEdge;
            this.edgeTable[previousEdge].rightFaceIndex = face2;
        } else {
            this.edgeTable[previousEdge].previousEdgeIndex = lowerEdge;
            this.edgeTable[previousEdge].leftFaceIndex = face2;
        }
        if (this.isClockwise(nextEdge, face2)) {
            this.edgeTable[nextEdge].nextEdgeIndex = upperEdge;
            this.edgeTable[nextEdge].rightFaceIndex = face1;
        } else {
            this.edgeTable[nextEdge].previousEdgeIndex = upperEdge;
            this.edgeTable[nextEdge].leftFaceIndex = face1;
        }
        // finally we update the shifted edge
        this.edgeTable[edge] = {
            beginningVertexIndex: oppositeVertex1,
            endVertexIndex: oppositeVertex2,
            previousEdgeIndex: previousEdge,
            nextEdgeIndex: nextEdge,
            rightFaceIndex: face1,
            leftFaceIndex: face2,
        }
        // we update the faceTable setting the new edge as both new faces' edge
        this.faceTable[face1] = edge;
        this.faceTable[face2] = edge;

        return true;
    }

    // SEARCH ----------------------------------------------------------------

    findSurroungingFaces(index) {
        let faces = [];
        let edge = this.getEdgeFromVertex(index);
        // we add the faces counterclockwise
        let nextFace;
        let actualEdge = edge;
        let nextEdge;
        while (nextEdge !== edge) {
            if (this.getBeginningVertexFromDCEL(actualEdge) == index) {
                nextFace = this.getRightFaceFromDCEL(actualEdge);
                nextEdge = this.getPreviousEdgeFromDCEL(actualEdge);
            } else {
                nextFace = this.getLeftFaceFromDCEL(actualEdge);
                nextEdge = this.getNextEdgeFromDCEL(actualEdge);
            }
            faces.push(nextFace);
            actualEdge = nextEdge;
        }
        return faces;
    }

    findIncidentFaces(faceIndex) {
        let incidentFaces = [];
        let incidentEdges = [];

        let edges = this.getEdgesFromFace(faceIndex);
        for (var i = 0; i < edges.length; i++) {
            let otherFace = this.getOtherFaceFromDCEL(edges[i], faceIndex);
            if (otherFace != -1) {
                incidentFaces.push(otherFace);
                incidentEdges.push(edges[i]);
            }
        }
        return [incidentFaces, incidentEdges];
    }

    // EXTRAS ################################################################

    isClockwise(edgeIndex, faceIndex) {
        return (this.getRightFaceFromDCEL(edgeIndex) == faceIndex);
    }

    // ORIENTATION TESTS -----------------------------------------------------

    pointIsVertex(p, t) {

        let t0Coords = this.getVertexCoordinates(t[0]);
        let t1Coords = this.getVertexCoordinates(t[1]);
        let t2Coords = this.getVertexCoordinates(t[2]);

        if ((t0Coords.x === p.x && t0Coords.y === p.y) ||
            (t1Coords.x === p.x && t1Coords.y === p.y) ||
            (t2Coords.x === p.x && t2Coords.y === p.y)) return true;
        return false;
    }

    insideSegment(p, s) {
        if (((s[0].x <= p.x && p.x <= s[1].x) ||
            (s[0].x >= p.x && p.x >= s[1].x)) &&
            ((s[0].y <= p.y && p.y <= s[1].y) ||
            (s[0].y >= p.y && p.y >= s[1].y))) return true;
        return false;
    }

    pointInFace(p, t) {

        let pCoords = this.getVertexCoordinates(p);
        if (this.pointIsVertex(pCoords, t)) {
            return 3;
        }

        let det = new Array(3);
        let allPositive = true;
        let allNegative = true;

        for (var i = 0; i < 3; i++) {

            let tiCoords = this.getVertexCoordinates(t[i]);
            let ti1Coords = this.getVertexCoordinates(t[(i+1) % 3]);

            det[i] = (ti1Coords.x - tiCoords.x)*(pCoords.y - tiCoords.y) -
            (pCoords.x - tiCoords.x)*(ti1Coords.y - tiCoords.y);
            if (det[i] === 0) {
                let segment = [tiCoords, ti1Coords];
                if (this.insideSegment(pCoords, segment)) {
                    return 2;
                }
            }
            if (det[i] < 0) allPositive = false;
            else allNegative = false;
        }
        if (allPositive || allNegative) return 1;
        return 0;
    }

    intersection(s1, s2) {
        let s1from = this.getVertexCoordinates(s1[0]);
        let s1to = this.getVertexCoordinates(s1[1]);
        let s2from = this.getVertexCoordinates(s2[0]);
        let s2to = this.getVertexCoordinates(s2[1]);

        if (this.shareVertex(s1from, s1to, s2from, s2to)) return 3;
        return this.oppositeSides(s1from, s1to, s2from, s2to);
    }

    // TODO check if they are the same line
    shareVertex(s1from, s1to, s2from, s2to) {
        if ((s1from.x === s2from.x && s1from.y === s2from.y)
        || (s1from.x === s2to.x && s1from.y === s2to.y)
        || (s1to.x === s2to.x && s1to.y === s2to.y)
        || (s1to.x === s2from.x && s1to.y === s2from.y)) return true;
        return false;
    }

    discontinuous(s1from, s1to, s2from, s2to) {
        if ((max(s1from.x, s1to.x) < min(s2from.x, s2to.x)) ||
            (min(s1from.x, s1to.x) > max(s2from.x, s2to.x))) return true;
        if ((max(s1from.y, s1to.y) < min(s2from.y, s2to.y)) ||
            (min(s1from.y, s1to.y) > max(s2from.y, s2to.y))) return true;
        return false;
    }

    oppositeSides(s1from, s1to, s2from, s2to) {
        let det1 = (s1to.x - s1from.x)*(s2from.y - s1from.y) -
        (s2from.x - s1from.x)*(s1to.y - s1from.y);
        let det2 = (s1to.x - s1from.x)*(s2to.y - s1from.y) -
        (s2to.x - s1from.x)*(s1to.y - s1from.y);
        // a vertex of the second segment is in the same line as the first one
        if (det1 === 0) {
            // both segments belong to the same line
            if (det2 === 0) {
                // the first segment finishes before the second one starts
                if (this.discontinuous(s1from, s1to, s2from, s2to) === true) return 2;
                // segments do not intersect
                return 0;
            }
            // the first segment finishes before the second one starts
            if (this.discontinuous(s1from, s1to, s2from, s2to) === true) return 1;
            // segments intersect on an edge
            return 2;
        }
        // both vertices of the second segment are on opposite sides of the first one
        if ((det1 < 0 && det2 > 0) || (det1 > 0 && det2 < 0)) {
            let det3 = (s2to.x - s2from.x)*(s1from.y - s2from.y) -
            (s1from.x - s2from.x)*(s2to.y - s2from.y);
            let det4 = (s2to.x - s2from.x)*(s1to.y - s2from.y) -
            (s1to.x - s2from.x)*(s2to.y - s2from.y);
            // segments intersect on an edge
            if (det3 === 0 || det4 === 0) return 2;
            // both segments have both vertices opposite to each other
            if ((det3 < 0 && det4 > 0) || (det3 > 0 && det4 < 0)) return 1;
            // both vertices of the first segment are on the same side of the second one
            return 0;
        }
        // both vertices of the second segment are on the same side of the first one
        return 0;
    }

    pointInCircle(point, circle) {

        let p = this.getVertexCoordinates(point);

        let c = new Array(3);
        for (var i = 0; i < 3; i++) {
            c[i] = this.getVertexCoordinates(circle[i]);
        }

        let mat = [
            [
                c[1].x - c[0].x,
                c[1].y - c[0].y,
                (c[1].x - c[0].x)*(c[1].x + c[0].x) +
                (c[1].y - c[0].y)*(c[1].y + c[0].y)
            ],[
                c[2].x - c[0].x,
                c[2].y - c[0].y,
                (c[2].x - c[0].x)*(c[2].x + c[0].x) +
                (c[2].y - c[0].y)*(c[2].y + c[0].y)
            ],[
                p.x - c[0].x,
                p.y - c[0].y,
                (p.x - c[0].x)*(p.x + c[0].x) +
                (p.y - c[0].y)*(p.y + c[0].y)
            ]
        ];

        let det = math.det(mat);
        if (det === 0) return true;

        mat = [
            [c[0].x, c[0].y, 1],
            [c[1].x, c[1].y, 1],
            [c[2].x, c[2].y, 1]
        ];

        let t_det = math.det(mat);

        if (t_det < 0) det = - det;
        if (det < 0) return true;
        return false;
    }


    // MATH OPERATIONS -------------------------------------------------------

    max(a, b) {
        if (a >= b) return a;
        return b;
    }

    min(a, b) {
        if (a <= b) return a;
        return b;
    }

    mod(x, y) {
        // modulus for negative numbers
        return (x % y + y) % y;
    }
}
