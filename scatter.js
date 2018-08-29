var cell;

function drawScatter(data){
  var formatNumber = d3.format("s");
  var formatPercent = d3.format(".0%");

  var width = 960,
    size = 150,			// size of each cell
    padding = 19.5;	// padding between cells

  // we will use a single x/y scale and x/y axis generator
  // since the range and orientation is always the same
  // will set domain specific to each cell as necessary
    
  var x = d3.scale.linear()
    .range([padding / 2, size - padding / 2]);

  var y = d3.scale.linear()
    .range([size - padding / 2, padding / 2]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(5);

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(5);

  var color = colorbrewer.Set1[3];

  stateKeys = data.keys();
  var domainByAverage = {},
    averages = d3.keys(data.get("AK")),
    n = averages.length;

  averages.forEach(function(average) {
    domainByAverage[average] = d3.extent(stateKeys, function(d) {
      return +data.get(d)[average]; 
    });
  });

  xAxis.tickSize(size * n)
    .tickFormat(function(d){return d < 1 ? formatPercent(d) : formatNumber(d);});
  yAxis.tickSize(-size * n)
    .tickFormat(function(d){return d < 1 ? formatPercent(d) : formatNumber(d);});

  var svg = d3.select("body").select("#scatter")
      .attr("width", size * n + padding + 110)
      .attr("height", size * n + padding + 30);

  var scplot = svg.append("g")
      .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

  scplot.selectAll(".x.axis")
      .data(averages)
    .enter().append("g")
      .attr("class", "x scaxis")
      .attr("transform", function(d, i) {
    		var shift = (n - i - 1) * size;
    		return "translate(" + shift + ",0)"; 
  		})
      .each(function(d) { 
    		x.domain(domainByAverage[d]);
    		d3.select(this).call(xAxis); 
  		});

  scplot.selectAll(".y.axis")
      .data(averages)
    .enter().append("g")
      .attr("class", "y scaxis")
      .attr("transform", function(d, i) { 
    		return "translate(0," + i * size + ")"; 
  		})
      .each(function(d) { 
    		y.domain(domainByAverage[d]);
    		d3.select(this).call(yAxis); 
  		});
  
  
  cell = scplot.selectAll(".cell")
      .data(cross(averages, averages))
    .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) { 
        return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; 
      })
      .each(plot); 

  cell.filter(function(d) { return d.i === d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  function plot(p) {
    var cell = d3.select(this);

    x.domain(domainByAverage[p.x]);
    y.domain(domainByAverage[p.y]);

    cell.append("rect")
      .attr("class", "scframe")
      .attr("x", padding / 2)
      .attr("y", padding / 2)
      .attr("width", size - padding)
      .attr("height", size - padding);
    
    var circles = cell.selectAll("circle")
      .data(stateKeys)
    .enter().append("circle")
      .attr("cx", function(d) { return x(data.get(d)[p.x]); })
      .attr("cy", function(d) { return y(data.get(d)[p.y]); })
      .attr("r", 2.5)
      .style("fill", color[0]);

    var scatterTooltip = scplot.append("text").attr("id", "mapTooltip").style("font-size", "15px");

    scatterTooltip.attr({
      "x": "0",
      "y": "0",
      "text-anchor": "end",
      "dy": -5
    }).style({
      "visibility": "hidden"
    })
    .text("N/A");

    circles.on("mouseover", function(d){
        scatterTooltip.text(d);
        scatterTooltip.style({"visibility": "visible"});
      })
      .on("mousemove", function(d) {
        var coords = d3.mouse(scplot.node());
        scatterTooltip.attr({"x": coords[0], "y": coords[1]});
      })
      .on("mouseout", function(d) {
        scatterTooltip.style({"visibility": "hidden"});
      });
  }

  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }
}

function updateColor(view, threshold, data) {
  if(view === 0){
    cell.selectAll("circle")
    .style("fill", function(d) {
        return threshold(data.get(d).AvgStateAdmRate);
    });
  }
  else if(view == 1){
    cell.selectAll("circle")
    .style("fill", function(d) {
        return threshold(data.get(d).AvgStateCost);
    });
  }
  else if(view === 2){
    cell.selectAll("circle")
    .style("fill", function(d) {
        return threshold(data.get(d).AvgStateSAT);
    });
  }
  else{
    cell.selectAll("circle")
    .style("fill", function(d) {
        return threshold(data.get(d).AvgStateRetRate);
    });
  }
}