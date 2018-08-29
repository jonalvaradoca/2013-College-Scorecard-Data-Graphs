/* Notes: 
 * update map key -
 * 0 = admission rate view
 * 1 = tuition view
 * 2 = SAT view
 * 3 = retetion view
 *
 * update bar
 */

/*Map Variables*/

var activeScale = "USA";
var activeView = 0;
var activeData;

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

var mapHeader = mapg.append("text").attr("id", "mapHeader").style("font-size", "25px");

mapHeader.attr({
  "x": mapWidth / 2,
  "y": 35,
  "text-anchor": "middle"
})
.text("Country/Statewide Admission Rates");

var mapTooltip = mapg.append("text").attr("id", "mapTooltip").style("font-size", "15px");

var detailg = mapSvg.append("g").attr("id", "detail");
detailg
  .attr("width", 425)
  .attr("height", 50);
var detailBox = detailg.append("rect");
var details = detailg.append("foreignObject").attr("id", "details");

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
var SATColor = colorbrewer.YlGn[5];
var retRateColor = colorbrewer.RdPu[5];

var threshold, xMapKey, xAxisMapKey, mapKey, mapKeyRects;
/*End Map*/

var stateData;
var instData;
var formatPercent = d3.format(".0%");

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
      .on("click", clicked);

  map.append("path")
    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    .attr("class", "mesh")
    .attr("d", path);

  detailBox
    .attr("x", mapWidth/3 - 5)
    .attr("y", mapHeight/12 - 5)
    .attr("fill", "orange")
    .attr("opacity", ".90")
    .attr("width", 400)
    .attr("height", 50)
    .attr("visibility", "hidden");

  details.attr({
    "x": mapWidth/3,
    "y": mapHeight/12,
    "width": 475
    }).style({
    "visibility": "hidden"
    })
    .append("xhtml:body")
    .html("<p>N/A</p>");

  d3.csv("Filtered Down College Data.csv", accessor, callback);
});

function accessor(row) {
  if(String(row.STABBR) != "PR" && String(row.STABBR) != "GU" 
    && String(row.STABBR) != "VI" && row.CONTROL != 3 
    && row.LONGITUDE !== "NULL" && row.ADM_RATE !== "NULL" 
    && row.RET_FT4 !== "NULL" && row.COSTT4_A !== "NULL"
    && row.SAT_AVG_ALL !== "NULL") {
    var out = {};
    out.InstName = row.INSTNM;
    out.State = String(row.STABBR);
    out.Control = row.CONTROL;
    out.AdmRate = row.ADM_RATE;
    out.Cost = row.COSTT4_A;
    out.SAT = row.SAT_AVG_ALL;
    out.RetRate = row.RET_FT4;
    out.Point = [parseFloat(row.LONGITUDE), parseFloat(row.LATITUDE)];
    return out;
  };
};

