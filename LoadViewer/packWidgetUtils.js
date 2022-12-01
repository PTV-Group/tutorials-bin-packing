/** Creates random items for testing purposes
 * @method createRandomItems
 * @param n number of items
 * @param bin the bin which holds the items
 * @param maxWidth max width of a single item
 * @param maxHeight max height of a single item
 * @param maxDepth max depth of a single item
 * @return the created items
 */
function tooltip(x, y, text, item) {
  $('#pw-tooltip').data("item", item);
  
  if ($('#pw-tooltip').length == 0) {
    $("body").append("<div style=\"position: fixed; pointerEvents: none; padding: 2px; zIndex: 2; border: 1px solid black; background: #FFF; color: #000;\" id=\"pw-tooltip\"></div>");
  }

  $('#pw-tooltip').show().css('left', x + 'px').css('top', y + 'px').html(text);  
}

function removeTooltip (item)
{
  if ($('#pw-tooltip').data("item") == item) {
    $("#pw-tooltip").hide();
  }
}

/** Creates some random items for testing purposes
 * @method createRandomItems
 * @param n number of items
 * @param n bin to determine coordinates from
 * @param maxWidth max width of an item
 * @param maxHeight max height of an item
 * @param maxDepth max depth of an item
 * @return item array
 */
function createRandomItems(n, bin, maxWidth, maxHeight, maxDepth) {
    var items = [];
    for (var i = 0; i < n; i++) {
        var itemWidth = Math.random() * maxWidth;
        var itemHeight = Math.random() * maxHeight;
        var itemDepth = Math.random() * maxDepth;
        items[i] = {
          x: (bin.x) + Math.random() * (bin.width - itemWidth),
          y: (bin.y) + Math.random() * (bin.height - itemHeight),
          z: (bin.z) + Math.random() * (bin.depth - itemDepth),
          width: itemWidth,
          height: itemHeight,
          depth: itemDepth,
          color: Math.random() * 0xffffff,
          dataItem: null,
          visible:true
        };
      }
      return items;
}

/** Highlights an item with the given colorMask
 * @method highlightItem
 * @param item the item to be highlighted
 * @param color the color the item should be highlighted
 */
function highlightItem(item, color) {
  item.graphicsItem.material.color.set(color);
}

/** Unhighlights an item
 * @method unhighlightItem
 * @param item the item to be unhighlighted
 */
function unhighlightItem(item) {
  item.graphicsItem.material.color.set(item.color);
}

/** makes a shape out of a rect and cutting lines
 * @method cutout
 * @param width width of the rect
 * @param height height of the rect
 * @param lines lines that cut the rect
 * @return a path that describes the shape
 */
function cutOut(width, height, lines) {
  var shape = rectToShape(width, height);
  var newLines = [];
  
  if (lines !== undefined) {
    for (var i = 0; i < lines.length; i++) { 
      newLines[i] = {start: {x: lines[i]["lat1"], y: lines[i]["height1"]}, end: { x: lines[i]["lat2"], y: lines[i]["height2"]}};
    }
  }

  for(var i = 0; i < newLines.length; i++) {
    shape = cut(JSON.parse(JSON.stringify(shape)), newLines[i]);
  }
  
  return shape;
}

/** Cuts a shape with a single line
 * @method cut
 * @param shape
 * @param line
 * @return new shape
 */
function cut(shape, line) {
    var points;
  
    shape = JSON.parse(JSON.stringify(shape));
    var tempShape = [];// JSON.parse(JSON.stringify(shape));
    shape.push(shape[0]);
    for(var i = 0; i < shape.length - 1; i++) {
	tempShape.push(shape[i]);
	var result = checkLineIntersection(shape[i].x, shape[i].y, shape[i+1].x, shape[i+1].y,
					   line.start.x, line.start.y, line.end.x, line.end.y);

	if(result.intersects) {
	    points = line;
	    tempShape.push({x: result.x, y: result.y});
	}
    }

    var newShape;
    if(points !== undefined)
	newShape = getNewShape(tempShape, points);
    else
	newShape = shape;
    
	return newShape;
}

/** helper function to delete obsolete points from a shape cut by a line
 * @param shape
 * @param line
 * @return 
 */
function getNewShape(shape, line) {
    var newShape = [];
    for(var i = 0; i < shape.length; i++) {
	if(!(isLeft(line.start, line.end, shape[i])))
	   newShape.push(shape[i]);
    }

    return newShape;
}

/** Checks if a is left of the line given by b and c
 * @method isLeft
 * @param a
 * @param b
 * @param c
 * @return true if a is left, false otherwise
 */
function isLeft(a, b, c) {
    return ((b.x - a.x)*(c.y - a.y) -
	    (b.y - a.y)*(c.x - a.x)) > 0.1 ?
	    true : false;
}

/** Converts a rect to a shape
 * @method rectToShape
 * @param width width of the rect
 * @param height height of the rect
 * @return path of shapoe
 */
function rectToShape(width, height) {
    return [
	{x: 0, y: 0},
	{x: 0, y: height},
	{x: width, y: height},
	{x: width, y: 0}
    ];
}

/** Checks if two lines intersect
 * @param lineStartX
 * @param lineStartY
 * @param lineEndX
 * @param lineEndY
 * @param line2StartX
 * @param line2StartY
 * @param line2EndX
 * @param line2EndY
 * @return object width intersection point
 */

function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
        var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        intersects: false
        };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));

    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.intersects = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.intersects = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
}


