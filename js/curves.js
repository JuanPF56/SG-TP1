class CubicBezier2D {

    controlPoints = [];
    first;
    last;
    center;

    constructor(controlPoints){
        this.controlPoints = controlPoints;
        this.first = controlPoints[0];
        this.last = controlPoints[controlPoints.length-1];
        this.center = [0,0];
        var maxX=0;
        var minX=0;
        var maxY=0;
        var minY=0;
        for (var i = 0; i < this.controlPoints.length; i++){
            if (controlPoints[i][0] > maxX) {maxX = controlPoints[i][0];}
            if (controlPoints[i][0] < minX) {minX = controlPoints[i][0];}
            if (controlPoints[i][1] > maxY) {maxY = controlPoints[i][1];}
            if (controlPoints[i][1] < minY) {minY = controlPoints[i][1];}
        }

        this.center[0] = (Math.abs(maxX-minX))/2;
        this.center[1] = (Math.abs(maxY-minY))/2;
    }

    getFirst(){
        return this.first;
    }

    getLast(){
        return this.last;
    }

    getCenter(){
        return this.center;
    }

    getSections(){
        return (this.controlPoints.length - 1)/3;
    }


    getPosition(u){

        if(u >= this.getSections()){
            throw new Error('Not enough sections!');
        }
        else{

            var i = Math.trunc(u);
            var t = u - i;

            var p0 = this.controlPoints[0+3*i];
            var p1 = this.controlPoints[1+3*i];
            var p2 = this.controlPoints[2+3*i];
            var p3 = this.controlPoints[3+3*i];

            var x = ((1-t)**3) * p0[0] + 3*t*((1-t)**2) * p1[0] + 3*(t**2)*(1-t) * p2[0] + (t**3) * p3[0];
            var y = ((1-t)**3) * p0[1] + 3*t*((1-t)**2) * p1[1] + 3*(t**2)*(1-t) * p2[1] + (t**3) * p3[1];

            var posVec = vec2.fromValues(x,y);

            return posVec;

        }

    }

    getTangent(u){

        if(u >= this.getSections()){
            throw new Error('Not enough sections!');
        }
        else{

            var i = Math.trunc(u);
            var t = u - i;

            var p0 = this.controlPoints[0+3*i];
            var p1 = this.controlPoints[1+3*i];
            var p2 = this.controlPoints[2+3*i];
            var p3 = this.controlPoints[3+3*i];

            var x = -3*((1-t)**2) * p0[0] + 3*(3*(t**2)-4*t+1) * p1[0] + 3*(2-3*t)*t * p2[0] + 3*(t**2) * p3[0];
            var y = -3*((1-t)**2) * p0[1] + 3*(3*(t**2)-4*t+1) * p1[1] + 3*(2-3*t)*t * p2[1] + 3*(t**2) * p3[1];

            var tangVec = vec2.fromValues(x,y);
            vec2.normalize(tangVec,tangVec);

            return tangVec;

        }

    }

    getNormal(u){

        var tang = this.getTangent(u);
        var normVec = vec2.fromValues(-tang[1],tang[0]);
        vec2.normalize(normVec,normVec);

        return normVec;

    }

}