function callback(error, rows){
  if (error) throw error;

  stateData = d3.nest()
    .key(function(d) { return d.State; })
    .rollup(function(d) {
      return{
        AvgStateAdmRate : d3.mean(d, function(g) { return +g.AdmRate}),
        AvgStateCost : Math.floor(d3.mean(d, function(g){ return +g.Cost})),
        AvgStateSAT : Math.floor(d3.mean(d, function(g){ return +g.SAT})),
        AvgStateRetRate : d3.mean(d, function(g) { return +g.RetRate})
      }
    })
    .map(rows, d3.map);

  instData = d3.nest()
    .key(function(d) { return d.InstName; })
    .map(rows, d3.map);

  /*Retention median*/
  var stateKeys = stateData.keys();
  var retmedian = d3.median(stateKeys, function(d){
    if(stateData.get(d).AvgStateRetRate != null)
      return +stateData.get(d).AvgStateRetRate;
  });
  var costmedian = d3.median(stateKeys, function(d){
    if(stateData.get(d).AvgStateCost != null)
      return +stateData.get(d).AvgStateCost;
  });
  var SATmax = d3.max(stateKeys, function(d){
    if(stateData.get(d).AvgStateSAT != null)
      return +stateData.get(d).AvgStateSAT;
  });
  console.log(SATmax);
  /*end test*/

  map.selectAll("path")
    .on("mouseover", function(d) {
        if(activeView === 0){
          mapTooltip.text(d.id + ": " + (((stateData.get(d.id).AvgStateAdmRate 
            * 100) - (stateData.get(d.id).AvgStateAdmRate * 100 % 1)) / 100));
        }
        else if(activeView === 1){
          mapTooltip.text(d.id + ": " + stateData.get(d.id).AvgStateCost);
        }
        else if(activeView === 2){
          mapTooltip.text(d.id + ": " + stateData.get(d.id).AvgStateSAT);
        }
        else{
          mapTooltip.text(d.id + ": " + (((stateData.get(d.id).AvgStateRetRate 
            * 100) - (stateData.get(d.id).AvgStateRetRate * 100 % 1)) / 100));
        }
        mapTooltip.style({"visibility": "visible"});
        this.parentNode.appendChild(this);
      })
      .on("mousemove", function(d) {
        var coords = d3.mouse(map.node());
        mapTooltip.attr({"x": coords[0], "y": coords[1]});
      })
      .on("mouseout", function(d) {
        var me = d3.select(this);
        mapTooltip.style({"visibility": "hidden"});
        me.classed({"activeSYMBOL": false});
      });

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
    .style("opacity", ".75")
    .attr("r", 2)
    .style("visibility", "hidden")
    .on("mouseover", function(d) {;
      if(activeView === 0){
        detailBox.attr("fill", "orange");
        details.html("<p>Institution: " + d.InstName + "<br/>Acceptance Rate: " + 
          d.AdmRate + "</p>");
      }
      else if(activeView === 1){
        detailBox.attr("fill", SATColor[2]);
        details.html("<p>Institution: " + d.InstName + "<br/>Average Attendence Cost: $" + 
          d.Cost + "</p>");
      }
      else if(activeView === 2){
        detailBox.attr("fill", costColor[2]);
        details.html("<p>Institution: " + d.InstName + "<br/>Average Entering SAT: " + 
          d.SAT + "</p>");
      }
      else{
        detailBox.attr("fill", "yellow");
        details.html("<p>Institution: " + d.InstName + "<br/>Retention Rate: " + 
          d.RetRate + "</p>")
      }
      var me = d3.select(this);
      me.classed({"activeSYMBOL": true});
      var coords = d3.mouse(mapSvg.node());
      if(coords[1] >= mapHeight/2){
        details.attr({
          "x": mapWidth/3,
          "y": mapHeight/12,
          "width": 400});
        detailBox
          .attr("x", mapWidth/3 - 5)
          .attr("y", mapHeight/10);
      }
      else{
        details.attr({
          "x": mapWidth/3,
          "y": mapHeight * (9.5/12),
          "width": 400});
        detailBox
          .attr("x", mapWidth/3 - 5)
          .attr("y", mapHeight * (8/10));
      }
      detailBox.style({"visibility": "visible"});
      details.style({"visibility": "visible"});
      })
      .on("mouseout", function(d) {
        var me = d3.select(this);
        me.classed({"activeSYMBOL": false});
        detailBox.style({"visibility": "hidden"});
        details.style({"visibility": "hidden"});
      });

  activeData = stateData;
  updateMap(activeView, stateData);
  updateSymbols(activeView);
  drawBarChart(activeScale, activeView, activeData);
  drawScatter(stateData);
  updateColor(activeView, threshold, stateData);

  d3.select("body").select("#buttonAdm")
    .classed({"selected": true})
    .style("background-color", "#888888");

  var buttons = d3.select("body").selectAll(".button");
  
  /* Button Call to change map to cost view */
  buttons.on("click", function(d){
    var me = d3.select(this);
    me.transition().style("background-color", "#888888");

    var other = d3.select("body").select(".selected");
    other.classed({"selected": false});
    other.style("background-color", "");

    me.classed({"selected": true});
    console.log(me[0][0].id);

    if(me[0][0].id === "buttonAdm"){
      activeView = 0;
    }else if(me[0][0].id === "buttonCos"){
      activeView = 1;
    }else if(me[0][0].id === "buttonSAT"){
      activeView = 2;
    }else{
      activeView = 3;
    }
    updateMap(activeView, stateData);
    updateSymbols(activeView);
    drawBarChart(activeScale, activeView, activeData);
    updateColor(activeView, threshold, stateData);
    updateHeader(activeView);
  });
};

function updateHeader(d){
  if(d === 0){
    mapHeader.text("Country/Statewide Admission Rates");
  }
  else if(d == 1){
    mapHeader.text("Country/Statewide Costs of Attendence");
  }
  else if(d === 2){
    mapHeader.text("Country/Statewide Entry SAT Scores");
  }
  else{
    mapHeader.text("Country/Statewide Retention Rates");
  }
};

