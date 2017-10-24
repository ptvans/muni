_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

$(document).ready(function() {
    

    function pop(button) {
      $("#container > .inner-container").removeClass("active");
      console.log(button);
      var name = button.getAttribute("data-name");
      console.log(name);
      var tabcontent = document.getElementById(name);
      console.log(tabcontent);
      $(tabcontent).addClass("active");
    };

    /*function pop2(button) {
      $("#container > .inner-container").removeClass("active");
      console.log(button);
      var name = button.getAttribute("data-name");
      console.log(name);
      var tabcontent = document.getElementById(name);
      console.log(tabcontent);
      $(tabcontent).addClass("active");
    };*/


    var dateMin = new Date(2013,0,31);
    var dateMax = new Date(2013,3,30);
    var isFilterForNewOnly = false;

    var actions = ['donate', 'watch', 'read', 'pledge', 'share'];

    // TEMPLATES
    var tpl_championPreview = _.template("\
        <div class=\"rank\">{{ rank }}</div>\
        <div class=\"avatar\"><img src=\"{{ image }}\" /><div class=\"channel-icon {{ channel }}\"></div><i class=\"icon-new-{{ is_new }}\"></i></div>\
        <div class=\"champion-inner\">\
            <div class=\"name\">{{ full_name }}</div>\
            <div class=\"actions\"><span class=\"num-actions\">{{ num_actions }}</span><div class=\"action-bar\" style=\"width: {{ action_bar_width }}px\"></div></div>\
        </div>\
    ");
    
    var tpl_championDetails = _.template("\
    <section id=\"champ-title\">\
        <div id=\"photo\">\
            <div id=\"profile-pic\">\
                <img src=\"{{ image }}\">\
            </div>\
        </div>\
        <div class=\"rank\">{{ rank }}</div>\
        <div class=\"name\">{{ full_name }}</div><br />\
        <div id=\"champ-location\"><i class=\"icon-globe\"></i> {{ location }} </div>\
        <div id=\"champ-gender\"><i class=\"icon-user\"></i> {{ gender }}</div><br />\
        <div id=\"champ-channel\"><img src=\"img/{{ channel }}.png\" class=\"detail-{{ channel }}\"> {{ full_name }} brought the most visitors through {{ channel }}.</div>\
    </section>\
    <section>\
        <div id=\"section-champion\">\
            <div class=\"title\">Champion Details</div>\
            <div id=\"champ-stats\">\
                <img src=\"img/twitter.png\" class=\"detail-twitter\"></img><div class=\"stat\" id=\"champ-followers\">{{ followers_count }} </div><div class=\"stat-desc\"> followers </div><br />\
                <img src=\"img/facebook.png\" class=\"detail-facebook\"></img><div class=\"stat\" id=\"champ-friends\">{{ friends_count }}</div><div class=\"stat-desc\"> friends </div><br />\
                <img src=\"img/shares.png\" class=\"detail-shares\"></img><div class=\"stat\" id=\"champ-shares\">{{ shares }}</div><div class=\"stat-desc\"> shares </div>\
            </div>\
            <div id=\"champ-dates\">\
                <i class=\"icon-time\"></i><div class=\"stat-desc\"> Last Visit: </div><div id=\"champ-became-date\">{{ dates.last_visit }}</div><br />\
                <i class=\"icon-time\"></i><div class=\"stat-desc\"> Became Champion: </div><div id=\"champ-became-date\">{{ dates.became_champ }}</div><br />\
                <i class=\"icon-time\"></i><div class=\"stat-desc\"> First Visit: </div><div id=\"champ-first-visit\">{{ dates.first_visit }}</div>\
            </div>\
            <div class=\"action-chart\">\
                <div class=\"title\">Actions Taken by {{ first_name }}</div>\
                <svg></svg>\
            </div>\
        </div>\
        <div id=\"section-visitors\">\
            <div class=\"title\">{{ gender_pronoun }} Visitors</div>\
            <div id=\"visitor-chart\">\
                <span style=\"color: #a7a9ac\"><span>Out of</span> <span style=\"color: #25aae0; font-size: 50px\">{{ num_visitors }}</span> <span>visitors</span></span>\
                <svg width=\"200\" height=\"160\">\
                    <g id=\"background\" transform=\"translate(0,-15)\">\
                      <circle cx=\"100\" cy=\"100\" r=\"60\" fill=\"none\" stroke=\"#25aae0\" stroke-width=\"10\"/>\
                      <line fill=\"none\" stroke=\"#27AAE1\" stroke-width=\"3\" x1=\"99\" y1=\"15\" x2=\"99\" y2=\"40\"/>\
                      <g transform=\"translate(40, 22) scale(1.7)\">\
                        <path fill=\"#D1D3D4\" stroke=\"#BCBEC0\" stroke-miterlimit=\"10\" d=\"M38.527,38.894c-1.273-0.733-1.92-1.144-3.147-1.144c-1.232,0-2.421,0.703-3.494,1.165c-1.126,0.485-0.98,3.107-0.98,4.518h8.954C39.859,42.013,39.599,39.516,38.527,38.894z\"/>\
                        <path fill=\"#D1D3D4\" stroke=\"#BCBEC0\" stroke-miterlimit=\"10\" d=\"M35.993,33.024c-0.298-0.071-0.354-0.711-0.354-0.711s0.029,0.64-0.255,0.64c-0.629,0-1.601,0.304-2.223,0.969c-0.354,0.375,0.261,0.101,0.179,0.205c-0.417,0.512-0.355,0.901-0.21,1.674c0.301,1.596,1.11,2.844,2.254,2.844c1.253,0.001,1.869-1.319,2.166-2.844C37.812,34.472,37.151,33.302,35.993,33.024z\"/>\
                      </g>\
                    </g>\
                    <g id=\"foreground\"></g>\
                </svg>\
                <div style=\"color: #f15929\">({{ percent_new_supporters }}%)</div>\
                <div style=\"color: #a7a9ac\">became Supporters*<br/>(visitors who took an action)</div>\
            </div>\
            <div class=\"action-chart\">\
                <div class=\"title\">Actions Taken by {{ gender_pronoun }} Visitors</div>\
                <svg></svg>\
            </div>\
        </div>\
    </section>");

    // FUNCTIONS
    var formatDate = d3.time.format("%m/%d/%Y");
    var formatDateLong = d3.time.format("%B %d, %Y");
    var format = d3.format(".1f")
    
    var ri = 30,
        ro = 56,
        padding = 100 - ro;

    var arcVisitors = d3.svg.arc()
        .innerRadius(ri)
        .outerRadius(ro)
        .startAngle(function(d, i) {
          return Math.PI - (Math.PI / 100 * d);
        })
        .endAngle(function(d, i) {
          return Math.PI + (Math.PI / 100 * d);
        })
    ;

    var arcSupporters = d3.svg.arc()
        .innerRadius(ri)
        .outerRadius(ro)
        .startAngle(function(d, i) {
          return 2 * Math.PI - (Math.PI / 100 * d);
        })
        .endAngle(function(d, i) {
          return 2 * Math.PI + (Math.PI / 100 * d);
        })
    ;
    
    var showAggregateSummary = function(data) {
        var aggregate = _.chain(data)
        .values()
        .reduce(function(memo, num) {
          return memo + num;
        }, 0)
        .value();

        var scaleAggregate = d3.scale.linear()
        .domain([0, aggregate])
        .range([0, 500]);

        var scaleColorAggregate = d3.scale.ordinal()
        .domain(["twitter", "facebook", "email"])
        .range(["#25aae0", "#218fbd", "#97bee5"])

        var layout = d3.layout.stack();
        data = _.map(data, function(num, channel) {
              return [{x: 0, y: num, channel: channel}];
          });

        var dataStack = _.chain(layout(data)).flatten().sortBy(function(d, i){ return d.channel }).value();
        var maxValue = d3.max(_.pluck(dataStack, "y"));

        var g = d3.selectAll("#aggregate-chart");
        var groups = g.selectAll("div.aggregate")
        .data(dataStack)
        .enter().append("div")
        .attr({
          "class": "aggregate"
        })
        .style({
          "width": function(d, i) {
            console.log(d);
            return scaleAggregate(d.y)+"px"
          }
        })

        var pills = 
        groups.append("div")
        .attr({
          "class": "pill"
        });

        pills.append("div")
        .style({
          "background-color": function(d, i) {
            return d.y == maxValue ? scaleColorAggregate(d.channel) : "#e7e8e9";
          },
          "color": function(d, i) {
            return d.y != maxValue ? "#9EA0A2" : "#FCFEFF";
          }
        })
        .text(function(d, i) {
          return d.y
        })

        groups.append("div")
        .style({
          "background-color": function(d, i) {
            return scaleColorAggregate(d.channel);
          }
        });

        groups.append("div")
        .attr({
          "class": "channel"
        })
        .text(function(d, i) {
          return d.channel
        })
        .style({
          "color": function(d, i) {
            return d.y == maxValue ? scaleColorAggregate(d.channel) : "#9EA0A2";
          }
        })
        ;
        
    };
    
    var showVisitorChart = function(champion) {
        var numSupporters = champion.supporters || 0;
        var numVisitors = champion.num_visitors;
        var percentNewSupporters = champion.percent_new_supporters;

        var g = d3.selectAll("#section-visitors #foreground");

        var paths = g.selectAll("path")
        .data([percentNewSupporters, 100 - percentNewSupporters])

        paths.enter().append("path");

        paths.attr({
          "d": function(d, i) {
            return i ? arcSupporters(d) : arcVisitors (d)
          },
          "transform": function(d, i) {
            return "translate(" + [padding+ro, 29 + ro] + ")"
          }
        })
        .style({
          "fill": function(d, i) {
            return i ? "#d1d2d4" : "#f15929";
          }
        });

        var numSupporterLabel = g.selectAll("text")
        .data([numSupporters])

        numSupporterLabel.enter().append("text");

        numSupporterLabel.attr({
            "text-anchor": "middle",
            "transform": "translate(100, 107)"
        })
        .style({
          "fill": "#f15929",
          "font-size": "30px"
        })
        .text(numSupporters);

    };
    
    var showActionsChart = function(data, g) {
        var x0 = 100;
        var labelPos = 10;
        var countPos = 78;
        var width = 200;
        var r = 5;
        var height = 39;

        var scaleTime = d3.time.scale()
        	.domain([dateMin, dateMax])
        	.range([x0, x0+width]);

        var scaleColor = d3.scale.ordinal()
        	.domain(actions)
        	.range(["#a22767", "#586db3", "#5fc1a0", "#27b0f0"]);

        var dateFormatShort = d3.time.format("%b %d");

        var data = _.filter(data, function(d, i) {
        	return d.created_at >= dateMin && d.created_at < dateMax;
        });
        
        var dataDonate = [{
          "label": "Donate", 
          "type": "donate", 
          "data": _.filter(data, function(d, i) {
            return d.action_type == "donate";
          })
        }]; 

        var tmpDataOtherActions = _.chain(data)
        .filter(function(d, i) {
          return d.action_type != "donate";
        })
        .groupBy(function(d, i) {
          return d.action_type;
        })
        .value(); 

        var dataOtherActions = [
          {"type": "watch" ,"label": "Watch", "data": tmpDataOtherActions["watch"] || []},
          {"type": "pledge", "label": "Pledge", "data": tmpDataOtherActions["pledge"] || []},
          {"type": "read", "label": "Read", "data":  tmpDataOtherActions["read"] || []},
          {"type": "share", "label": "Share", "data":  tmpDataOtherActions["share"] || []}
        ];

        var donate = g.selectAll("g.action-type-donate")
            .data(dataDonate)
        	.enter().append("g") 
        	.attr({
              "class": "action-type-donate action-type",
              "height": height,
              "width": width,
              "transform": function(d, i) {
                var tx = 0,
                    ty = i * height;
                return "translate(" + [tx, ty ] + ")";
              }
        	});


        var others = g.selectAll("g.action-type-others")
            .data(dataOtherActions)
        	.enter().append("g") 
        	.attr({
              "class": "action-type-others action-type",
              "height": height,
              "width": width,
              "transform": function(d, i) {
                var tx = 0,
                    ty = 150 + i * height;
                return "translate(" + [tx, ty ] + ")";
              }
        	});

        var groups = g.selectAll("g.action-type");

        groups.append("text")
            .attr({
              "x": labelPos, 
              "y": height/2 + 3
            })
            .text(function(d, i) {
                return d.label;
            })
        	.style({
              "fill": function(d, i) {
                return scaleColor(d.type);
              },
              "font-size": 18 
            })

        groups.append("text")
            .attr({
              "x": countPos, 
              "y": height/2 + 3,
              "text-anchor": "end"
            })
            .text(function(d, i) {
                return d.data.length;
            })
        	.style({
              "fill": "#666666",
              "font-size": 18 
            })

        groups.append("line")
        	.attr({
              "x1": x0,
              "x2": x0+width,
              "y1": height/2,
              "y2": height/2
            })
        	.style({
              "stroke": "#C9C9C9"
            })

        groups.selectAll("circle")
            .data(function(d, i) {
              return d.data;
            })
        	.enter().append("circle")
            .attr({
              "cx": function(d, i) {
                return scaleTime(d.created_at);
              },
              "r": r,
              "cy": height/2
            })
        	.style({
              "fill": function(d, i) {
                return scaleColor(d.action_type);
              },
              "stroke": function(d, i) {
                return scaleColor(d.action_type);
              },
              "stroke-width": 2,
              "fill-opacity": 0.5
            })

        var axisLabel = g.selectAll("g.axis-label")
        .data([dateMin, dateMax])
        .enter().append("g")
        .attr({
          "class": "axis-label",
          "transform": "translate(0, 20)"
        });

        axisLabel.append("line")
        .attr({
          "x1": scaleTime,
          "x2": scaleTime,
          "y1": 15,
          "y2": 22
        })
        .style({
          "stroke": "#474747",
          "stroke-width": 1
        })

        axisLabel.append("text")
        .attr({
          "transform": function(d, i) {
            var tx = scaleTime(d);
            var ty = 43;
            return "translate(" + [tx, ty] + ")";
          },
          "text-anchor": function(d, i) {
            if (i === 0) { return "start" }
            return "end";
          }
        })
        .style({
          "font-size": 14 ,
          "fill": "#7C7C7C"
        })
        .text(function(d, i) {
          return dateFormatShort(d);
        })

        g.append("text")
        .attr({
          "transform": function() {
            var tx = (width + x0) / 2;
            var ty = 122;
            return "translate(" + [tx, ty] + ")"
          },
          "text-anchor": "middle",
          "class": "heading"
        }) 
        .text(function(d, i) {
          var numActions = _.chain(dataOtherActions)
              .pluck("data")
              .reduce(function(memo, d) {
                 return memo + d.length;
              }, 0)
              .value();
        	return numActions + " Other Actions";
        })
        .style({
          "font-size": 17,
          "fill": "#7C7C7C"
        })

        g.append("line")
        .attr({
          "x1": 0,
          "x2": width + x0,
          "y1": 138,
          "y2": 138
        })
        .style({
          "stroke": "#A0A0A0",
          "stroke-width": 1
        })
    }
    
    
    var showChampion = function(champion, i) {
        _.each(champion.dates, function(d, key) {
            champion.dates[key] = formatDate(new Date(d));
        });
        
        var tmpl = tpl_championDetails; 
        $("#champ-details").html(tmpl(champion));
        
        // Visitors chart
        showVisitorChart(champion);

        // Actions Charts
        showActionsChart(champion.actions || [], d3.selectAll("#section-champion .action-chart svg"));
        showActionsChart(champion.supporter_actions || [], d3.selectAll("#section-visitors .action-chart svg"));
    };
    
    /*var showPreviews = function(data) {
        // SCALES 
        var visitorScale = d3.scale.linear()
            .domain([0, d3.max(_.map(data, function(d) { return d.num_visitors }))])
            .range([0, 80]);


        var tmpl = tpl_championPreview; 
        
        var previews = d3.selectAll('#champ-table').selectAll('.champion-preview')
            .data(data);
        
        var newPreviews = previews.enter().append('div')
            .attr("class", "champion-preview");
            
        previews.html(function(d, i) {
            d.rank = i + 1;
            d.action_bar_width = visitorScale(d.num_visitors)
            d.num_actions = d.num_visitors

            return tmpl(d);
        })
        .on("click", function(d, i) {
            showChampion(d, i);
            d3.selectAll(".selected").classed("selected", false)
            d3.select(this).classed("selected", true);
        });
        
        previews.exit().remove()
        
    } */


    var data = d3.json("data/champs-reacttofilm.json", function(data) {

        var chart = d3.select("#chart");

        var selected_champ = data[0];
        var selected_actions = selected_champ.actions;

        /*var cw = 500; 
        var ch = 170;
        var dw = 10;
        var dh = 10;
        var offset = 105;
        var dopq = 0.75;
        var rowheight = 18;
        var fontsize = 12;*/
    
        // DATA TRANSFORMATIONS
        var data = _.chain(data)
        .map(function(champion, i) {
            var numActions = champion.actions ? champion.actions.length : 0;
            var champActions = _.groupBy(champion.actions, function(d) { return d.action_type });
            var actionCounts = _.chain(actions)
            .map(function(action) {
                var count = champActions[action] ? champActions[action].length : 0;
                if (numActions == 0 || count == 0) {
                    return {
                        "count": 0,
                        "percent": 0
                    };
                }
                return {
                    "count": count,
                    "percent": Math.round(100 / numActions * count),
                    "action_type": action
                };
            })
            .filter(function(action) {
                return action.count > 0;
            })
            .value();
        
            champion.num_visitors = champion.total_visitors ? _.reduce(_.values(champion.total_visitors), function(memo, num) { return memo + num }, 0) : 0;
            champion.actionCounts = actionCounts;
            champion.rank = i+1;
            champion.followers_count = champion.followers_count || 0;
            champion.location = champion.location || "(unknown)";
            champion.gender = champion.gender ? champion.gender : "(unknown)";
            champion.gender_pronoun = champion.gender == "female" ? "Her" : "His";
            champion.num_visitors = champion.total_visitors ? _.reduce(_.values(champion.total_visitors), function(memo, num) { return memo + num }, 0) : 0;
            champion.is_new = champion.dates.became_champ ? new Date(champion.dates.became_champ).add(2).weeks() > dateMax : false;
            var channel = _.reduce(champion.visitors, function(memo, num, key) {
                    _.each(["email", "facebook", "twitter"], function(d, i) {
                        memo[d] += num[d] || 0;
                    })
                    return memo;
                }, {
                    "facebook": 0,
                    "twitter": 0,
                    "email": 0
                });
            champion.channel = channel.facebook > channel.twitter ? (channel.facebook > channel.email ? "facebook" : "email") : (channel.twitter > channel.email ? "twitter" : "email");
            champion.channel_aggregate = channel;
            champion.percent_new_supporters = 0;
            if (champion.num_visitors > 0) {
                champion.percent_new_supporters = format(100 / champion.num_visitors * champion.supporters);
            }

            return champion;
        })
        .sortBy(function(d, i){
            return -d.num_visitors;
        })
        .value();
        
        //THE CHAMP TABLE
        showPreviews(data);

        // toggle popovers for actions
        $(".actions-bar-stacked").popover("hide");
        $('#radio-filter-new button').click(function(ev) {
            var target = $(this).attr('id');
            isFilterForNewOnly = target == "new";
            var tmpData = _.filter(data, function(d, i){
                if (isFilterForNewOnly) {
                    return d.is_new;
                }
                return true;
            });
            showPreviews(tmpData);
            showChampion(tmpData[0], 0);
        });
        
        var channelAggregate = _.chain(data)
        .pluck("channel_aggregate")
        .reduce(function(memo, num) {
            _.each(num, function(val, key) {
                memo[key] += val;
            });
            
            return memo;
        } , {
            "facebook": 0,
            "twitter": 0,
            "email": 0
        })
        .value();
        
        $("#date-range div").html(formatDateLong(dateMin) + " - " + formatDateLong(dateMax));
        $("#aggregate .number-highlight").html(_.chain(channelAggregate).values().reduce(function(memo, num) { return memo + num }, 0).value())

        showAggregateSummary(channelAggregate);
        showChampion(data[0], 0);
    });
    
});


