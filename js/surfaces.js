class Surface {

	getPosition(u,v){
        
        var x=(u-0.5)*5;
        var z=(v-0.5)*5;
        return vec3.fromValues(x,0,z);

    }

    getNormal(u,v){

        var delta=0.05;
        var p1=this.getPosition(u,v);
        var p2=this.getPosition(u,v+delta);
        var p3=this.getPosition(u+delta,v);

        var v1=vec3.fromValues(p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]);
        var v2=vec3.fromValues(p3[0]-p1[0],p3[1]-p1[1],p3[2]-p1[2]);

        vec3.normalize(v1,v1);
        vec3.normalize(v2,v2);
        
        var n=vec3.create();
        vec3.cross(n,v1,v2);
        vec3.scale(n,n,-1);
        
        return n;

    }

}

class Sphere extends Surface{

    getPosition(u,v){

        var x = Math.cos(v*Math.PI-Math.PI/2)*Math.sin(u*(Math.PI*2));
        var y = Math.sin(v*Math.PI-Math.PI/2);
        var z = Math.cos(v*Math.PI-Math.PI/2)*Math.cos(u*(Math.PI*2));
        return vec3.fromValues(x,y,z);

    }

}
