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

class RevolutionSurface extends Surface{

    curveSampler;
    vectors;

    constructor(curve,sampleRate,cols){
        super();
        this.curveSampler = new CurveSampler(curve);
        this.vectors = this.curveSampler.samplePoints(sampleRate);
        this.rows = this.vectors.posVectors.length;
        this.cols = cols;
    }

    getPositionBuffer(posMat){

        var positionBuffer = [];
        var first = this.vectors.first;
        var last = this.vectors.last;
        
        for (var i=0; i < this.rows; i++) {
            for (var j=0; j < this.cols; j++) {

                var p = this.vectors.posVectors[i];
                var pos = vec4.fromValues(p[0]-first[0],0.0,p[1]-last[1],1.0);
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
                var nrm = vec4.fromValues(n[0],0.0,n[1],1.0);
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

        for (var i=0; i < this.rows - 1; i++) {

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

class SweepSurface extends Surface{

    shapeCurve;
    pathCurve;
    shapeVectors;
    pathVectors;

    scaleFactor;
    rotationFactor;

    closed;

    constructor(shapeCurve,pathCurve,shapeSampleRate,pathSampleRate,scaleFactor = 0,rotationFactor = 0,height = 1,width = 1,closed = true){
        super();
        this.shapeCurve = new CurveSampler(shapeCurve);
        this.pathCurve = new CurveSampler(pathCurve);
        this.shapeVectors = this.shapeCurve.samplePoints(shapeSampleRate);
        this.pathVectors = this.pathCurve.samplePoints(pathSampleRate);
        this.rows = this.shapeVectors.posVectors.length;
        this.cols = this.pathVectors.posVectors.length;
        this.height = height;
        this.width = width;
        this.scaleFactor = scaleFactor;
        this.rotationFactor = rotationFactor;
        this.closed = closed;
    }

    getPositionBuffer(posMat){

        var positionBuffer = [];
        
        for (var i=0; i < this.cols; i++) {

            var center = this.shapeVectors.center;

            var ppPos = this.pathVectors.posVectors[i];
            var ppTan = this.pathVectors.tangVectors[i];
            var ppNorm = this.pathVectors.normVectors[i];
            var ppBiNorm = vec3.create();
            vec3.cross(ppBiNorm,vec3.fromValues(ppTan[0],ppTan[1],0),vec3.fromValues(ppNorm[0],ppNorm[1],0));

            var pos;
            // matriz de nivel:
            var scalingMat = mat4.create();
            mat4.scale(scalingMat,scalingMat,[this.width,this.height,0]);
            var levelDeformation = mat4.create();
            mat4.rotateZ(levelDeformation,levelDeformation,(i/(this.cols-1))*2*Math.PI*this.rotationFactor);
            mat4.scale(levelDeformation,levelDeformation,[(i*this.scaleFactor+1),(i*this.scaleFactor+1),(i*this.scaleFactor+1)]);
            var m = mat4.fromValues(ppNorm[0],ppNorm[1],0,0,ppBiNorm[0],ppBiNorm[1],ppBiNorm[2],0,ppTan[0],ppTan[1],0,0,ppPos[0],ppPos[1],0,1);
            mat4.mul(levelDeformation,levelDeformation,scalingMat);
            mat4.mul(m,m,levelDeformation);
            mat4.mul(m,posMat,m);

    
            //Tapa 1

            if(i == 0 && this.closed){
                for (var j=0; j < this.rows; j++) {
                    pos = vec4.fromValues(0,0,0,1);
                    vec4.transformMat4(pos,pos,m);
                    positionBuffer.push(pos[0]);
                    positionBuffer.push(pos[1]);
                    positionBuffer.push(pos[2]);
                }
                for (var j=0; j < this.rows; j++) {
                    var sp = this.shapeVectors.posVectors[j];
                    pos = vec4.fromValues(sp[0]-center[0],sp[1]+center[1],0.0,1);  
                    vec4.transformMat4(pos,pos,m);
                    positionBuffer.push(pos[0]);
                    positionBuffer.push(pos[1]);
                    positionBuffer.push(pos[2]);
                }
            }      


            for (var j=0; j < this.rows; j++) {
                
                var sp = this.shapeVectors.posVectors[j];
                pos = vec4.fromValues(sp[0]-center[0],sp[1]+center[1],0.0,1);                
                vec4.transformMat4(pos,pos,m);

                positionBuffer.push(pos[0]);
                positionBuffer.push(pos[1]);
                positionBuffer.push(pos[2]);

            }

            //Tapa 2

            if (i == this.cols - 1 && this.closed){
                for (var j=0; j < this.rows; j++) {
                    var sp = this.shapeVectors.posVectors[j];
                    pos = vec4.fromValues(sp[0]-center[0],sp[1]+center[1],0.0,1);  
                    vec4.transformMat4(pos,pos,m);
                    positionBuffer.push(pos[0]);
                    positionBuffer.push(pos[1]);
                    positionBuffer.push(pos[2]);
                }
                for (var j=0; j < this.rows; j++) {
                    pos = vec4.fromValues(0,0,0,1);
                    vec4.transformMat4(pos,pos,m);
                    positionBuffer.push(pos[0]);
                    positionBuffer.push(pos[1]);
                    positionBuffer.push(pos[2]);
                }
            }  

        }

        return positionBuffer;

    }

    getNormalBuffer(normMat){

        var normalBuffer = [];

        for (var i=0; i < this.cols; i++) {

            var center = this.shapeVectors.center;

            var ppPos = this.pathVectors.posVectors[i];
            var ppTan = this.pathVectors.tangVectors[i];
            var ppNorm = this.pathVectors.normVectors[i];
            var ppBiNorm = vec3.create();
            vec3.cross(ppBiNorm,vec3.fromValues(ppTan[0],ppTan[1],0),vec3.fromValues(ppNorm[0],ppNorm[1],0));

            var nrm;
            // matriz de nivel:
            var levelDeformation = mat4.create();
            mat4.rotateZ(levelDeformation,levelDeformation,(i/(this.cols-1))*2*Math.PI*this.rotationFactor);
            mat4.scale(levelDeformation,levelDeformation,[(i*this.scaleFactor+1),(i*this.scaleFactor+1),(i*this.scaleFactor+1)]);
            var m = mat4.fromValues(ppNorm[0],ppNorm[1],0,0,ppBiNorm[0],ppBiNorm[1],ppBiNorm[2],0,ppTan[0],ppTan[1],0,0,ppPos[0],ppPos[1],0,1);
            mat4.mul(m,m,levelDeformation);
            mat4.invert(m,m);
            mat4.transpose(m,m);
            mat4.mul(m,normMat,m);

            if(i == 0 && this.closed){
                for (var j=0; j < this.rows; j++) {
                    nrm = vec4.fromValues(0,0,-1,1);
                    vec4.transformMat4(nrm,nrm,m);

                    var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                    vec3.normalize(normalVec,normalVec);

                    normalBuffer.push(normalVec[0]);
                    normalBuffer.push(normalVec[1]);
                    normalBuffer.push(normalVec[2]);
                }
                for (var j=0; j < this.rows; j++) {
                    nrm = vec4.fromValues(0,0,-1,1);
                    vec4.transformMat4(nrm,nrm,m);

                    var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                    vec3.normalize(normalVec,normalVec);

                    normalBuffer.push(normalVec[0]);
                    normalBuffer.push(normalVec[1]);
                    normalBuffer.push(normalVec[2]);
                }
            }

            for (var j=0; j < this.rows; j++) {

                var n = this.shapeVectors.normVectors[j];
                var nrm = vec4.fromValues(n[0],n[1],0.0,1.0);
                
                vec4.transformMat4(nrm,nrm,m);

                var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                vec3.normalize(normalVec,normalVec);

                normalBuffer.push(normalVec[0]);
                normalBuffer.push(normalVec[1]);
                normalBuffer.push(normalVec[2]);

            }

            if( i == this.cols - 1 && this.closed){
                for (var j=0; j < this.rows; j++) {
                    nrm = vec4.fromValues(0,0,1,1);
                    vec4.transformMat4(nrm,nrm,m);

                    var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                    vec3.normalize(normalVec,normalVec);

                    normalBuffer.push(normalVec[0]);
                    normalBuffer.push(normalVec[1]);
                    normalBuffer.push(normalVec[2]);
                }
                for (var j=0; j < this.rows; j++) {
                    nrm = vec4.fromValues(0,0,1,1);
                    vec4.transformMat4(nrm,nrm,m);

                    var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                    vec3.normalize(normalVec,normalVec);

                    normalBuffer.push(normalVec[0]);
                    normalBuffer.push(normalVec[1]);
                    normalBuffer.push(normalVec[2]);
                }

            }
        }

        return normalBuffer;

    }

    getIndexBuffer(){

        var indexBuffer = [];

        var a = -2;

        if (this.closed){a=2;}

        for (var i=0; i < this.cols + 1 + a; i++) {

            indexBuffer.push(i*(this.rows));
            indexBuffer.push((i+1)*(this.rows));

            for (var j=0; j < this.rows; j++) {
                indexBuffer.push(i*(this.rows)+(j+1));
                indexBuffer.push((i+1)*(this.rows)+(j+1));
            }

            if(i < this.cols - 2){
               indexBuffer.push((i+1)*(this.rows)+this.rows-1);
               indexBuffer.push((i+1)*(this.rows));
            }

        }

        indexBuffer.pop();


        return indexBuffer;

    }

}

class SphereSurf extends Surface{

    calculatePos(u,v){

        var x = Math.cos(v*Math.PI-Math.PI/2)*Math.sin(u*(Math.PI*2));
        var y = Math.sin(v*Math.PI-Math.PI/2);
        var z = Math.cos(v*Math.PI-Math.PI/2)*Math.cos(u*(Math.PI*2));
        return vec3.fromValues(x,y,z);

    }

}
