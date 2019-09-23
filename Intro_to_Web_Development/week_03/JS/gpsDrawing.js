d3.select("body").select("#svg_01").attr("width","100%").attr("height","100%");

d3.json('data/openpaths_short.json', function(error, d){  

if(error) throw error;

var data_JSON =[];
var xpos =[];
var ypos =[];
var xmin = 0;
var xmax = 0;
var ymin = 0;
var ymax = 0;
var count=0;
var rs = [];

for (var i=0; i<d.length;i++){
    var x = document.body.clientWidth*(180 + d[i]['lon'])/360;
    var y = document.body.clientHeight*(90 - d[i]['lat'])/180;
    xpos[i] = x;
    ypos[i] = y;
    rs[i] =Math.random()*10; 

};
xmin = d3.min(xpos);
xmax = d3.max(xpos);
ymin = d3.min(ypos);
ymax = d3.max(ypos);

function update(){
    data_JSON=[];
    data_JSON
    for(var i=0; i<d.length; i++){
        data_JSON[i]={};
        data_JSON[i]['id']='circle'+i;
        data_JSON[i]['x']=document.body.clientWidth*(xpos[i]-xmin)/(xmax-xmin); 
        data_JSON[i]['y']=document.body.clientHeight*(ypos[i]-ymin)/(ymax-ymin);
        data_JSON[i]['r']=rs[i];
    
    };
}

function draw(){
 var current_JSON = [];
 for (var i=0; i < count; i++){
     current_JSON[i] = data_JSON[i];
 }

d3.select('body').select('#svg_01').selectAll('circle').remove();
d3.select('body').select('#svg_01').selectAll('path').remove();


var lineFuntion = d3.svg.line()
                  .x(function(d){return d.x;})
                  .y(function(d){return d.y;})
                  .interpolate("linear");

d3.select('body').select('#svg_01').append('path')
.attr('d', lineFuntion(current_JSON))
.attr('stroke',"blue")
.attr('stroke-width', 0.5)
.attr('fill', 'none');

d3.select('body').select('#svg_01').selectAll('circle')
.data(current_JSON)
.enter()
.append('circle')
.attr('id',function(d){return d.id;})
.attr('cx',function(d){return d.x;})
.attr('cy',function(d){return d.y;})
.attr('r', function(d){return d.r;})
.attr('fill', 'yellow');

d3.select('body').select('#svg_01').select('#circle'+count)
.attr('fill', 'blue')
.attr('r', 15);

count=d.length-1;

/*
count++;
if (count >d.length){
    count=0;
}
*/
};

function init(){
    update();
    draw();
   requestAnimationFrame(init);
};

init();

 });