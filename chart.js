function drawBarChart(scale, view, data) {
	d3.select("#bar").select("#update").remove();
	/*Bar Chart Variables*/
	var barMargin = {top: 20, right: 20, bottom: 20, left: 20},
	  barWidth = 700 - barMargin.left - barMargin.right,
	  barHeight = 450 - barMargin.top - barMargin.bottom;

	var barSvg = d3.select("body").select("#bar")
	    .attr("width", barWidth + barMargin.left + barMargin.right)
	    .attr("height", barHeight + barMargin.top + barMargin.bottom)
	  .append("g")
	  	.attr("id", "update")
	    .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")");

	var barx = d3.scale.linear()
	  .range([0, barWidth]);

	var bary = d3.scale.ordinal()
	  .rangeRoundBands([0, barHeight], .1);

	var xBarAxis = d3.svg.axis()
	  .scale(barx)
	  .orient("bottom")
	  .ticks(10);

	var yBarAxis = d3.svg.axis()
	  .scale(bary)
	  .orient("left");

	var tenList, bars;

	/* USA Scale */
	if(scale === "USA"){
	  var stateKeys = data.keys();

	  if(view === 0){
	  	xBarAxis.tickFormat(formatPercent);
	  	stateKeys.sort(function(a, b){ 
	    	return d3.ascending(data.get(a).AvgStateAdmRate,
	    	data.get(b).AvgStateAdmRate); 
	  	});
	  	barx.domain([0, 1]);
	  }	else if(view === 1) {
	  	stateKeys.sort(function(a, b){ 
	    	return d3.ascending(data.get(a).AvgStateCost,
	    	data.get(b).AvgStateCost); 
	  	});
	  	barx.domain([0, d3.max(stateKeys, function(d){
    		if(data.get(d).AvgStateCost != null)
      		return +data.get(d).AvgStateCost;
 			 	})
	  	]);
	  } else if(view === 2){
	  	stateKeys.sort(function(a, b){ 
	    	return d3.descending(data.get(a).AvgStateSAT,
	    	data.get(b).AvgStateSAT); 
	  	});
	  	barx.domain([0, 2400]);
	  } else{
	  	xBarAxis.tickFormat(formatPercent);
	  	stateKeys.sort(function(a, b){ 
	    	return d3.descending(data.get(a).AvgStateRetRate,
	    	data.get(b).AvgStateRetRate); 
	  	});
	  }

	  tenList = stateKeys.slice(0, 10);

	  bars = barSvg.selectAll(".bar")
	            .data(tenList);

	  bary.domain(tenList.map(function(d) { return d; }));

	  yBarAxis = d3.svg.axis()
		  .scale(bary)
		  .orient("right");

		if(view === 0){
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", admRateColor[2])
		    .attr("x", function(d) { barx(data.get(d).AvgStateAdmRate); })
		    .attr("width", function(d) { return barx(data.get(d).AvgStateAdmRate);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());
		} else if(view === 1){
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", costColor[2])
		    .attr("x", function(d) { barx(data.get(d).AvgStateCost); })
		    .attr("width", function(d) { return barx(data.get(d).AvgStateCost);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());
		} else if(view === 2){
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", SATColor[2])
		    .attr("x", function(d) { barx(data.get(d).AvgStateSAT); })
		    .attr("width", function(d) { return barx(data.get(d).AvgStateSAT);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());
		} else {
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", retRateColor[2])
		    .attr("x", function(d) { barx(data.get(d).AvgStateRetRate); })
		    .attr("width", function(d) { return barx(data.get(d).AvgStateRetRate);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());
		}

	  barSvg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + barHeight + ")")
	    .call(xBarAxis);

	 	barSvg.append("g")
	    .attr("class", "y axis")
	    .call(yBarAxis)
	  .selectAll(".tick text")
		  .style("text-shadow", "0px 0px 5px white");

	/* State Scale */
  } else {
  	var instKeys = data.keys().filter(filterState);

	  function filterState(value) {
	    return data.get(value)[0].State === scale;
	  };


	  if(view === 0){
	  	xBarAxis.tickFormat(formatPercent);
	  	instKeys.sort(function(a, b){ 
	    	return d3.ascending(+data.get(a)[0].AdmRate,
	    	+data.get(b)[0].AdmRate); 
	  	});
	  	barx.domain([0, 1]);
	  } else if(view === 1){
	  	instKeys.sort(function(a, b){ 
	    	return d3.ascending(+data.get(a)[0].Cost,
	    	+data.get(b)[0].Cost); 
	  	});
	  	barx.domain([0, d3.max(instKeys, function(d){
    		if(data.get(d)[0].Cost != null)
      		return +data.get(d)[0].Cost;
 			 	})
	  	]);
	  } else if(view === 2){
	  	instKeys.sort(function(a, b){ 
	    	return d3.descending(+data.get(a)[0].SAT,
	    	+data.get(b)[0].SAT); 
	  	});
	  	barx.domain([0, 2400]);
	  } else{
	  	xBarAxis.tickFormat(formatPercent);
	  	instKeys.sort(function(a, b){ 
	    	return d3.descending(+data.get(a)[0].RetRate,
	    	+data.get(b)[0].RetRate); 
	  	});
	  	barx.domain([0, 1]);
	  }


	  var tenList = instKeys.slice(0, 10);

	  bars = barSvg.selectAll(".bar")
	            .data(tenList);

	  bary.domain(tenList.map(function(d) { return d; }));

	  yBarAxis = d3.svg.axis()
		  .scale(bary)
		  .orient("right");

		if(view === 0){
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", admRateColor[2])
		    .attr("x", function(d) { barx(data.get(d)[0].AdmRate); })
		    .attr("width", function(d) { return barx(data.get(d)[0].AdmRate);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());

		  barSvg.append("g")
		    .attr("class", "y axis")
		    .call(yBarAxis)
		  .selectAll(".tick text")
		  	.style("text-shadow", "0px 0px 5px white")
		  	.attr("x", function(d){
		  		if(data.get(d)[0].AdmRate < .35)
		  			return barx(data.get(d)[0].AdmRate) + 5;
		  		else
		  			return 10;
		  });
		} else if(view === 1){
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", costColor[2])
		    .attr("x", function(d) { barx(data.get(d)[0].Cost); })
		    .attr("width", function(d) { return barx(data.get(d)[0].Cost);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());

		  barSvg.append("g")
		    .attr("class", "y axis")
		    .call(yBarAxis)
		  .selectAll(".tick text")
		  	.style("text-shadow", "0px 0px 5px white")
		  	.attr("x", function(d){
		  		if(data.get(d)[0].Cost < barx.domain()[1]*.35)
		  			return barx(data.get(d)[0].Cost) + 5;
		  		else
		  			return 10;
		  });
		} else if(view === 2){
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", SATColor[2])
		    .attr("x", function(d) { barx(data.get(d)[0].SAT); })
		    .attr("width", function(d) { return barx(data.get(d)[0].SAT);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());

		  barSvg.append("g")
		    .attr("class", "y axis")
		    .call(yBarAxis)
		  .selectAll(".tick text")
		  	.style("text-shadow", "0px 0px 5px white")
		  	.attr("x", function(d){
		  		if(data.get(d)[0].SAT < barx.domain()[1]*.35)
		  			return barx(data.get(d)[0].SAT) + 5;
		  		else
		  			return 10;
		  });
		} else{
			bars.enter().append("rect")
		    .attr("class", "bar")
		    .style("fill", retRateColor[2])
		    .attr("x", function(d) { barx(data.get(d)[0].RetRate); })
		    .attr("width", function(d) { return barx(data.get(d)[0].RetRate);})
		    .attr("y", function(d) { return bary(d); })
		    .attr("height", bary.rangeBand());

		  barSvg.append("g")
		    .attr("class", "y axis")
		    .call(yBarAxis)
		  .selectAll(".tick text")
		  	.style("text-shadow", "0px 0px 5px white")
		  	.attr("x", function(d){
		  		if(data.get(d)[0].RetRate < .35)
		  			return barx(data.get(d)[0].RetRate) + 5;
		  		else
		  			return 10;
		  });
		}

	  barSvg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + barHeight + ")")
	    .call(xBarAxis);
  }
}
