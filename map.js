/*Map Variables*/
var mapWidth = 960,
  mapHeight = 500,
  active = d3.select(null);

var mapSvg = d3.select("body").select("#map")
  .attr("width", mapWidth)
  .attr("height", mapHeight)
  .on("click", stopped, true);

mapSvg.append("rect")
  .attr("class", "background")
  .attr("width", mapWidth)
  .attr("height", mapHeight)
  .on("click", reset);

var mapg = mapSvg.append("g")
  .style("stroke-width", "1.5px")
  .attr("id", "plot");

var map = mapg.append("g").attr("id", "map");
var symbols = mapg.append("g").attr("id", "symbols");

var mapTooltip = mapg.append("text").attr("id", "mapTooltip").style("font-size", "15px");

var projection = d3.geo.albersUsa()
  .scale(1000)
  .translate([mapWidth / 2, mapHeight / 2]);

var path = d3.geo.path()
  .projection(projection);

mapTooltip.attr({
  "x": "0",
  "y": "0",
  "text-anchor": "end",
  "dy": -5
}).style({
  "visibility": "hidden"
})
.text("N/A");

var admRateColor = colorbrewer.YlGnBu[5];
var costColor = colorbrewer.YlOrRd[5];

var threshold, xMapKey, xAxisMapKey, mapKey, mapKeyRects;

function callback(error, rows){
  if (error) throw error;

  stateData = d3.nest()
    .key(function(d) { return d.State; })
    .rollup(function(d) {
      return{
        AvgStateAdmRate : d3.mean(d, function(g) { return +g.AdmRate}),
        AvgCost : Math.floor(d3.mean(d, function(g){ return +g.Cost}))
      }
    })
    .map(rows, d3.map);

  instData = d3.nest()
    .key(function(d) { return d.InstName; })
    .map(rows, d3.map);

  drawMap(0);
  updateMap(data);

  function ridNull(value) {
    return (projection(value.Point) !== null && value.AdmRate !== null);
  }

  symbols.selectAll("circle")
    .data(rows.filter(ridNull))
    .enter()
    .append("circle")
    .attr("class", "symbol")
    .attr("cx", function(d) { return projection(d.Point)[0]})
    .attr("cy", function(d) { return projection(d.Point)[1]})
    .style("fill", "orange")
    .style("opacity", ".50")
    .attr("r", function(d) { return d.AdmRate * 10;})
    .style("visibility", "hidden");

  drawBarChart("USA", stateData);

  var costButton = d3.select("body").select("#buttonCos");
  
  /* Button Call to change map to cost view */
  costButton.on("click", function(d){
    console.log("hi");
    console.log(stateData);
    console.log(rows);
  });
};

function drawMap(view) {
	/*Draw Map*/
	d3.json("us.json", function(error, us) {
	  if (error) throw error;

	  map.selectAll("path")
	      .data(topojson.feature(us, us.objects.states).features, function(d) {
	        return d.id;
	    })
	    .enter().append("path")
	      .attr("d", path)
	      .attr("class", "state")
	      .on("click", clicked)
	      .on("mouseover", function(d) {
	        mapTooltip.text(d.id);
	        mapTooltip.style({"visibility": "visible"});
	        this.parentNode.appendChild(this);
	      })
	      .on("mousemove", function(d) {
	        var coords = d3.mouse(map.node());
	        mapTooltip.attr({"x": coords[0], "y": coords[1]});
	      })
	      .on("mouseout", function(d) {
	        mapTooltip.style({"visibility": "hidden"});
	    });

	  console.log("hi");

	  map.append("path")
	    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
	    .attr("class", "mesh")
	    .attr("d", path);

	  d3.csv("Filtered Down College Data.csv", accessor, callback);
	});
};

function updateMap(data) {
	var formatNumber = d3.format(".0f");

  threshold = d3.scale.threshold()
    .domain([.50, .65, .75, .85])
    .range(admRateColor);

  xMapKey = d3.scale.linear()
    .domain([0, 1])
    .range([0, 210]);

  xAxisMapKey = d3.svg.axis()
    .scale(xMapKey)
    .orient("bottom")
    .tickSize(13)
    .tickValues(threshold.domain())
    .tickFormat(function(d) { return d === .5 ? formatPercent(d) : formatNumber(100 * d); });

  mapKey = map.append("g")
    .attr("class", "key")
    .attr("transform", "translate(" + (mapWidth - 225) + "," + (mapHeight - 130) + ")");

  mapKey.call(xAxisMapKey).append("text")
    .attr("class", "caption")
    .attr("y", -6)
    .style("font-size", "13")
    .text("State Admission Rate");

  mapKeyRects = mapKey.selectAll("rect")
    .data(threshold.range().map(function(color) {
      var d = threshold.invertExtent(color);
      if (d[0] == null) d[0] = xMapKey.domain()[0];
      if (d[1] == null) d[1] = xMapKey.domain()[1];
      return d;
    }));

  mapKeyRects.enter().append("rect")
    .attr("height", 13)
    .attr("x", function(d) { return xMapKey(d[0]); })
    .attr("width", function(d) { return xMapKey(d[1]) - xMapKey(d[0]); })
    .style("fill", function(d) { return threshold(d[0]); });

  map.selectAll("path")
    .style("fill", function(d) {
      if(typeof d.id == "string"){
        return threshold(data.get(d.id).AvgStateAdmRate);
      }
  });
};

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
};

function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = .9 / Math.max(dx / mapWidth, dy / mapHeight),
    translate = [mapWidth / 2 - scale * x, mapHeight / 2 - scale * y];

  symbols.selectAll("circle").transition()
    .duration(750)
    .attr("r", function(d) { return d.AdmRate * 10 / scale})
    .style("visibility", "visible");

  map.selectAll("path").transition()
    .duration(750)
    .style("stroke-width", 1 / scale + "px");

  mapg.transition()
    .duration(750)
    .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

  drawBarChart(d.id, instData);
};

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  symbols.selectAll("circle").transition()
    .duration(750)
    .style("visibility", "hidden");

  map.selectAll("path").transition()
    .duration(750)
    .style("stroke-width", "1px");

  mapg.transition()
    .duration(750)
    .attr("transform", "");

  drawBarChart("USA", stateData);
};
