/**
 * Maps given data to items specified by mapping
 * @method mapItems
 * @param data The data to be mapped
 * @param The mapping object to be used
 * @return the mapped items.
 */
var mapItems = function(data, mapping) {
  // var mapping = mapping;
  var items = [];
  for (var i = 0; i < data.length; i++) {
    var element = data[i];

    var properties = {};
    for (m in mapping) {
	properties[m] = traverseMapping(element, mapping[m], properties);
    }
    //console.log(properties);


    var width, height, depth;

    if(properties.x_length != undefined)
      width = parseFloat(properties.x_length);
    else
      width = parseFloat(properties.x_end) - parseFloat(properties.x_start);

    if(properties.y_length != undefined)
      height = parseFloat(properties.y_length);
    else
      height = parseFloat(properties.y_end) - parseFloat(properties.y_start);

      if(properties.z_length != undefined)
	depth = parseFloat(properties.z_length);
      else
	  depth = parseFloat(properties.z_end) - parseFloat(properties.z_start);

    var color = parseInt(properties.color, 16);
    var item = new Item(parseFloat(properties.x_start),
                        parseFloat(properties.y_start),
                        parseFloat(properties.z_start),
                        width, height, depth, color, element);
    items.push(item);
  }
  //console.log(items);
  return items;
};

function mapBins(data, mapping) {
	var bins = [];
	for (var i = 0; i < data.length; i++) {
		var element = data[i];
		
		var properties = {};
		for (m in mapping) {
			properties[m] = traverseMapping(element, mapping[m], properties);
		}
		
		var width, height, depth;
		width = parseFloat(properties.x_length);
		depth = parseFloat(properties.z_length);
		height = parseFloat(properties.y_length);
		var color = parseInt(properties.color, 16);
	
	    var shape = properties.shape;
	    var bin;
	    if(shape === undefined) {
		bin = new Bin(parseFloat(properties.x_start),
				  parseFloat(properties.y_start),
				  parseFloat(properties.z_start),
				  width, height, depth, color);
	    }
	    else {
		bin = new BinShaped(parseFloat(properties.x_start),
				       parseFloat(properties.y_start),
				       parseFloat(properties.z_start),
				       shape, depth, color);	
	    }
		bins.push(bin);
	}
	return bins;
}

/**
 * This method finds the specific information in json data on the basis of the mapping. E.g. you need x,y coordinates from array with some POIs. data:{pos:[{xCoord:"1",yCoord:"2"}...]}
 * @method traverseMapping
 * @param root is the start parameter in json file. E.g. "data".
 * @param mapping is the reference path to the target data. E.g. x = "["pos", "xCoord"]"
 * @return target the value of founded data. E.g. x = 1 or undefined
 */
 function traverseMapping (root, currentMap, properties) {
   if (typeof currentMap == "function")
    return currentMap(root);

    if(currentMap == undefined)
      return undefined;

    if(typeof currentMap == 'number' || typeof currentMap == 'string') {
      return currentMap;
    }
    var target, j;
    target = root;
    for (j = 0; j < currentMap.length; j++) {
        target = target[currentMap[j]];
    }
    return target;
};