function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);
  activeScale = d.id;

  var bounds = path.bounds(d),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = .9 / Math.max(dx / mapWidth, dy / mapHeight),
    translate = [mapWidth / 2 - scale * x, mapHeight / 2 - scale * y];

  symbols.selectAll("circle").transition()
    .duration(750)
    .attr("r", 8 / scale)
    .style("visibility", "visible");

  map.selectAll("path").transition()
    .duration(750)
    .style("stroke-width", 1 / scale + "px");

  mapg.transition()
    .duration(750)
    .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

  mapTooltip.style("font-size", 15 / scale)
    .attr("dy", function (g){
      return d.id === "DC" ? -5 / scale : -3;
    });

  activeData = instData;
  drawBarChart(activeScale, activeView, activeData);

}

function reset() {
  activeScale = "USA";
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

  mapTooltip.style("font-size", 15)
    .attr("dy", -5);

  activeData = stateData;
  drawBarChart(activeScale, activeView, activeData);
}

function createFacebook(){}

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function updateMap(view, data) {
  /*begin map coloring*/
  var formatNumber = d3.format(".0f");
  var formatK = d3.format("s");

  /*begin admission view*/
  if(view === 0){
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

    map.select(".key").remove();
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
  } /*End Admission View*/
  /*Begin Cost View*/
  else if(view === 1){
    threshold = d3.scale.threshold()
    .domain([22000, 27000, 32000, 38000])
    .range(costColor);

    xMapKey = d3.scale.linear()
      .domain([10000, 42000])
      .range([0, 210]);

    xAxisMapKey = d3.svg.axis()
      .scale(xMapKey)
      .orient("bottom")
      .tickSize(13)
      .tickValues([22000, 27000, 32000, 38000, 42000])
      .tickFormat(function(d){ return formatK(d)});

    map.select(".key").remove();
    mapKey = map.append("g")
      .attr("class", "key")
      .attr("transform", "translate(" + (mapWidth - 225) + "," + (mapHeight - 130) + ")");

    mapKey.call(xAxisMapKey).append("text")
      .attr("class", "caption")
      .attr("y", -6)
      .style("font-size", "13")
      .text("Average Cost of Attendence");

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
          return threshold(data.get(d.id).AvgStateCost);
        }
    });
  } /*end Cost View*/
  /*begin SAT view*/
  else if(view ===2){
        threshold = d3.scale.threshold()
    .domain([1020, 1060, 1110, 1150])
    .range(SATColor);

    xMapKey = d3.scale.linear()
      .domain([900, 1170])
      .range([0, 210]);

    xAxisMapKey = d3.svg.axis()
      .scale(xMapKey)
      .orient("bottom")
      .tickSize(13)
      .tickValues(threshold.domain());

    map.select(".key").remove();
    mapKey = map.append("g")
      .attr("class", "key")
      .attr("transform", "translate(" + (mapWidth - 225) + "," + (mapHeight - 130) + ")");

    mapKey.call(xAxisMapKey).append("text")
      .attr("class", "caption")
      .attr("y", -6)
      .style("font-size", "13")
      .text("Average Overall SAT Score");

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
          return threshold(data.get(d.id).AvgStateSAT);
        }
    });
  } /*end SAT view*/
  /*begin retention view*/
  else {
    threshold = d3.scale.threshold()
    .domain([.68, .72, .75, .80])
    .range(retRateColor);

    xMapKey = d3.scale.linear()
      .domain([.65, .85])
      .range([0, 210]);

    xAxisMapKey = d3.svg.axis()
      .scale(xMapKey)
      .orient("bottom")
      .tickSize(13)
      .tickValues(threshold.domain())
      .tickFormat(function(d) { return d === .68 ? formatPercent(d) : formatNumber(100 * d); });

    map.select(".key").remove();
    mapKey = map.append("g")
      .attr("class", "key")
      .attr("transform", "translate(" + (mapWidth - 225) + "," + (mapHeight - 130) + ")");

    mapKey.call(xAxisMapKey).append("text")
      .attr("class", "caption")
      .attr("y", -6)
      .style("font-size", "13")
      .text("State Retention Rate");

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
          return threshold(data.get(d.id).AvgStateRetRate);
        }
    });
  } /*End retention View*/
}

function updateSymbols(view, data) {
  if(view === 0){
    symbols.selectAll("circle")
      .style("fill", "orange");
  }
  else if(view == 1){
    symbols.selectAll("circle")
      .style("fill", SATColor[2]);
  }
  else if(view === 2){
    symbols.selectAll("circle")
      .style("fill", costColor[2]);
  }
  else{
    symbols.selectAll("circle")
      .style("fill", "yellow");
  }
}