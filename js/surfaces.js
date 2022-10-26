class CubicBezier {

    controlPoints = [];

    constructor(controlPoints){
        this.controlPoints = controlPoints;
        var first = controlPoints[0];
        for (var i = 0; i < this.controlPoints.length; i++){
            controlPoints[i] = [controlPoints[i][0]-first[0], controlPoints[i][1]-first[1]];
        }
    }

    getSections(){
        return (this.controlPoints.length - 1)/3;
    }


    getPosition(u){

        if(u >= this.getSections()){
            throw 'Not enough sections!';
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
            //var z = ((1-t)**3) * p0[2] + 3*t*((1-t)**2) * p1[2] + 3*(t**2)*(1-t) * p2[2] + (t**3) * p3[2];

            var posVec = vec2.fromValues(x,y);

            return posVec;

        }

    }

    getTangent(u){

        if(u >= this.getSections()){
            throw 'Not enough sections!';
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
            //var z = -3*((1-t)**2) * p0[2] + 3*(3*(t**2)-4*t+1) * p1[2] + 3*(2-3*t)*t * p2[2] + 3*(t**2) * p3[2];

            var tangVec = vec2.fromValues(x,y);
            vec2.normalize(tangVec,tangVec);

            return tangVec;

        }

    }

    getNormal(u){

        if(u >= this.getSections()){
            throw 'Not enough sections!';
        }
        else{

            //var i = Math.trunc(u);
            //var t = u - i;

            //var p0 = this.controlPoints[0+3*i];
            //var p1 = this.controlPoints[1+3*i];
            //var p2 = this.controlPoints[2+3*i];
            //var p3 = this.controlPoints[3+3*i];

            //var x = 6*(1-t) * p0[0] + 6*(3*t-2) * p1[0] + 6*(1-3*t) * p2[0] + 6*t * p3[0];
            //var y = 6*(1-t) * p0[1] + 6*(3*t-2) * p1[1] + 6*(1-3*t) * p2[1] + 6*t * p3[1];
            //var z = 6*(1-t) * p0[2] + 6*(3*t-2) * p1[2] + 6*(1-3*t) * p2[2] + 6*t * p3[2];

            var tang = this.getTangent(u);
            var normVec = vec2.fromValues(-tang[1],tang[0]);
            vec2.normalize(normVec,normVec);

            return normVec;

        }

    }

}

class CurveSampler {

    curve;

    constructor(curve){
        this.curve = curve;
    }

    samplePoints(pointsPerSection){

        var sections = this.curve.getSections();

        var posVectors = [];
        var tangVectors = [];
        var normVectors = [];

        for(var i = 0; i < sections; i++){
            for(var k = 0; k < pointsPerSection; k++){

                var posVec = this.curve.getPosition(i+k/pointsPerSection);
                var tangVec = this.curve.getTangent(i+k/pointsPerSection);
                var normVec = this.curve.getNormal(i+k/pointsPerSection);

                posVectors.push(posVec);
                tangVectors.push(tangVec);
                normVectors.push(normVec);

            }
        }

        return {
            posVectors,
            tangVectors,
            normVectors
        }

    }



}

class Surface {

    rows = 50;
    cols = 50;

    calculatePos(u,v){

        var x=(u-0.5)*5;
        var z=(v-0.5)*5;
        return vec3.fromValues(x,0,z);

    }

    calculateNorm(u,v){

        var delta=0.05;
        var p1=this.calculatePos(u,v);
        var p2=this.calculatePos(u,v+delta);
        var p3=this.calculatePos(u+delta,v);

        var v1=vec3.fromValues(p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]);
        var v2=vec3.fromValues(p3[0]-p1[0],p3[1]-p1[1],p3[2]-p1[2]);

        vec3.normalize(v1,v1);
        vec3.normalize(v2,v2);
        
        var n=vec3.create();
        vec3.cross(n,v1,v2);
        vec3.scale(n,n,-1);
        
