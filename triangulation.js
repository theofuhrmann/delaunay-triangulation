/**
 TODO Replace this by your own, correct, triangulation function
 Triangles should be return as arrays of array of indexes
 e.g., [[1,2,3],[2,3,4]] encodes two triangles, where the indices are relative to the array points
**/

function max(a, b) {
    if (a >= b) return a;
    return b;
}

function min(a, b) {
    if (a <= b) return a;
    return b;
}

function computeEnclosingTriangle(points) {
    /* to create the enclosing triangle we will compute the bounding box of
    the set of points and use the bottom-left vertex of the box as a 90º angle
    for the triangle, its hypotenuse will be a segment of slope -1 that goes
    through the upper-right vertex of the box */
    xmin = points[0].x;
    ymin = points[0].y;
    xmax = points[0].x;
    ymax = points[0].y;
    for (i = 1; i < points.length; i++) {
        xmin = min(xmin, points[i].x);
        ymin = min(ymin, points[i].y);
        xmax = max(xmax, points[i].x);
        ymax = max(ymax, points[i].y);
    }

    enclosingTrianglePoints = new Array(3);
    enclosingTrianglePoints[0] = {'x':xmin - 5, 'y':ymin - 5, 'z':0.0};
    offset = ymax - ymin; // to obtain the -1 slope
    enclosingTrianglePoints[1] = {'x':(xmax + offset) + 5, 'y':ymin - 5, 'z':0.0};
    enclosingTrianglePoints[2] = {'x':xmin - 5, 'y':(-xmin + ymax + xmax) + 5, 'z':0.0};

    return enclosingTrianglePoints;
}

function computeTriangulation(points, boundaries) {
    // we compute the enclosing triangle points
    enclosingTrianglePoints = computeEnclosingTriangle(points);
    /* we add the enclosing triangle points to the beginning of the points'
    array in a clockwise order */
    for (var i = 0; i < enclosingTrianglePoints.length; i++) {
        points.unshift(enclosingTrianglePoints[i]);
    }

    /* we add the the enclosing triangle boundaries as single point connected
    components */
    for (var i = 0; i < boundaries.length; i++) {
        let cc = boundaries[i];
        for (var j = 0; j < cc.length; j++) boundaries[i][j] += 3;
    }
    for (var i = 2; i >= 0; i--) boundaries.unshift([i]);

    /* we create the DCEL containing the enclosing triangle points and the
    boundaries */
    let dcel = new DCELDelaunay(points, boundaries);
    // we incrementally add the points to the DCEL
    for (var i = 3; i < points.length; i++) dcel.addVertex(i);
    outputTriangles = dcel.outputTriangles();
	return [outputTriangles, dcel];
}
