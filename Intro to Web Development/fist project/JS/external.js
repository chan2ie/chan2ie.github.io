/*jslint devel: true*/
/*eslint-disable no-console*/
/*eslint no-undef: "error"*/
/*eslint-env node*/
/*global window*/ 

var w = window.innerWidth;
var h = window.innerHeight;
var data = [10, 60, 40, 20, 100];
var mySVG = d3.select("body").select("#svg_01");

console.log(w, h);

function draw(){
    mySVG
    .attr("width", w)
    .attr("height", h);
    
    mySVG.selectAll("circle").remove();
    
    mySVG.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function(d, i){return d*3})
    .attr("cy", function(d, i){return d*3})
    .attr("r", "10")
    .style("fill", "purple");
}

draw();

function resizeWindow () {
    w = window.innerWidth;
    h = widnow.innerHeight;
}