/**

class CubicBezier3D {

    controlPoints = [];

    constructor(controlPoints){
        this.controlPoints = controlPoints;
    }

    getSections(){
        return (this.controlPoints.length - 1)/3;
    }


    getPosition(u){

        if(u >= this.getSections()){
            throw new Error('Not enough sections!');
        }
        else{

            var i = Math.trunc(u);
            var t = u - i;

            var p0 = this.controlPoints[0+3*i];
            var p1 = this.controlPoints[1+3*i];
            var p2 = this.controlPoints[2+3*i];
            var p3 = this.controlPoints[3+3*i];

            var x = ((1-t)**3) * p0[0] + 3*t*((1-t)**2) * p1[0] + 3*(t**2)*(1-t) * p2[0] + (t**3) * p3[0];
            var y = ((1-t)**3) * p0[1] + 3*t*((1-t)**2) * p1[1] + 3*(t**2)*(1-t) * p2[1] + (t**3) * p3[1];
            var z = ((1-t)**3) * p0[2] + 3*t*((1-t)**2) * p1[2] + 3*(t**2)*(1-t) * p2[2] + (t**3) * p3[2];

            var posVec = vec3.fromValues(x,y,z);

            return posVec;

        }

    }

    getTangent(u){

        if(u >= this.getSections()){
            throw new Error('Not enough sections!');
        }
        else{

            var i = Math.trunc(u);
            var t = u - i;

            var p0 = this.controlPoints[0+3*i];
            var p1 = this.controlPoints[1+3*i];
            var p2 = this.controlPoints[2+3*i];
            var p3 = this.controlPoints[3+3*i];

            var x = -3*((1-t)**2) * p0[0] + 3*(3*(t**2)-4*t+1) * p1[0] + 3*(2-3*t)*t * p2[0] + 3*(t**2) * p3[0];
            var y = -3*((1-t)**2) * p0[1] + 3*(3*(t**2)-4*t+1) * p1[1] + 3*(2-3*t)*t * p2[1] + 3*(t**2) * p3[1];
            var z = -3*((1-t)**2) * p0[2] + 3*(3*(t**2)-4*t+1) * p1[2] + 3*(2-3*t)*t * p2[2] + 3*(t**2) * p3[2];

            var tangVec = vec3.fromValues(x,y,z);
            vec3.normalize(tangVec,tangVec);

            return tangVec;

        }

    }

    getNormal(u){

        if(u >= this.getSections()){
            throw new Error('Not enough sections!');
        }
        else{

            var i = Math.trunc(u);
            var t = u - i;

            //var p0 = this.controlPoints[0+3*i];
            //var p1 = this.controlPoints[1+3*i];
            //var p2 = this.controlPoints[2+3*i];
            //var p3 = this.controlPoints[3+3*i];

            //var x = 6*(1-t) * p0[0] + 6*(3*t-2) * p1[0] + 6*(1-3*t) * p2[0] + 6*t * p3[0];
            //var y = 6*(1-t) * p0[1] + 6*(3*t-2) * p1[1] + 6*(1-3*t) * p2[1] + 6*t * p3[1];
            //var z = 6*(1-t) * p0[2] + 6*(3*t-2) * p1[2] + 6*(1-3*t) * p2[2] + 6*t * p3[2];

            var tan1 = this.getTangent(u);
            var tan2 = this.getTangent(u+0.001);

            var normVec = vec3.fromValues(0,0,0);
            vec3.cross(normVec, tan1, tan2);
            vec3.normalize(normVec,normVec);

            return normVec;

        }

    }

    getBiNormal(u){


        var tangVec = this.getTangent(u);
        var normVec = this.getNormal(u);
        var biNormVec = vec3.create();

        vec3.cross(biNormVec, normVec, tangVec);

        vec3.normalize(biNormVec,biNormVec);

        return biNormVec;


    }


}
**/


class CurveSampler {

    curve;

    constructor(curve){
        this.curve = curve;
    }

    samplePoints(pointsPerSection){

        var sections = this.curve.getSections();
        var center = this.curve.getCenter();
        var first = this.curve.getFirst();
        var last = this.curve.getLast();

        var posVectors = [];
        var tangVectors = [];
        var normVectors = [];
        var biNormVectors = [];

        for(var i = 0; i < sections; i++){
            for(var k = 0; k < pointsPerSection; k++){

                var posVec = this.curve.getPosition(i+k/pointsPerSection);
                var tangVec = this.curve.getTangent(i+k/pointsPerSection);
                var normVec = this.curve.getNormal(i+k/pointsPerSection);
                //if(this.curve instanceof CubicBezier3D){
                //    var biNormVec = vec3.fromValues(1,1,1);
                //    vec3.cross(biNormVec, normVec, tangVec);
                //    vec3.normalize(biNormVec,biNormVec);
                //    biNormVectors.push(biNormVec);
                //}

                posVectors.push(posVec);
                tangVectors.push(tangVec);
                normVectors.push(normVec);

            }
        }


        return {
            posVectors,
            tangVectors,
            normVectors,
            center,
            first,
            last
            //biNormVectors
        }

    }



}