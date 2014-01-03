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
		
		this.isActive=false;
		
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
		
		//this.circle=this.paper.circle(this.startX,this.startY,20,20);	
		this.circle=this.paper.image("images/tank.png",this.startX-20,this.startY-5,40,21);	
				
		//this.circle.attr("fill", "red");

		var tank=this;
		
		$(this.circle.node).click(function(e) {
		
			//console.log(tank.startX);
		
		});
	};
	
	Tank.prototype.activate=function() {
	
		this.circle.attr("fill", "green");
		
		var t=this;
		
		this.trajectory.show();
		
		this.paper.canvas.onmousemove=function(e) {
		
	//	if(t.paper.getElementByPoint(e.pageX,e.pageY)!=null)
		//	console.log(e.pageX,e.pageY);
			var rect = t.paper.canvas.getBoundingClientRect();
			//t.trajectory.attr({path:"M"+t.startX+","+t.startY+"l"+(e.pageX-t.startX-rect.left-scrollX)+","+(e.pageY-t.startY-rect.top-scrollY)});
			t.trajectory.attr({path:"M"+t.startX+","+t.startY+"L"+(e.pageX-rect.left-scrollX)+","+(e.pageY-rect.top-scrollY), "clip-rect": ""+t.startX+","+t.startY+"20 20"});
			//t.paper.path("M"+t.startX+","+t.startY+"l"+(e.pageX-rect.left-scrollX-t.startX)+","+(e.pageY-rect.top-scrollY-t.startY));
			
		};
		
		this.isActive=true;
		
		this.paper.canvas.onclick=function(e) {
		
			if(t.isActive)
			{
				// get mouse distance from center of tank
				
				var rect = t.paper.canvas.getBoundingClientRect();
				var distX=e.pageX-rect.left-scrollX-t.startX;
				var distY=e.pageY-rect.top-scrollY-t.startY;
				
				t.shoot(distX,distY);
			}
		};
	};
	
	Tank.prototype.deactivate=function() {
	
		this.trajectory.hide();
		this.circle.attr("fill", "red");
		
		this.isActive=false;
		
	};
	
	Tank.prototype.onClick=function(onClick) {
	
		this.circle.node.onclick=onClick;
		
	};
	
	Tank.prototype.shoot=function(horiz,vert) {
		
		if(this.isActive)
		{
			// calculate trajectory
			
			var trajectory=[];
			var a=0,y=this.startY,x=this.startX+horiz,acceleration=0;
			/*
			while(a<100)
			{
				//y+=acceleration;

				//y+=a*9.8;
				
				y=-vert*a+0.5*9.8*Math.pow(a,2);
				
				trajectory.push({"x":x,"y":y});
				
				x+=horiz;
				acceleration+=9.8;
				a++;
			}
			
			*/
			a=1;
			trajectory=[["M"+this.startX,this.startY,"R"]];
			
			//vert-=this.startY;
			
			var highestPoint=0;
			
			while(a<100)
			{				
				y=vert*a+0.5*9.8*Math.pow(a,2)+this.startY;
				
				// check if the path hit any obstacle
				
				
				//var x=Raphael.getPointAtLength(normalized_path,step).x;
				//var y=Raphael.getPointAtLength(normalized_path,step).y;
					
				
				trajectory.push([x,y]);
				
				x+=horiz;
				a++;
				
				//console.log(this.paper.getElementByPoint(300,300));
				//console.log(x+100,y+100);
				
				// later when animating the bullet we need to slow it down as it goes up and speed up as it goes down. To do this we will need to interpolate values between beginning/highest and highest lowest. To do that we need to know the highest point so in here as we calculate gravity we also keep track of highest point so dont have to do the same work later
				
				if(y<trajectory[highestPoint][1])	highestPoint=a;
				//console.log(trajectory[highestPoint][1]);
			}
			
			//console.log(trajectory.toString());
			this.drawTrajectory(trajectory, highestPoint);
		}
		
		return false;
	};
	
	
	Tank.prototype.drawTrajectory=function(trajectory, highestPoint) {
		
		var penPosition={x:this.startX,y:this.startY};
		var trajectoryPoint;
		var trajectoryPath;
		
		// convert points we calculated into actual path
		
		var arr=Raphael.path2curve(trajectory);
		
		// and make it into a string so we can pass it further to different methods
		
		var normalized_path = arr.toString();

		//var normalized_path = "m,10,10,l,200,0,L,217,56.9,L,234,123.6,L,251,200.1,L,268,286.4,L,285,382.5";
		//normalized_path="M,"+this.startX+","+this.startY+",L,-400,0,L,-404,-5.1,L,-408,-0.3999999999999986,L,-412,14.100000000000001";

		// path might be very long so we need to cut it off as ssoon as we detect it collides with something
		
		var path1;
		var cutOff=false;
		
		var l=Raphael.getTotalLength(normalized_path);
		var pointOnPath=[];
		
		for(var i=0;i<l;i++)
		{
			var point=Raphael.getPointAtLength(normalized_path,i);
			var pointX=point.x;
			var pointY=point.y;
			
			//var el=this.paper.getElementByPoint(pointX+101,pointY+101);
			var el=document.elementFromPoint(pointX+101,pointY+101);

			pointOnPath.push([pointX,pointY]);
		
			//console.log(Raphael.getPointAtLength(normalized_path,i).y);
			
			if((el!==null && el.nodeName!=="path" && el.nodeName!=="svg" && el!==this.circle[0]) || pointX>this.paper.width  || pointY>this.paper.height)
			{
				normalized_path = Raphael.getSubpath(normalized_path, 0, i);
				
				l=Raphael.getTotalLength(normalized_path);
				
				path1 = this.paper.path(normalized_path).attr({stroke: "red", "stroke-width":1});
				
				cutOff=true;
				
				break;
			}
		}
		
		if(!cutOff) path1=this.paper.path(normalized_path).attr({stroke: "ffcccc", "stroke-width":1});
		
		// animate bullet 
		
		trajectoryPoint=this.paper.circle(0,0,5,5);
		
		//console.log(Math.max.apply(null,[10,20,30,22,33,12,1]));
				
		var step=0;
		var t=this;
		
		(function animateBullet() {
		
		//	console.log(speed);
			var animation=setInterval(function() {
			
				//var x=Raphael.getPointAtLength(normalized_path,step).x;
				//var y=Raphael.getPointAtLength(normalized_path,step).y;
					
				//console.log(t.paper.getElementByPoint(x+scrollX+t.startX,y+scrollY+t.startY));
				//console.log(x,y);
				//console.log(x+scrollX+100+t.startX,y+scrollY+100+t.startY);
				//console.log(t.paper.getElementByPoint(400,400));
					
				if(step<l)
				{	
					trajectoryPoint.transform("t"+pointOnPath[step][0]+","+pointOnPath[step][1]);
					//animation=trajectoryPoint.animate({cx: trajectory[step]["x"], cy:trajectory[step]["y"]}, 1000, "linear");
					step+=3;
				}			
				else 
				{
					trajectoryPoint.remove();
					path1.remove();
					
					clearInterval(animation);
					return;
				}
				
			},0);
		
		})();
		
		
		/*
			(function() {
			var step=0;
			
			var animation=setInterval(function animateTo()
			{
			console.log(speed[step]);
				var x=Raphael.getPointAtLength(normalized_path,step).x;
				var y=Raphael.getPointAtLength(normalized_path,step).y;
				
				if(step<70)
				{	
					trajectoryPoint.transform("T"+x+","+y);
					//animation=trajectoryPoint.animate({cx: trajectory[step]["x"], cy:trajectory[step]["y"]}, 1000, "linear");
					step++;
				}
				else
				{
					clearInterval(animation);
					return;
				}
			},speed[step]);
			
				//trajectoryPoint.animate({fill: "blue", transform: "s2.0"}, 1000, "linear");; 
		
		})(speed);
			*/
		
	};
	
	
	
	Tank.prototype.drawTrajectory_old=function(trajectory, highestPoint) {
		
		var penPosition={x:this.startX,y:this.startY};
		var trajectoryPoint;
		var trajectoryPath;
		
		// convert points we calculated into actual path
		
		var arr=Raphael.path2curve(trajectory);
		
		// and make it into a string so we can pass it further to different methods
		
		var normalized_path = arr.toString();

		//var normalized_path = "m,10,10,l,200,0,L,217,56.9,L,234,123.6,L,251,200.1,L,268,286.4,L,285,382.5";
		//normalized_path="M,"+this.startX+","+this.startY+",L,-400,0,L,-404,-5.1,L,-408,-0.3999999999999986,L,-412,14.100000000000001";

		// path might be very long so we need to cut it off as ssoon as we detect it collides with something
		
		var path1;
		var cutOff=false;
		
		var l=Raphael.getTotalLength(normalized_path);
		var pointOnPath=[];
		
		for(var i=0;i<l;i++)
		{
			var point=Raphael.getPointAtLength(normalized_path,i);
			var pointX=point.x;
			var pointY=point.y;
			
			var el=this.paper.getElementsByPoint(pointX,pointY);

			pointOnPath.push([pointX,pointY]);
		
			//console.log(Raphael.getPointAtLength(normalized_path,i).y);
			
			if((el.length && el[0]!==this.circle &&  el[0].type!=="path") || pointX>this.paper.width  || pointY>this.paper.height)
			{
				normalized_path = Raphael.getSubpath(normalized_path, 0, i);
				
				l=Raphael.getTotalLength(normalized_path);
				
				path1 = this.paper.path(normalized_path).attr({stroke: "red", "stroke-width":1});
				
				cutOff=true;
				
				break;
			}
		}
		
		if(!cutOff) path1=this.paper.path(normalized_path).attr({stroke: "red", "stroke-width":1});
		
		// get highest point

		highestPoint=this.startY;
		
		var stepsUp=0;
		
		for(;stepsUp<l;stepsUp++)
		{
			if(highestPoint>path1.getPointAtLength(stepsUp).y)
				highestPoint=path1.getPointAtLength(stepsUp).y;
			else break;
		}
		
				
		// also interpolate between beginning and highest point, and highest point and ending
		
		// createarray of interpolated values as many as we need to get to highest point
		
		var speed=[];
		
		var minSpeed=30; // 1sec
		var maxSpeed=1; // 0.01sec
		
		for(var i=0;i<=stepsUp;i++)
		{
			//speed.push(i/stepsUp*minSpeed);
			speed.push(0);
		}
		
		var tillEnd=l-stepsUp;
		
		for(var i=tillEnd;i>0;i--)
		{
			//speed.push(i/tillEnd*minSpeed);
			
			speed.push(0);
		}
		
		//console.log(speed);
		
		/*
		//for(var i=0;i<normalized_path.length;i++)
		for(var i=0;i<100;i++)
		{
			var x=Raphael.getPointAtLength(normalized_path,i).x;
			var y=Raphael.getPointAtLength(normalized_path,i).y;
			
			trajectoryPoint=this.paper.circle(x,y,5,5);	
		
		
			//console.log(this.penPosition.x+"    "+penPosition.y);
				
			//var trajectoryPoint=this.paper.circle(this.startX+trajectory[i]["x"],this.startY+trajectory[i]["y"],1,1);	
		//	trajectoryPath=this.paper.path("M"+penPosition.x+" "+penPosition.y+"L"+(this.startX+trajectory[i]["x"])+" "+(this.startY+trajectory[i]["y"]));	
			//trajectoryPoint.attr("fill", "blue");
			
				trajectoryPath=this.paper.path("M"+penPosition.x+" "+penPosition.y+"L"+(this.startX+trajectory[i]["x"])+" "+(this.startY+trajectory[i]["y"]));	
			trajectoryPoint.attr("fill", "blue");
			
			
			penPosition.x=this.startX+trajectory[i]["x"];
			penPosition.y=this.startY+trajectory[i]["y"];
			console.log(trajectory[i]["x"]);
			
		}	
		*/
		
		// animate bullet 
		
		trajectoryPoint=this.paper.circle(0,0,5,5);
		
		//console.log(Math.max.apply(null,[10,20,30,22,33,12,1]));
				
		var step=0;
		var t=this;
		
		(function animateBullet(s) {
		
		//	console.log(speed);
			setTimeout(function() {
			
				//var x=Raphael.getPointAtLength(normalized_path,step).x;
				//var y=Raphael.getPointAtLength(normalized_path,step).y;
					
				//console.log(t.paper.getElementByPoint(x+scrollX+t.startX,y+scrollY+t.startY));
				//console.log(x,y);
				//console.log(x+scrollX+100+t.startX,y+scrollY+100+t.startY);
				//console.log(t.paper.getElementByPoint(400,400));
					
				if(step<s.length)
				{	
					trajectoryPoint.transform("t"+pointOnPath[step][0]+","+pointOnPath[step][1]);
					//animation=trajectoryPoint.animate({cx: trajectory[step]["x"], cy:trajectory[step]["y"]}, 1000, "linear");
					step+=2;
				}			
				else 
				{
					trajectoryPoint.remove();
					path1.remove();
					return;
				}
				
				animateBullet(s);
			}, (typeof s==="undefined" ? 1 : s[step]));
		
		})(speed);
		
		
		/*
			(function() {
			var step=0;
			
			var animation=setInterval(function animateTo()
			{
			console.log(speed[step]);
				var x=Raphael.getPointAtLength(normalized_path,step).x;
				var y=Raphael.getPointAtLength(normalized_path,step).y;
				
				if(step<70)
				{	
					trajectoryPoint.transform("T"+x+","+y);
					//animation=trajectoryPoint.animate({cx: trajectory[step]["x"], cy:trajectory[step]["y"]}, 1000, "linear");
					step++;
				}
				else
				{
					clearInterval(animation);
					return;
				}
			},speed[step]);
			
				//trajectoryPoint.animate({fill: "blue", transform: "s2.0"}, 1000, "linear");; 
		
		})(speed);
			*/
		
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