        return n;

    }

	getPositionBuffer(posMat){

        var positionBuffer = [];
        
        for (var i=0; i <= this.rows; i++) {
            for (var j=0; j <= this.cols; j++) {

                var u = j/this.cols;
                var v = i/this.rows;

                var p = this.calculatePos(u,v);
                var pos = vec4.fromValues(p[0],p[1],p[2],1.0);
                vec4.transformMat4(pos,pos,posMat);

                positionBuffer.push(pos[0]);
                positionBuffer.push(pos[1]);
                positionBuffer.push(pos[2]);


            }
        }

        return positionBuffer;

    }

    getNormalBuffer(normMat){

        var normalBuffer = [];

        for (var i=0; i <= this.rows; i++) {
            for (var j=0; j <= this.cols; j++) {

                var u = j/this.cols;
                var v = i/this.rows;

                var n = this.calculateNorm(u,v);
                var nrm = vec4.fromValues(n[0],n[1],n[2],1.0);
                vec4.transformMat4(nrm,nrm,normMat);

                var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                vec3.normalize(normalVec,normalVec);

                normalBuffer.push(normalVec[0]);
                normalBuffer.push(normalVec[1]);
                normalBuffer.push(normalVec[2]);

            }
        }

        return normalBuffer;

    }

    getIndexBuffer(){

        var indexBuffer = [];

        for (var i=0; i < this.rows; i++) {

            indexBuffer.push(i*(this.cols+1));
            indexBuffer.push((i+1)*(this.cols+1));

            for (var j=0; j < this.cols; j++) {
                indexBuffer.push(i*(this.cols+1)+(j+1));
                indexBuffer.push((i+1)*(this.cols+1)+(j+1));
            }

            if(i < this.rows - 1){
               indexBuffer.push((i+1)*(this.cols+1)+this.cols);
               indexBuffer.push((i+1)*(this.cols+1));
            }

        }

        return indexBuffer;

    }

}

class SweepSurface extends Surface{

    curveSampler;
    vectors;

    constructor(curve){
        super();
        this.curveSampler = new CurveSampler(curve);
        this.vectors = this.curveSampler.samplePoints(10);
        this.rows = this.vectors.posVectors.length;
        this.cols = 50;
    }

    getPositionBuffer(posMat){

        var positionBuffer = [];
        
        for (var i=0; i < this.rows; i++) {
            for (var j=0; j < this.cols; j++) {

                var p = this.vectors.posVectors[i];
                var pos = vec4.fromValues(p[0],0,p[1],1.0);
                var m = mat4.create();
                mat4.rotateZ(m,m,(j*2*Math.PI/this.cols));
                mat4.mul(m,posMat,m);
                vec4.transformMat4(pos,pos,m);

                positionBuffer.push(pos[0]);
                positionBuffer.push(pos[1]);
                positionBuffer.push(pos[2]);



            }
        }

        return positionBuffer;

    }

    getNormalBuffer(normMat){

        var normalBuffer = [];

        for (var i=0; i < this.rows; i++) {
            for (var j=0; j < this.cols; j++) {

                var n = this.vectors.normVectors[i];
                var nrm = vec4.fromValues(n[0],1.0,n[1],1.0);
                var m = mat4.create();
                mat4.rotateZ(m,m,(j*2*Math.PI/this.cols));
                mat4.mul(m,normMat,m);
                vec4.transformMat4(nrm,nrm,m);

                var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                vec3.normalize(normalVec,normalVec);

                normalBuffer.push(normalVec[0]);
                normalBuffer.push(normalVec[1]);
                normalBuffer.push(normalVec[2]);

            }
        }

        return normalBuffer;

    }

    getIndexBuffer(){

        var indexBuffer = [];

        for (var i=0; i < this.rows -1; i++) {

            indexBuffer.push(i*(this.cols));
            indexBuffer.push((i+1)*(this.cols));

            for (var j=0; j < this.cols; j++) {
                indexBuffer.push(i*(this.cols)+(j+1));
                indexBuffer.push((i+1)*(this.cols)+(j+1));
            }

            if(i < this.rows - 2){
               indexBuffer.push((i+1)*(this.cols)+this.cols-1);
               indexBuffer.push((i+1)*(this.cols));
            }

        }

        indexBuffer.pop();

        return indexBuffer;

    }

}

class Sphere extends Surface{

    calculatePos(u,v){

        var x = Math.cos(v*Math.PI-Math.PI/2)*Math.sin(u*(Math.PI*2));
        var y = Math.sin(v*Math.PI-Math.PI/2);
        var z = Math.cos(v*Math.PI-Math.PI/2)*Math.cos(u*(Math.PI*2));
        return vec3.fromValues(x,y,z);

    }

}
