"use strict";


	function helloWorld()
	{
		return "dupa";
	}

	$(document).ready(function() {
	
		describe("Hello world", function() {
			it("says hello", function() {
			
				$('.bricks li:first-child').click();
				
				expect(helloWorld()).toEqual("dupa");
				
			});
		});
	});
	
	
	function Tank(paper,startX,startY,endX,endY) {
	
		this.startX=startX;
		this.startY=startY;
		
		this.endX=endX;
		this.endY=endY;
		
		this.paper=paper;
		
		this.trajectory=paper.path();
		
		return this;
	}
	
	Tank.prototype.setPosition=function(startX,startY,endX,endY)
	{
		this.startX=startX;
		this.startY=startY;
		
		this.endX=endX;
		this.endY=endY;
	};
	
	Tank.prototype.drawTank=function() {
		
		// draw tank here
		
		this.circle=this.paper.circle(this.startX,this.startY,20,20);	
		this.circle.attr("fill", "red");

		var tank=this;
		
		$(this.circle.node).click(function(e) {
		
			console.log(tank.startX);
		
		});
	};
	
	Tank.prototype.activate=function() {
	
		this.circle.attr("fill", "green");
		
		var t=this;
		
		this.trajectory.show();
		
		this.paper.canvas.onmousemove=function(e) {
		
			t.trajectory.attr({path:"M"+t.startX+","+t.startY+"L"+e.pageX+","+e.pageY});
		
		};
	};
	
	Tank.prototype.deactivate=function() {
	
		this.trajectory.hide();
		this.circle.attr("fill", "red");
		
	};
	
	Tank.prototype.onClick=function(onClick) {
	
		this.circle.node.onclick=onClick;
		
	};
	
	
	// main game framework code
	
	var game=game || {};
	
	var tanks=[];
	
	game.framework=(function($,undefined) {
	
		function init() {

			// Creates canvas 320 × 200 at 10, 50
			var paper = Raphael(document.getElementById("myDrawing"), 800,600);

			var tank=new Tank(paper);
			
			tank.setPosition(100,100,100,100);
			tank.drawTank();
						
			// add tanks
			
			tanks.push(
				new Tank(paper,100,100,10,10),
				new Tank(paper,200,200,20,20),
				new Tank(paper,300,100,50,50),
				new Tank(paper,300,300,30,30)
			);
		
			for(var i=0;i<tanks.length;i++)
			{
				tanks[i].drawTank();
				
				(function(i) {
					tanks[i].onClick(function(e) {
				
					activateTank(i);
					
				})})(i);
			}		
		};
	
		function activateTank(id)
		{
			for(var i=0;i<tanks.length;i++)
			{
				//tanks[i]["startX"]
				
				i==id ? tanks[i].activate() : tanks[i].deactivate();
			}
		}
		
		return {
			init	: 	init
		};
	
	})(jQuery);
	
	
	$(document).ready(function() {
	
		
		game.framework.init();
		
		return;
		
		// Creates circle at x = 50, y = 40, with radius 10
		var circle = paper.circle(500,100,500);
		// Sets the fill attribute of the circle to red (#f00)
		circle.attr("fill", "#0bf");

		// Sets the stroke attribute of the circle to white
		circle.attr("stroke", "#fff");
		
		var tetronimo=paper.path("M 250 250 l 0 -50 l -50 0 l 0 -50 l -50 0 l 0 50 l -50 0 l 0 50 z");  
		
		tetronimo.attr({fill: '#9cf', stroke: '#ddd', 'stroke-width': 5});
		
tetronimo.animate({
    path: "M 250 250 l 0 -50 l -50 0 l 0 -50 l -100 0 l 0 50 l 50 0 l 0 50 z"
}, 5000, 'elastic');



	});